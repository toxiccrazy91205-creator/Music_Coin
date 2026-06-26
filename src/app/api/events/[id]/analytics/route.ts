import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params;
    
    // Fetch Event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      select: { organizerId: true, ticketPrice: true, capacity: true }
    })

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    // Security: Only the Organizer or an Admin can view the analytics
    if (event.organizerId !== session.sub && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Not authorized to view analytics for this event" }, { status: 403 })
    }

    // Calculate Analytics
    const ticketsSold = await prisma.ticket.count({
      where: { eventId: id, status: "VALID" }
    })

    const attendance = await prisma.ticket.count({
      where: { eventId: id, status: "USED" }
    })

    const totalRevenue = event.ticketPrice.toNumber() * (ticketsSold + attendance)

    const recentBuyers = await prisma.ticket.findMany({
      where: { eventId: id },
      orderBy: { purchaseDate: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalTicketsSold: ticketsSold + attendance, // Total sold includes used and valid
        attendance: attendance,
        capacity: event.capacity,
        totalRevenue,
        recentBuyers: recentBuyers.map(t => ({
          name: t.user.name,
          email: t.user.email,
          purchasedAt: t.purchaseDate
        }))
      }
    })

  } catch (error: any) {
    console.error("GET /api/events/[id]/analytics error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch event analytics" }, { status: 500 })
  }
}
