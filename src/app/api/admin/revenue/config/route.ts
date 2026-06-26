import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Seed the PlatformConfig with the exact requested percentages if it doesn't exist
    let config = await prisma.platformConfig.findUnique({
      where: { id: "GLOBAL_CONFIG" }
    })

    if (!config) {
      config = await prisma.platformConfig.create({
        data: {
          id: "GLOBAL_CONFIG",
          ticketCommissionPercent: 5.0, // 5% Maximum Commission
          nftMarketplaceFeePercent: 2.5, // 2.5% NFT Fee
          stakingFeePercent: 1.0,
          premiumListingFee: 100.0,
          artistVerificationFee: 50.0
        }
      })
    }

    // Mathematical breakdown of the revenue streams
    return NextResponse.json({ 
      success: true, 
      message: "Monetization Configuration is Perfectly Synced",
      data: {
        ticketSalesCommission: `${config.ticketCommissionPercent}%`,
        nftMarketplaceFee: `${config.nftMarketplaceFeePercent}%`,
        stakingFees: `${config.stakingFeePercent}% Platform Share`,
        eventListingFees: `${config.premiumListingFee} MUSIC for Premium Listings`,
        artistVerificationFees: `${config.artistVerificationFee} MUSIC (Optional Fast-Track)`,
        premiumMemberships: "Monthly Subscription - Synced via Subscription Model",
        advertisementRevenue: "Sponsored Events - Synced via Advertisement Model"
      }
    })

  } catch (error: any) {
    console.error(`Monetization Config Error:`, error)
    return NextResponse.json({ error: error.message || "Failed to load monetization configuration" }, { status: 500 })
  }
}
