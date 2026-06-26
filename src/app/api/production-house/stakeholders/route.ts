import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { ProductionHouseService } from "@/features/production-house/production-house.service"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "PRODUCTION_HOUSE") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }
    const data = await ProductionHouseService.getStakeholders(session.sub)
    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "PRODUCTION_HOUSE") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }
    const body = await request.json()
    const { contractName, artistId, artistPercentage, producerPercentage, labelPercentage, productionHousePercentage, organizerPercentage } = body
    if (!contractName || !artistId) {
      return NextResponse.json({ success: false, error: "contractName and artistId are required" }, { status: 400 })
    }
    const data = await ProductionHouseService.addStakeholder(session.sub, {
      contractName, artistId,
      artistPercentage: Number(artistPercentage) || 0,
      producerPercentage: Number(producerPercentage) || 0,
      labelPercentage: Number(labelPercentage) || 0,
      productionHousePercentage: Number(productionHousePercentage) || 0,
      organizerPercentage: Number(organizerPercentage) || 0,
    })
    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "PRODUCTION_HOUSE") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 })
    }
    const data = await ProductionHouseService.updateStakeholderShare(id, session.sub, updates)
    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
