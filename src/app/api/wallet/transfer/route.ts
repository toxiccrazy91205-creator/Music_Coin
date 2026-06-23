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
        { error: "Invalid request. receiverEmail and positive amount required", statusCode: 400 },
        { status: 400 },
      )
    }

    const { WalletService } = await import("@/features/wallet/wallet.service")
    const { prisma } = await import("@/lib/prisma")

    const senderWallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!senderWallet) {
      return NextResponse.json({ error: "Wallet not found", statusCode: 404 }, { status: 404 })
    }

    const receiver = await prisma.user.findUnique({ where: { email: receiverEmail } })
    if (!receiver) {
      return NextResponse.json({ error: "Recipient not found", statusCode: 404 }, { status: 404 })
    }
    if (receiver.id === userId) {
      return NextResponse.json({ error: "Cannot transfer to yourself", statusCode: 400 }, { status: 400 })
    }

    const receiverWallet = await prisma.wallet.findUnique({ where: { userId: receiver.id } })
    if (!receiverWallet) {
      return NextResponse.json({ error: "Recipient wallet not found", statusCode: 404 }, { status: 404 })
    }

    const transaction = await WalletService.executeWalletTransfer(
      senderWallet.id,
      receiverWallet.id,
      new Prisma.Decimal(amount),
    )

    return NextResponse.json({ data: transaction }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message === "Not authenticated" ? 401 : 400
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}
