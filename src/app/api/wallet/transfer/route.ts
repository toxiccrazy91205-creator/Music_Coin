import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

async function getUserId(request: Request): Promise<string> {
  const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
  if (!token) throw new Error("Not authenticated")
  const { jwtVerify } = await import("jose")
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
  return payload.sub as string
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const { receiverEmail, amount } = body

    if (!receiverEmail || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid request. receiverEmail and positive amount required" },
        { status: 400 },
      )
    }

    const { WalletService } = await import("@/features/wallet/wallet.service")
    const { prisma } = await import("@/lib/prisma")

    const senderWallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!senderWallet) {
      return NextResponse.json({ success: false, error: "Wallet not found" }, { status: 404 })
    }

    const input = receiverEmail.trim()
    let receiverWallet = null
    let receiverUserId = ""

    // Try to find by email first (case insensitive)
    const receiver = await prisma.user.findFirst({ 
      where: { email: { equals: input, mode: "insensitive" } } 
    })

    if (receiver) {
      receiverWallet = await prisma.wallet.findUnique({ where: { userId: receiver.id } })
      receiverUserId = receiver.id
    } else {
      // Try to find by wallet ID
      try {
        receiverWallet = await prisma.wallet.findUnique({ where: { id: input } })
        if (receiverWallet) receiverUserId = receiverWallet.userId
      } catch (e) {
        // Ignore UUID cast errors
      }
    }

    if (!receiverWallet) {
      return NextResponse.json({ success: false, error: "Recipient not found (use Email or Wallet ID)" }, { status: 404 })
    }
    if (receiverUserId === userId) {
      return NextResponse.json({ success: false, error: "Cannot transfer to yourself" }, { status: 400 })
    }

    const transaction = await WalletService.executeWalletTransfer(
      senderWallet.id,
      receiverWallet.id,
      new Prisma.Decimal(amount),
    )

    return NextResponse.json({ success: true, data: transaction }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message === "Not authenticated" ? 401 : 400
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
