import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    let config = await prisma.platformConfig.findUnique({
      where: { id: "GLOBAL_CONFIG" },
    })

    if (!config) {
      config = await prisma.platformConfig.create({
        data: { id: "GLOBAL_CONFIG" }
      })
    }

    return NextResponse.json({ success: true, data: config })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to fetch platform config" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const updates = await request.json()

    const updatedConfig = await prisma.platformConfig.update({
      where: { id: "GLOBAL_CONFIG" },
      data: {
        ticketCommissionPercent: updates.ticketCommissionPercent,
        nftMarketplaceFeePercent: updates.nftMarketplaceFeePercent,
        stakingFeePercent: updates.stakingFeePercent,
        premiumListingFee: updates.premiumListingFee,
        artistVerificationFee: updates.artistVerificationFee,
      },
    })

    return NextResponse.json({ success: true, data: updatedConfig })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to update platform config" }, { status: 500 })
  }
}
