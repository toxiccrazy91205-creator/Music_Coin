import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "ORGANIZER" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 403 })
    }

    const organizerId = session.sub

    const events = await prisma.event.findMany({
      where: { organizerId },
      include: {
        _count: {
          select: { tickets: { where: { status: "VALID" } } }
        }
      }
    })

    let totalTicketsSold = 0
    let totalRevenue = 0

    const eventBreakdown = events.map(event => {
      const ticketsSold = event._count.tickets
      const revenue = ticketsSold * Number(event.ticketPrice)
      
      totalTicketsSold += ticketsSold
      totalRevenue += revenue

      return {
        id: event.id,
        title: event.title,
        status: event.status,
        ticketsSold,
        revenue
      }
    })

    const data = {
      totalEvents: events.length,
      totalTicketsSold,
      totalRevenue,
      events: eventBreakdown
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("GET /api/analytics/events error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch event analytics" }, { status: 500 })
  }
}
