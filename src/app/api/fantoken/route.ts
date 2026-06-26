import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { Prisma } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    let fanToken = await prisma.fanToken.findFirst({ where: { userId: session.sub } })
    if (!fanToken) {
       fanToken = await prisma.fanToken.create({
         data: { userId: session.sub }
       })
    }

    return NextResponse.json({ success: true, data: fanToken })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch FanToken" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const { action, amount, toAddress } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be greater than 0" }, { status: 400 })
    }

    const userId = session.sub
    let fanToken = await prisma.fanToken.findFirst({ where: { userId } })
    
    if (!fanToken) {
      fanToken = await prisma.fanToken.create({ data: { userId } })
    }

    const decimalAmount = new Prisma.Decimal(amount)

    // Demo Mode: Mocking Smart Contract Logic inside PostgreSQL DB
    const result = await prisma.$transaction(async (tx) => {
      
      if (action === "mint") {
        if (session.role !== "ADMIN") throw new Error("Only Admin can mint")
        
        return tx.fanToken.update({
          where: { id: fanToken.id },
          data: { tokenBalance: { increment: decimalAmount } }
        })
      }
      
      else if (action === "burn") {
        if (fanToken.tokenBalance.lessThan(decimalAmount)) throw new Error("Insufficient balance to burn")
        
        return tx.fanToken.update({
          where: { id: fanToken.id },
          data: { tokenBalance: { decrement: decimalAmount } }
        })
      }
      
      else if (action === "stake") {
        if (fanToken.tokenBalance.lessThan(decimalAmount)) throw new Error("Insufficient balance to stake")
        
        return tx.fanToken.update({
          where: { id: fanToken.id },
          data: { 
            tokenBalance: { decrement: decimalAmount },
            stakedAmount: { increment: decimalAmount }
          }
        })
      }
      
      else if (action === "unstake") {
        if (fanToken.stakedAmount.lessThan(decimalAmount)) throw new Error("Insufficient staked balance")
        
        // Mock reward calculation: 10% of unstaked amount just for demo purposes
        const reward = decimalAmount.mul(0.1)

        return tx.fanToken.update({
          where: { id: fanToken.id },
          data: { 
            tokenBalance: { increment: decimalAmount },
            stakedAmount: { decrement: decimalAmount },
            rewardAmount: { increment: reward }
          }
        })
      }
      
      else if (action === "transfer") {
        if (!toAddress) throw new Error("Missing toAddress for transfer")
        if (fanToken.tokenBalance.lessThan(decimalAmount)) throw new Error("Insufficient balance to transfer")
        
        const recipientUser = await tx.user.findFirst({ where: { walletAddress: toAddress } })
        if (!recipientUser) throw new Error("Recipient not found with that wallet address")
        
        let recipientToken = await tx.fanToken.findFirst({ where: { userId: recipientUser.id } })
        if (!recipientToken) {
          recipientToken = await tx.fanToken.create({ data: { userId: recipientUser.id } })
        }

        await tx.fanToken.update({
          where: { id: fanToken.id },
          data: { tokenBalance: { decrement: decimalAmount } }
        })

        await tx.fanToken.update({
          where: { id: recipientToken.id },
          data: { tokenBalance: { increment: decimalAmount } }
        })

        return { message: "Transfer successful" }
      }
      
      else {
        throw new Error("Invalid action")
      }
    })

    return NextResponse.json({ success: true, data: result })

  } catch (error: any) {
    console.error("POST /api/fantoken error:", error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
