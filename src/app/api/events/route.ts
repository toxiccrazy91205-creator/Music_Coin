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
    const { EventService } = await import("@/features/events/events.service")

    const filters: Record<string, unknown> = {}
    if (status) filters.status = status

    const events = await EventService.getEvents(
      Object.keys(filters).length > 0 ? (filters as { status?: EventStatus }) : undefined,
    )
    return NextResponse.json({ data: events })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message, statusCode: 400 }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, venue, date, ticketPrice } = body

    if (!title || !description || !venue || !date || ticketPrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, venue, date, ticketPrice", statusCode: 400 },
        { status: 400 },
      )
    }

    const { EventService } = await import("@/features/events/events.service")
    const event = await EventService.createEvent(userId, {
      title,
      description,
      venue,
      date,
      ticketPrice: Number(ticketPrice),
    })

    return NextResponse.json({ data: event }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message, statusCode: 400 }, { status: 400 })
  }
}
