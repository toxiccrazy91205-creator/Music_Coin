import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { Prisma } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only Admins or System accounts can trigger autonomous distributions" }, { status: 403 })
    }

    const { smartContractId, revenueAmount } = await request.json()

    if (!smartContractId || !revenueAmount) {
      return NextResponse.json({ error: "smartContractId and revenueAmount are required" }, { status: 400 })
    }

    const amountToDistribute = new Prisma.Decimal(revenueAmount)
    if (amountToDistribute.lte(0)) {
      return NextResponse.json({ error: "Revenue amount must be greater than zero" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Load the Smart Contract Split definition
      const contract = await tx.smartContractSplit.findUnique({
        where: { id: smartContractId }
      })

      if (!contract) throw new Error("Smart Contract Split not found")

      // 2. Helper function to process a split payout
      const processPayout = async (userId: string | null, percentage: number) => {
        if (!userId || percentage <= 0) return null
        
        const wallet = await tx.wallet.findUnique({ where: { userId } })
        if (!wallet) throw new Error(`Wallet not found for user ${userId}`)

        const splitDecimal = new Prisma.Decimal(percentage).dividedBy(100)
        const payoutAmount = amountToDistribute.mul(splitDecimal)

        // Increment Balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: payoutAmount } }
        })

        // Log the autonomous payment
        await tx.transaction.create({
          data: {
            senderId: wallet.id, // In a true SC, this would be a Contract Pool Wallet. For now, self-reference or system wallet.
            receiverId: wallet.id,
            amount: payoutAmount,
            type: "ROYALTY_PAYMENT"
          }
        })

        return { userId, amount: payoutAmount.toString() }
      }

      // 3. Execute 5-Way Autonomous Split
      const payouts = []
      payouts.push(await processPayout(contract.artistId, contract.artistPercentage))
      payouts.push(await processPayout(contract.producerId, contract.producerPercentage))
      payouts.push(await processPayout(contract.labelId, contract.labelPercentage))
      payouts.push(await processPayout(contract.productionHouseId, contract.productionHousePercentage))
      payouts.push(await processPayout(contract.organizerId, contract.organizerPercentage))

      // 4. Update total revenue tracked on the contract
      await tx.smartContractSplit.update({
        where: { id: contract.id },
        data: { totalRevenue: { increment: amountToDistribute } }
      })

      return payouts.filter(p => p !== null)
    })

    return NextResponse.json({ 
      success: true, 
      message: "Revenue autonomously distributed across stakeholders!",
      data: result
    })

  } catch (error: any) {
    console.error(`Revenue Distribution Error:`, error)
    return NextResponse.json({ error: error.message || "Failed to distribute revenue" }, { status: 500 })
  }
}
