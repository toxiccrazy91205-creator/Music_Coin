import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { EventStatus } from "@prisma/client"
import { AppError } from "@/lib/errors"
import type { ICreateEventInput, IUpdateEventInput } from "@/types"

export const EventService = {
  async getEvents(filters?: { status?: EventStatus; organizerId?: string }, limit?: number) {
    const where: Record<string, unknown> = {}
    if (filters?.status) where.status = filters.status
    if (filters?.organizerId) where.organizerId = filters.organizerId

    return prisma.event.findMany({
      where,
      include: { organizer: { select: { id: true, name: true, email: true } } },
      orderBy: { eventDate: "asc" },
      ...(limit ? { take: limit } : {}),
    })
  },

  async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { 
        organizer: { select: { id: true, name: true, email: true } },
        _count: { select: { tickets: true } }
      },
    })
    if (!event) throw new AppError("Event not found", 404)
    return event
  },

  async createEvent(organizerId: string, data: ICreateEventInput) {
    return prisma.event.create({
      data: {
        organizerId,
        title: data.title,
        description: data.description,
        venue: data.venue,
        eventDate: new Date(data.eventDate),
        ticketPrice: new Prisma.Decimal(data.ticketPrice),
        capacity: data.capacity,
        sponsors: data.sponsors || [],
        status: "DRAFT",
      },
      include: { organizer: { select: { id: true, name: true, email: true } } },
    })
  },

  async updateEvent(eventId: string, userId: string, data: IUpdateEventInput) {
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) throw new AppError("Event not found", 404)
    if (event.organizerId !== userId) throw new AppError("Not authorized to edit this event", 403)
    if (event.status !== "DRAFT") throw new AppError("Cannot update event", 400)

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.venue !== undefined) updateData.venue = data.venue
    if (data.eventDate !== undefined) updateData.eventDate = new Date(data.eventDate)
    if (data.ticketPrice !== undefined) updateData.ticketPrice = new Prisma.Decimal(data.ticketPrice)

    return prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: { organizer: { select: { id: true, name: true, email: true } } },
    })
  },

  async publishEvent(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) throw new AppError("Event not found", 404)
    if (event.organizerId !== userId) throw new AppError("Not authorized to publish this event", 403)
    if (event.status !== "DRAFT") throw new AppError("Only DRAFT events can be published", 400)

    return prisma.event.update({
      where: { id: eventId },
      data: { status: "PUBLISHED" },
      include: { organizer: { select: { id: true, name: true, email: true } } },
    })
  },

  async deleteEvent(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) throw new AppError("Event not found", 404)
    if (event.organizerId !== userId) throw new AppError("Not authorized to delete this event", 403)

    return prisma.event.update({
      where: { id: eventId },
      data: { status: "CANCELLED" },
    })
  },
}
