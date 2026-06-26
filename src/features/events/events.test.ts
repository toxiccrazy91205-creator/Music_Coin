import { describe, it, expect, vi, beforeEach } from "vitest"
import { Prisma } from "@prisma/client"

const mockPrisma = vi.hoisted(() => ({
  event: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

vi.mock("@/lib/errors", () => ({
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message)
      this.name = "AppError"
    }
  },
}))

vi.mock("@prisma/client", () => {
  class MockDecimal {
    constructor(public value: number | string) {}
    toString() { return String(this.value) }
    lessThan(x: number | string) { return this.value < x }
  }
  return {
    Prisma: { Decimal: MockDecimal },
    EventStatus: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", CANCELLED: "CANCELLED" },
  }
})

import { EventService } from "./events.service"

describe("EventService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockEvent = {
    id: "event-1",
    organizerId: "user-1",
    title: "Test Fest",
    description: "A great festival event for testing",
    venue: "Test Arena",
    eventDate: new Date("2026-08-15"),
    ticketPrice: new Prisma.Decimal(50),
    status: "DRAFT",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe("getEvents", () => {
    it("should return all events", async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockEvent])
      const events = await EventService.getEvents()
      expect(events).toHaveLength(1)
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: {},
        include: { organizer: { select: { id: true, name: true, email: true } } },
        orderBy: { eventDate: "asc" },
      })
    })

    it("should filter events by status", async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockEvent])
      await EventService.getEvents({ status: "PUBLISHED" as const })
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { status: "PUBLISHED" },
        include: { organizer: { select: { id: true, name: true, email: true } } },
        orderBy: { eventDate: "asc" },
      })
    })

    it("should filter events by organizer", async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockEvent])
      await EventService.getEvents({ organizerId: "user-1" })
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { organizerId: "user-1" },
        include: { organizer: { select: { id: true, name: true, email: true } } },
        orderBy: { eventDate: "asc" },
      })
    })
  })

  describe("createEvent", () => {
    it("should create a new draft event", async () => {
      const input = { title: "New Event", description: "Description text that is long enough", venue: "Venue", eventDate: "2026-09-01", ticketPrice: 25 }
      mockPrisma.event.create.mockResolvedValue({ ...mockEvent, title: "New Event" })

      const event = await EventService.createEvent("user-1", input)
      expect(event.title).toBe("New Event")
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: {
          organizerId: "user-1",
          title: "New Event",
          description: "Description text that is long enough",
          venue: "Venue",
          eventDate: new Date("2026-09-01"),
          ticketPrice: new Prisma.Decimal(25),
          capacity: undefined,
          sponsors: [],
          status: "DRAFT",
        },
        include: { organizer: { select: { id: true, name: true, email: true } } },
      })
    })
  })

  describe("updateEvent", () => {
    it("should update draft event", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
      mockPrisma.event.update.mockResolvedValue({ ...mockEvent, title: "Updated Title" })

      const event = await EventService.updateEvent("event-1", "user-1", { title: "Updated Title" })
      expect(event.title).toBe("Updated Title")
    })

    it("should reject update of published event", async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ ...mockEvent, status: "PUBLISHED" })
      await expect(
        EventService.updateEvent("event-1", "user-1", { title: "Hack" }),
      ).rejects.toThrow("Cannot update event")
    })
  })

  describe("publishEvent", () => {
    it("should publish a draft event", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
      mockPrisma.event.update.mockResolvedValue({ ...mockEvent, status: "PUBLISHED" })

      const event = await EventService.publishEvent("event-1", "user-1")
      expect(event.status).toBe("PUBLISHED")
    })
  })

  describe("deleteEvent", () => {
    it("should cancel an event", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
      mockPrisma.event.update.mockResolvedValue({ ...mockEvent, status: "CANCELLED" })

      await EventService.deleteEvent("event-1", "user-1")
      expect(mockPrisma.event.update).toHaveBeenCalled()
    })
  })
})
