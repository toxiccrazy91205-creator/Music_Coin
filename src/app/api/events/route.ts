import { NextResponse } from "next/server"
import { EventStatus } from "@prisma/client"

async function getUserId(request: Request): Promise<string | null> {
  const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
  if (!token) return null
  try {
    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    return payload.sub as string
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as EventStatus | null
    const limit = searchParams.get("limit")
    const { EventService } = await import("@/features/events/events.service")

    const filters: Record<string, unknown> = {}
    if (status) filters.status = status

    const events = await EventService.getEvents(
      Object.keys(filters).length > 0 ? (filters as { status?: EventStatus }) : undefined,
      limit ? Number(limit) : undefined,
    )
    return NextResponse.json({ success: true, data: events })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, venue, date, eventDate, ticketPrice } = body

    if (!title || !description || !venue || !(date || eventDate) || ticketPrice === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, description, venue, eventDate, ticketPrice" },
        { status: 400 },
      )
    }

    const { EventService } = await import("@/features/events/events.service")
    const event = await EventService.createEvent(userId, {
        title,
        description,
        venue,
        eventDate: date || eventDate, // fallback in case old clients send date
        ticketPrice: Number(ticketPrice),
    })

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
