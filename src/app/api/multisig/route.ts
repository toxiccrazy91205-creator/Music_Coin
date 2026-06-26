import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { Prisma } from "@prisma/client"
import { WalletService } from "@/features/wallet/wallet.service"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only Admins can propose MultiSig transactions" }, { status: 403 })
    }

    const { walletId, targetAddress, amount } = await request.json()

    if (!walletId || !targetAddress || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid transaction details" }, { status: 400 })
    }

    const requestObj = await prisma.multiSigRequest.create({
      data: {
        proposerId: session.sub,
        walletId,
        targetAddress,
        amount: new Prisma.Decimal(amount),
        approvalsCount: 1, // The proposer automatically signs
      }
    })

    return NextResponse.json({ success: true, data: requestObj })
  } catch (error: any) {
    console.error("MultiSig Propose Error:", error)
    return NextResponse.json({ error: "Failed to propose transaction" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only Admins can sign MultiSig transactions" }, { status: 403 })
    }

    const { requestId } = await request.json()

    const requestObj = await prisma.multiSigRequest.findUnique({ where: { id: requestId } })
    if (!requestObj) return NextResponse.json({ error: "Request not found" }, { status: 404 })

    if (requestObj.status !== "PENDING") {
      return NextResponse.json({ error: "Transaction is already " + requestObj.status }, { status: 400 })
    }

    let newStatus = "PENDING"
    const newCount = requestObj.approvalsCount + 1
    
    // Check if we hit the required threshold (e.g. 2) to execute
    if (newCount >= 2) {
      newStatus = "EXECUTED"
      
      // Look up target wallet by address (in a real app you'd verify it's a valid MusicCoin wallet or broadcast on chain)
      const targetWallet = await prisma.wallet.findFirst({ where: { user: { walletAddress: requestObj.targetAddress } } })
      if (!targetWallet) {
          throw new Error("Target wallet not found on platform")
      }
      
      // Execute the actual database transfer
      await WalletService.executeWalletTransfer(
          requestObj.walletId, 
          targetWallet.id, 
          new Prisma.Decimal(requestObj.amount)
      )
    }

    const updatedRequest = await prisma.multiSigRequest.update({
      where: { id: requestId },
      data: {
        approvalsCount: newCount,
        status: newStatus
      }
    })

    return NextResponse.json({ success: true, data: updatedRequest })
  } catch (error: any) {
    console.error("MultiSig Approve Error:", error)
    return NextResponse.json({ error: error.message || "Failed to approve transaction" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const requests = await prisma.multiSigRequest.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: requests })
  } catch (error: any) {
    console.error("MultiSig GET Error:", error)
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}
