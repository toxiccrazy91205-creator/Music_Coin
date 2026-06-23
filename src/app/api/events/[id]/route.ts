import { NextResponse } from "next/server"

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { EventService } = await import("@/features/events/events.service")
    const event = await EventService.getEventById(id)
    return NextResponse.json({ data: event })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message === "Event not found" ? 404 : 400
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { EventService } = await import("@/features/events/events.service")
    const event = await EventService.updateEvent(id, userId, body)
    return NextResponse.json({ data: event })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message.includes("Not authorized") ? 403 : message === "Event not found" ? 404 : 400
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })
    }

    const { id } = await params
    const { EventService } = await import("@/features/events/events.service")
    await EventService.deleteEvent(id, userId)
    return NextResponse.json({ data: null })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message.includes("Not authorized") ? 403 : message === "Event not found" ? 404 : 400
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}
