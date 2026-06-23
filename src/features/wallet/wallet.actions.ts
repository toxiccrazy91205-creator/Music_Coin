"use server"

import { WalletService } from "@/features/wallet/wallet.service"
import { getSession } from "@/lib/auth/session"
import { Prisma } from "@prisma/client"

export async function getWalletAction() {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const wallet = await WalletService.getWallet(session.sub)
    return { success: true as const, data: wallet }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function getTransactionHistoryAction(page = 1, limit = 20) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const result = await WalletService.getTransactions(session.sub, page, limit)
    return { success: true as const, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function transferCoinsAction(receiverEmail: string, amount: number) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }

    const { prisma } = await import("@/lib/prisma")

    const senderWallet = await prisma.wallet.findUnique({ where: { userId: session.sub } })
    if (!senderWallet) return { success: false as const, error: "Wallet not found" }

    const receiver = await prisma.user.findUnique({ where: { email: receiverEmail } })
    if (!receiver) return { success: false as const, error: "Recipient not found" }
    if (receiver.id === session.sub) return { success: false as const, error: "Cannot transfer to yourself" }

    const receiverWallet = await prisma.wallet.findUnique({ where: { userId: receiver.id } })
    if (!receiverWallet) return { success: false as const, error: "Recipient wallet not found" }

    const decimalAmount = new Prisma.Decimal(amount)
    const transaction = await WalletService.executeWalletTransfer(
      senderWallet.id,
      receiverWallet.id,
      decimalAmount,
    )

    return { success: true as const, data: transaction }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
