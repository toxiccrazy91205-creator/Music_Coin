import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { VoteService } from "@/features/voting/vote.service"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const result = await VoteService.getResults()
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
