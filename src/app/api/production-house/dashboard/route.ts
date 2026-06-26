import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { ProductionHouseService } from "@/features/production-house/production-house.service"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "PRODUCTION_HOUSE") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }
    const data = await ProductionHouseService.getDashboard(session.sub)
    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
