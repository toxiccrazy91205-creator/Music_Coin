import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  transaction: { findMany: vi.fn(), groupBy: vi.fn() },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { AnalyticsService } from "./analytics.service"

describe("AnalyticsService", () => {
  beforeEach(() => { vi.resetAllMocks() })

  it("should return all analytics data", async () => {
    mockPrisma.transaction.findMany
      .mockResolvedValueOnce([{ amount: "100", type: "DEPOSIT", createdAt: new Date() }])
      .mockResolvedValueOnce([{ amount: "50", type: "TRANSFER", createdAt: new Date() }])
      .mockResolvedValueOnce([{ amount: "30", type: "TICKET_PURCHASE", createdAt: new Date() }])
      .mockResolvedValueOnce([{ amount: "200", receiver: { user: { name: "Artist" } }, type: "ROYALTY_PAYMENT" }])

    const data = await AnalyticsService.getAnalytics()
    expect(data).toHaveProperty("revenue")
    expect(data).toHaveProperty("nftSales")
    expect(data).toHaveProperty("eventSales")
    expect(data).toHaveProperty("artistEarnings")
  })
})
