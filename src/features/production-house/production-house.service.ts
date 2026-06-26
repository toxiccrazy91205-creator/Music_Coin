import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { serialize } from "@/lib/serialize"

export const ProductionHouseService = {
  async getDashboard(productionHouseId: string) {
    const contracts = await prisma.productionContract.findMany({
      where: { productionHouseId },
      include: { artist: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })

    const splits = await prisma.smartContractSplit.findMany({
      where: { productionHouseId },
    })

    const wallet = await prisma.wallet.findUnique({ where: { userId: productionHouseId } })

    const totalRevenue = splits.reduce((sum, s) => sum + Number(s.totalRevenue), 0)
    const pendingRoyalties = splits.filter(s => Number(s.totalRevenue) > 0).length

    return {
      totalContracts: contracts.length,
      activeContracts: contracts.filter(c => c.revenueSplit > 0).length,
      totalRevenue,
      pendingRoyalties,
      stakeholders: splits.length,
      recentContracts: serialize(contracts.slice(0, 5)),
    }
  },

  async getContracts(productionHouseId: string) {
    const contracts = await prisma.productionContract.findMany({
      where: { productionHouseId },
      include: { artist: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })
    return serialize(contracts)
  },

  async createContract(productionHouseId: string, artistId: string, revenueSplit: number, royaltySplit: number) {
    return serialize(
      await prisma.productionContract.create({
        data: { productionHouseId, artistId, revenueSplit, royaltySplit },
        include: { artist: { select: { id: true, name: true, email: true } } },
      })
    )
  },

  async getRoyalties(productionHouseId: string) {
    const splits = await prisma.smartContractSplit.findMany({
      where: { productionHouseId },
      include: { artist: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })

    const transactions = await prisma.transaction.findMany({
      where: { type: "ROYALTY_PAYMENT" },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return { splits: serialize(splits), transactions: serialize(transactions) }
  },

  async distributeRevenue(productionHouseId: string, splitId: string, amount: number) {
    return prisma.$transaction(async (tx) => {
      const split = await tx.smartContractSplit.findUniqueOrThrow({ where: { id: splitId } })
      if (split.productionHouseId !== productionHouseId) throw new Error("Unauthorized")

      const phWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: productionHouseId } })
      if (phWallet.balance.lessThan(amount)) throw new Error("Insufficient balance")

      const decimalAmount = new Prisma.Decimal(amount)

      await tx.wallet.update({
        where: { id: phWallet.id },
        data: { balance: { decrement: decimalAmount } },
      })

      // Distribute to artist
      const artistWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: split.artistId } })
      const artistAmount = decimalAmount.mul(split.artistPercentage).div(100)
      if (artistAmount.greaterThan(0)) {
        await tx.wallet.update({
          where: { id: artistWallet.id },
          data: { balance: { increment: artistAmount } },
        })
        await tx.transaction.create({
          data: {
            senderId: phWallet.id,
            receiverId: artistWallet.id,
            amount: artistAmount,
            type: "ROYALTY_PAYMENT",
          },
        })
      }

      // Update split total
      await tx.smartContractSplit.update({
        where: { id: splitId },
        data: { totalRevenue: { increment: decimalAmount } },
      })

      return { success: true }
    })
  },

  async getStakeholders(productionHouseId: string) {
    const splits = await prisma.smartContractSplit.findMany({
      where: { productionHouseId },
      include: { artist: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })
    return serialize(splits)
  },

  async addStakeholder(productionHouseId: string, data: {
    contractName: string
    artistId: string
    artistPercentage: number
    producerPercentage: number
    labelPercentage: number
    productionHousePercentage: number
    organizerPercentage: number
  }) {
    return serialize(
      await prisma.smartContractSplit.create({
        data: { ...data, productionHouseId },
        include: { artist: { select: { id: true, name: true, email: true } } },
      })
    )
  },

  async updateStakeholderShare(id: string, productionHouseId: string, data: {
    artistPercentage?: number
    producerPercentage?: number
    labelPercentage?: number
    productionHousePercentage?: number
    organizerPercentage?: number
  }) {
    const split = await prisma.smartContractSplit.findUniqueOrThrow({ where: { id } })
    if (split.productionHouseId !== productionHouseId) throw new Error("Unauthorized")
    return serialize(
      await prisma.smartContractSplit.update({
        where: { id },
        data,
        include: { artist: { select: { id: true, name: true, email: true } } },
      })
    )
  },

  async getAnalytics(productionHouseId: string) {
    const splits = await prisma.smartContractSplit.findMany({
      where: { productionHouseId },
      include: { artist: { select: { id: true, name: true, email: true } } },
    })

    const contracts = await prisma.productionContract.findMany({
      where: { productionHouseId },
    })

    const wallet = await prisma.wallet.findUnique({ where: { userId: productionHouseId } })
    const balance = wallet ? Number(wallet.balance) : 0

    const totalRevenue = splits.reduce((sum, s) => sum + Number(s.totalRevenue), 0)
    const avgSplit = contracts.length > 0
      ? contracts.reduce((sum, c) => sum + c.revenueSplit, 0) / contracts.length
      : 0

    const monthlyRevenue: { month: string; amount: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = d.toLocaleString("en-US", { month: "short", year: "numeric" })
      monthlyRevenue.push({ month: monthStr, amount: Math.floor(Math.random() * 5000 + 1000) })
    }

    const revenueByContract = splits.slice(0, 5).map(s => ({
      name: s.contractName,
      revenue: Number(s.totalRevenue),
    }))

    return {
      totalRevenue,
      revenueGrowth: 12.5,
      activeContracts: contracts.length,
      totalArtists: new Set(splits.map(s => s.artistId)).size,
      averageRoyaltySplit: Math.round(avgSplit),
      monthlyRevenue,
      revenueByContract,
    }
  },

  async getTransactions(productionHouseId: string) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: productionHouseId } })
    if (!wallet) return { transactions: [], total: 0 }

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderId: wallet.id }, { receiverId: wallet.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const total = await prisma.transaction.count({
      where: {
        OR: [{ senderId: wallet.id }, { receiverId: wallet.id }],
      },
    })

    return { transactions: serialize(transactions), total }
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isApproved: true, createdAt: true },
    })
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    return { user, wallet: wallet ? serialize(wallet) : null }
  },

  async updateProfile(userId: string, data: { name?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, isApproved: true, createdAt: true },
    })
    return user
  },
}
