import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ORGANIZER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const organizerId = session.sub

    // 1. Get all events
    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
    })

    // 2. Get tickets sold for these events
    const eventIds = events.map(e => e.id)
    const tickets = await prisma.ticket.findMany({
      where: { eventId: { in: eventIds } }
    })

    // 3. Calculate Revenue from these tickets
    const totalRevenue = tickets.reduce((acc, t) => acc + Number(t.price), 0)

    const published = events.filter(e => e.status === "PUBLISHED").length
    const drafts = events.filter(e => e.status === "DRAFT").length

    return NextResponse.json({
      success: true,
      data: {
        totalEvents: events.length,
        published,
        drafts,
        ticketsSold: tickets.length,
        totalRevenue,
        recentEvents: events.slice(0, 5)
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to fetch organizer dashboard data" }, { status: 500 })
  }
}
