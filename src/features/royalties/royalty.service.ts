import { prisma } from "@/lib/prisma"
import { AppError } from "@/lib/errors"
import { Prisma } from "@prisma/client"
import { WalletService } from "@/features/wallet/wallet.service"

export const RoyaltyService = {
  async getRoyalties(
    userId: string,
    userRole: string,
    filters: { artistId?: string; pending?: boolean } = {},
  ) {
    const where: Record<string, unknown> = {}
    if (userRole === "ARTIST") {
      where.artistId = userId
    } else if (filters.artistId) {
      where.artistId = filters.artistId
    }
    if (filters.pending) where.paidAt = null

    const royalties = await prisma.royalty.findMany({
      where,
      include: { nft: { include: { song: true } }, artist: true },
      orderBy: { createdAt: "desc" },
    })

    const total = royalties.reduce((sum, r) => sum + Number(r.amount), 0)
    return { royalties, total, count: royalties.length }
  },

  async distributeRoyalties() {
    const unpaid = await prisma.royalty.findMany({ where: { paidAt: null } })
    if (unpaid.length === 0) {
      return { distributed: 0, totalAmount: "0", artists: 0 }
    }

    const grouped = new Map<string, { ids: string[]; total: number }>()
    for (const r of unpaid) {
      const amount = Number(r.amount)
      const entry = grouped.get(r.artistId) || { ids: [], total: 0 }
      entry.ids.push(r.id)
      entry.total += amount
      grouped.set(r.artistId, entry)
    }

    const platformUser = await prisma.user.findUnique({
      where: { email: "platform@musiccoin.demo" },
      include: { wallet: true },
    })
    if (!platformUser?.wallet) {
      throw new AppError("Platform wallet not found", 500)
    }

    let distributed = 0
    let totalAmount = 0

    for (const [artistId, entry] of grouped) {
      const artistWallet = await prisma.wallet.findUnique({ where: { userId: artistId } })
      if (!artistWallet) continue

      const amt = new Prisma.Decimal(entry.total)
      await WalletService.executeWalletTransfer(
        platformUser.wallet.id,
        artistWallet.id,
        amt,
        "ROYALTY_PAYMENT",
      )

      await prisma.royalty.updateMany({
        where: { id: { in: entry.ids } },
        data: { paidAt: new Date() },
      })

      distributed += entry.ids.length
      totalAmount += entry.total
    }

    return { distributed, totalAmount: String(totalAmount), artists: grouped.size }
  },
}
