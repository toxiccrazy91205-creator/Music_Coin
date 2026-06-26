import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { EventStatus } from "@prisma/client"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const events = await prisma.event.findMany({
      include: {
        organizer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: events })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { eventId, status } = await request.json()

    if (!eventId || !status || !Object.values(EventStatus).includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status },
      include: {
        organizer: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: updatedEvent })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to update event status" }, { status: 500 })
  }
}
