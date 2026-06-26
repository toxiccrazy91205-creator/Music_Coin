import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ARTIST") {
      return NextResponse.json({ success: false, error: "Only Artists can view these analytics" }, { status: 403 })
    }

    const userId = session.sub

    // Get the Artist Profile
    const artist = await prisma.artist.findUnique({
      where: { userId: userId },
      include: { user: { include: { wallet: true } } }
    })

    if (!artist || !artist.user.wallet) {
      return NextResponse.json({ success: false, error: "Artist profile or wallet not found" }, { status: 404 })
    }

    const walletId = artist.user.wallet.id

    // 1. Calculate Revenue (Sum of all incoming transactions to their wallet)
    const revenueAgg = await prisma.transaction.aggregate({
      where: {
        receiverId: walletId,
        status: "COMPLETED"
      },
      _sum: { amount: true }
    })
    const totalRevenue = revenueAgg._sum.amount ? Number(revenueAgg._sum.amount) : 0

    // 2. Calculate NFT Sales
    const nftSalesCount = await prisma.nFT.count({
      where: {
        ownerId: userId,
        status: { in: ["SOLD", "AUCTION"] }
      }
    })

    // 3. Followers
    const followers = artist.followersCount

    // 4. Calculate Engagement (Votes Received + Endorsements)
    const votesCount = await prisma.vote.count({
      where: { artistId: userId }
    })
    
    const endorsementsCount = await prisma.communityEndorsement.count({
      where: { artistId: userId }
    })

    const totalEngagement = votesCount + endorsementsCount

    return NextResponse.json({ 
      success: true, 
      data: {
        revenue: totalRevenue,
        nftSales: nftSalesCount,
        followers: followers,
        engagement: totalEngagement
      }
    })

  } catch (error: any) {
    console.error(`Artist Analytics Error:`, error)
    return NextResponse.json({ success: false, error: error.message || "Failed to load artist analytics" }, { status: 500 })
  }
}
