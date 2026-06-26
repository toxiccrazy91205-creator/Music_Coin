import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access. Admins only." }, { status: 403 })
    }

    // Parallel aggregate queries for speed
    const [
      totalUsers,
      fansCount,
      artistsCount,
      organizersCount,
      totalEvents,
      totalTicketsSold,
      totalNFTs,
      nftsSold,
      transactionVolume
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "FAN" } }),
      prisma.user.count({ where: { role: "ARTIST" } }),
      prisma.user.count({ where: { role: "ORGANIZER" } }),
      prisma.event.count(),
      prisma.ticket.count({ where: { status: "VALID" } }),
      prisma.nFT.count(),
      prisma.nFT.count({ where: { status: "SOLD" } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" }
      })
    ])

    const data = {
      users: {
        total: totalUsers,
        fans: fansCount,
        artists: artistsCount,
        organizers: organizersCount
      },
      events: {
        total: totalEvents,
        ticketsSold: totalTicketsSold
      },
      nfts: {
        totalMinted: totalNFTs,
        totalSold: nftsSold
      },
      financials: {
        totalTransactionVolume: transactionVolume._sum.amount || 0
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("GET /api/analytics/platform error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch platform analytics" }, { status: 500 })
  }
}
