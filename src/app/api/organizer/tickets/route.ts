import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ORGANIZER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const events = await prisma.event.findMany({
      where: { organizerId: session.sub },
      select: { id: true, title: true, eventDate: true, capacity: true }
    })
    
    const eventIds = events.map(e => e.id)
    
    const tickets = await prisma.ticket.findMany({
      where: { eventId: { in: eventIds } },
      include: {
        event: { select: { title: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { purchaseDate: "desc" }
    })

    return NextResponse.json({ success: true, data: { events, tickets } })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to fetch tickets" }, { status: 500 })
  }
}
