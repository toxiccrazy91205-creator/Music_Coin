import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { RoyaltyService } from "@/features/royalties/royalty.service"

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const result = await RoyaltyService.distributeRoyalties()
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
