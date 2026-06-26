import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "ARTIST" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 403 })
    }

    const artistUserId = session.sub

    const [
      artistProfile,
      nftsMinted,
      nftsSold,
      royalties,
      ticketsSold
    ] = await Promise.all([
      prisma.artist.findUnique({
        where: { userId: artistUserId }
      }),
      prisma.nFT.count({
        where: { creatorId: artistUserId }
      }),
      prisma.nFT.findMany({
        where: { creatorId: artistUserId, status: "SOLD" }
      }),
      prisma.royalty.aggregate({
        _sum: { amount: true },
        where: { artistId: artistUserId, paidAt: { not: null } }
      }),
      prisma.ticket.aggregate({
        _sum: { price: true },
        where: { event: { artists: { some: { id: artistUserId } } }, status: "SOLD" }
      })
    ])

    const totalNftRevenue = nftsSold.reduce((sum: number, nft: any) => sum + Number(nft.price), 0)
    const totalTicketRevenue = Number(ticketsSold._sum.price || 0)

    const data = {
      profile: {
        stageName: artistProfile?.stageName || "Unknown",
        reputationScore: artistProfile?.reputationScore || 0,
        followers: artistProfile?.followersCount || 0,
        subscribers: artistProfile?.subscribersCount || 0,
        vipMembers: artistProfile?.vipMembersCount || 0,
        socialLinks: artistProfile?.socialLinks || [],
        portfolio: artistProfile?.portfolio || []
      },
      nfts: {
        totalMinted: nftsMinted,
        totalSold: nftsSold.length,
        totalRevenue: totalNftRevenue
      },
      events: {
        ticketRevenue: totalTicketRevenue
      },
      royalties: {
        totalEarned: royalties._sum.amount || 0
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("GET /api/analytics/artists error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch artist analytics" }, { status: 500 })
  }
}
