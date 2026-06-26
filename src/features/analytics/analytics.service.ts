import { prisma } from "@/lib/prisma"

export const AnalyticsService = {
  async getAnalytics() {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [revenue, nftSales, eventSales, artistEarnings] = await Promise.all([
      prisma.transaction.findMany({
        where: { type: "DEPOSIT", createdAt: { gte: twelveMonthsAgo } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),

      prisma.transaction.findMany({
        where: { type: "TRANSFER", createdAt: { gte: thirtyDaysAgo } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),

      prisma.transaction.findMany({
        where: { type: "TICKET_PURCHASE" },
        select: { amount: true, createdAt: true },
      }),

      prisma.transaction.findMany({
        where: { type: "ROYALTY_PAYMENT" },
        select: { amount: true, receiverId: true, receiver: { select: { user: { select: { name: true } } } } },
      }),
    ])

    const revenueByMonth = groupByMonth(revenue)
    const revenueTotal = sumAmounts(revenue)

    const nftSalesByDay = groupByDay(nftSales)
    const nftSalesTotal = sumAmounts(nftSales)
    const nftSalesCount = nftSales.length

    const eventSalesTotal = sumAmounts(eventSales)
    const eventSalesCount = eventSales.length

    interface ArtistEarningEntry {
      receiverId: string
      amount: unknown
      receiver?: { user?: { name: string } }
    }

    const artistMap = new Map<string, { artistName: string; total: number }>()
    for (const t of artistEarnings as ArtistEarningEntry[]) {
      const name = t.receiver?.user?.name || "Unknown"
      const entry = artistMap.get(t.receiverId) || { artistName: name, total: 0 }
      entry.total += Number(t.amount)
      artistMap.set(t.receiverId, entry)
    }
    const topArtists = Array.from(artistMap.entries())
      .map(([id, d]) => ({ artistId: id, artistName: d.artistName, total: d.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return {
      revenue: { total: revenueTotal, byMonth: revenueByMonth },
      nftSales: { total: nftSalesTotal, count: nftSalesCount, byDay: nftSalesByDay },
      eventSales: { total: eventSalesTotal, count: eventSalesCount },
      artistEarnings: topArtists,
    }
  },
}

function groupByMonth(data: { amount: unknown; createdAt: Date }[]) {
  const map = new Map<string, number>()
  for (const item of data) {
    const key = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, "0")}`
    map.set(key, (map.get(key) || 0) + Number(item.amount))
  }
  return Array.from(map.entries()).map(([month, total]) => ({ month, total }))
}

function groupByDay(data: { amount: unknown; createdAt: Date }[]) {
  const map = new Map<string, number>()
  for (const item of data) {
    const key = item.createdAt.toISOString().slice(0, 10)
    map.set(key, (map.get(key) || 0) + Number(item.amount))
  }
  return Array.from(map.entries()).map(([date, total]) => ({ date, total }))
}

function sumAmounts(data: { amount: unknown }[]) {
  return data.reduce((sum, item) => sum + Number(item.amount), 0)
}
