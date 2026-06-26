import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { VoteService } from "@/features/voting/vote.service"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    if (session.role !== "FAN") return NextResponse.json({ success: false, error: "Only fans can vote" }, { status: 403 })

    const { artistId } = await request.json()
    if (!artistId) return NextResponse.json({ success: false, error: "artistId is required" }, { status: 400 })

    const result = await VoteService.castVote(session.sub, artistId)
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
