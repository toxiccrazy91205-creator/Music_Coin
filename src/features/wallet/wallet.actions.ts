"use server"

import { WalletService } from "@/features/wallet/wallet.service"
import { getSession } from "@/lib/auth/session"
import { Prisma } from "@prisma/client"
import { serialize } from "@/lib/serialize"

export async function getWalletAction() {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const wallet = await WalletService.getWallet(session.sub)
    return { success: true as const, data: serialize(wallet) }
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
    return { success: true as const, data: serialize(result) }
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

    if (!receiverWallet) return { success: false as const, error: "Recipient not found (use Email or Wallet ID)" }
    if (receiverUserId === session.sub) return { success: false as const, error: "Cannot transfer to yourself" }

    const decimalAmount = new Prisma.Decimal(amount)
    const transaction = await WalletService.executeWalletTransfer(
      senderWallet.id,
      receiverWallet.id,
      decimalAmount,
    )

    return { success: true as const, data: serialize(transaction) }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
