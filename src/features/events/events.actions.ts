"use server"

import { EventService } from "@/features/events/events.service"
import { getSession } from "@/lib/auth/session"
import { EventStatus } from "@prisma/client"
import { serialize } from "@/lib/serialize"
import type { ICreateEventInput, IUpdateEventInput } from "@/types"

export async function getEventsAction(status?: string, restrictToUser: boolean = false) {
  try {
    const session = await getSession()
    const filters: Record<string, unknown> = {}
    if (status) filters.status = status
    if (session && restrictToUser) filters.organizerId = session.sub
    const events = await EventService.getEvents(
      Object.keys(filters).length > 0 ? (filters as { status?: EventStatus; organizerId?: string }) : undefined,
    )
    return { success: true as const, data: serialize(events) }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function createEventAction(input: ICreateEventInput) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const event = await EventService.createEvent(session.sub, input)
    return { success: true as const, data: serialize(event) }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function updateEventAction(eventId: string, input: IUpdateEventInput) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const event = await EventService.updateEvent(eventId, session.sub, input)
    return { success: true as const, data: serialize(event) }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function publishEventAction(eventId: string) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const event = await EventService.publishEvent(eventId, session.sub)
    return { success: true as const, data: serialize(event) }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function deleteEventAction(eventId: string) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    await EventService.deleteEvent(eventId, session.sub)
    return { success: true as const, data: null }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
