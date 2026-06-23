import { prisma } from "@/lib/prisma"
import { Prisma, TransactionType } from "@prisma/client"
import { AppError } from "@/lib/errors"

export const WalletService = {
  async getWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        sentTransactions: { orderBy: { createdAt: "desc" }, take: 50 },
        receivedTransactions: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    })
    if (!wallet) throw new AppError("Wallet not found", 404)
    return wallet
  },

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) throw new AppError("Wallet not found", 404)

    const skip = (page - 1) * limit
    const where = {
      OR: [{ senderId: wallet.id }, { receiverId: wallet.id }],
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    return { data, total, page, limit }
  },

  async executeWalletTransfer(
    senderWalletId: string,
    receiverWalletId: string,
    amount: Prisma.Decimal,
    type: TransactionType = "TRANSFER",
  ) {
    if (amount.lessThanOrEqualTo(0)) {
      throw new AppError("Amount must be positive", 400)
    }

    return prisma.$transaction(async (tx) => {
      const sender = await tx.wallet.findUniqueOrThrow({
        where: { id: senderWalletId },
      })
      if (sender.balance.lessThan(amount)) {
        throw new AppError("Insufficient funds", 400)
      }

      await tx.wallet.update({
        where: { id: senderWalletId },
        data: { balance: { decrement: amount } },
      })
      await tx.wallet.update({
        where: { id: receiverWalletId },
        data: { balance: { increment: amount } },
      })

      return tx.transaction.create({
        data: {
          senderId: senderWalletId,
          receiverId: receiverWalletId,
          amount,
          type,
        },
      })
    })
  },

  async creditWallet(
    walletId: string,
    amount: Prisma.Decimal,
    type: TransactionType = "DEPOSIT",
  ) {
    if (amount.lessThanOrEqualTo(0)) {
      throw new AppError("Amount must be positive", 400)
    }

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      })

      const transaction = await tx.transaction.create({
        data: {
          senderId: walletId,
          receiverId: walletId,
          amount,
          type,
        },
      })

      return { wallet, transaction }
    })
  },
}
