import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { ticketId, qrCode } = await request.json()

    if (!ticketId && !qrCode) {
      return NextResponse.json({ success: false, error: "Either ticketId or qrCode is required" }, { status: 400 })
    }

    // Find the ticket
    const ticket = await prisma.ticket.findFirst({
      where: ticketId ? { id: ticketId } : { qrCode },
      include: {
        event: { select: { organizerId: true, title: true } },
        user: { select: { name: true, email: true } }
      }
    })

    if (!ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 })
    }

    // Security: Only the Event Organizer or an Admin can scan and verify tickets
    if (ticket.event.organizerId !== session.sub && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Not authorized to scan tickets for this event" }, { status: 403 })
    }

    // Check if already used
    if (ticket.status === "USED") {
      return NextResponse.json({ 
        success: false, 
        error: "Ticket has already been scanned/used!", 
        data: {
          purchaser: ticket.user.name,
          purchasedAt: ticket.purchaseDate,
          status: ticket.status
        }
      }, { status: 400 })
    }

    // Mark as USED
    const verifiedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "USED" }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Ticket verified successfully!", 
      data: {
        eventName: ticket.event.title,
        purchaserName: ticket.user.name,
        ticketId: verifiedTicket.id
      }
    })

  } catch (error: any) {
    console.error("POST /api/tickets/verify error:", error)
    return NextResponse.json({ success: false, error: "Failed to verify ticket" }, { status: 500 })
  }
}
