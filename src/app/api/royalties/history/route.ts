import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { RoyaltyService } from "@/features/royalties/royalty.service"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const filters = {
      artistId: searchParams.get("artistId") || undefined,
      pending: searchParams.get("pending") === "true" || undefined,
    }

    const data = await RoyaltyService.getRoyalties(session.sub, session.role, filters)
    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
