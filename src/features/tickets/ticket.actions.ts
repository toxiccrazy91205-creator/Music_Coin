"use server"

import { TicketService } from "@/features/tickets/ticket.service"
import { getSession } from "@/lib/auth/session"

export async function buyTicketAction(eventId: string) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const result = await TicketService.buyTicket(session.sub, eventId)
    return { success: true as const, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function getUserTicketsAction() {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const tickets = await TicketService.getUserTickets(session.sub)
    return { success: true as const, data: tickets }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
