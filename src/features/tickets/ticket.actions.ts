"use server"

import { TicketService } from "@/features/tickets/ticket.service"
import { getSession } from "@/lib/auth/session"
import { serialize } from "@/lib/serialize"

export async function buyTicketAction(eventId: string) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    if (session.role !== "FAN") return { success: false as const, error: "Only fans can purchase tickets" }
    const result = await TicketService.buyTicket(session.sub, eventId)
    return { success: true as const, data: serialize(result) }
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
    return { success: true as const, data: serialize(tickets) }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
