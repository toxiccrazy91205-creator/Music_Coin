import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
    if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })

    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    const userId = payload.sub as string

    const { TicketService } = await import("@/features/tickets/ticket.service")
    const tickets = await TicketService.getUserTickets(userId)
    return NextResponse.json({ success: true, data: tickets })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
