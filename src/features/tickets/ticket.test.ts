import { describe, it, expect, vi, beforeEach } from "vitest"

const mockTx = vi.hoisted(() => ({
  event: { findUnique: vi.fn(), count: vi.fn() },
  ticket: { count: vi.fn(), create: vi.fn() },
  wallet: { findUnique: vi.fn(), update: vi.fn() },
  transaction: { create: vi.fn() },
}))

const mockPrisma = vi.hoisted(() => ({
  ticket: { findMany: vi.fn() },
  $transaction: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

vi.mock("@/lib/errors", () => ({
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message)
      this.name = "AppError"
    }
  },
}))

import { TicketService } from "./ticket.service"

describe("TicketService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("buyTicket", () => {
    const validEvent = {
      id: "event-1",
      organizerId: "org-1",
      title: "Test Fest",
      status: "PUBLISHED",
      ticketPrice: { lessThan: (x: number) => 50 < x },
      capacity: 100,
    }

    it("should buy a ticket and transfer funds", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.event.findUnique.mockResolvedValue(validEvent)
        mockTx.ticket.count.mockResolvedValue(0)
        mockTx.wallet.findUnique
          .mockResolvedValueOnce({ id: "fan-wallet", balance: { lessThan: () => false } })
          .mockResolvedValueOnce({ id: "org-wallet" })
        mockTx.ticket.create.mockResolvedValue({ id: "ticket-1", eventId: "event-1", userId: "fan-1" })
        mockTx.transaction.create.mockResolvedValue({ id: "tx-1", type: "TICKET_PURCHASE" })
        return cb(mockTx)
      })

      const result = await TicketService.buyTicket("fan-1", "event-1")
      expect(result.ticket.id).toBe("ticket-1")
      expect(result.transaction.type).toBe("TICKET_PURCHASE")
    })

    it("should reject if event is not PUBLISHED", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.event.findUnique.mockResolvedValue({ ...validEvent, status: "DRAFT" })
        return cb(mockTx)
      })
      await expect(TicketService.buyTicket("fan-1", "event-1")).rejects.toThrow("Event is not available")
    })

    it("should reject if event is sold out", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.event.findUnique.mockResolvedValue(validEvent)
        mockTx.ticket.count.mockResolvedValue(100)
        return cb(mockTx)
      })
      await expect(TicketService.buyTicket("fan-1", "event-1")).rejects.toThrow("sold out")
    })

    it("should reject if insufficient funds", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.event.findUnique.mockResolvedValue(validEvent)
        mockTx.ticket.count.mockResolvedValue(0)
        mockTx.wallet.findUnique.mockResolvedValue({ id: "fan-wallet", balance: { lessThan: () => true } })
        return cb(mockTx)
      })
      await expect(TicketService.buyTicket("fan-1", "event-1")).rejects.toThrow("Insufficient funds")
    })

    it("should allow purchase when capacity is null (unlimited)", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.event.findUnique.mockResolvedValue({ ...validEvent, capacity: null })
        mockTx.ticket.count.mockResolvedValue(999)
        mockTx.wallet.findUnique
          .mockResolvedValueOnce({ id: "fan-wallet", balance: { lessThan: () => false } })
          .mockResolvedValueOnce({ id: "org-wallet" })
        mockTx.ticket.create.mockResolvedValue({ id: "ticket-2" })
        mockTx.transaction.create.mockResolvedValue({ id: "tx-2" })
        return cb(mockTx)
      })
      const result = await TicketService.buyTicket("fan-1", "event-1")
      expect(result.ticket.id).toBe("ticket-2")
    })
  })

  describe("getUserTickets", () => {
    it("should return tickets for a user", async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([{ id: "ticket-1", event: { title: "Fest" } }])
      const tickets = await TicketService.getUserTickets("fan-1")
      expect(tickets).toHaveLength(1)
      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith({
        where: { userId: "fan-1" },
        include: { event: { include: { organizer: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: "desc" },
      })
    })
  })
})
