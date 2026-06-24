import { describe, it, expect, vi, beforeEach } from "vitest"

const mockTx = vi.hoisted(() => ({
  vote: { upsert: vi.fn(), findUnique: vi.fn() },
  wallet: { findUnique: vi.fn(), update: vi.fn() },
  transaction: { create: vi.fn() },
  user: { findUnique: vi.fn() },
}))

const mockPrisma = vi.hoisted(() => ({
  vote: { findMany: vi.fn() },
  $transaction: vi.fn((cb) => cb(mockTx)),
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

import { VoteService } from "./vote.service"

describe("VoteService", () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe("castVote", () => {
    it("should create vote and award reward", async () => {
      mockTx.vote.upsert.mockResolvedValue({ id: "v-1", artistId: "a-1", fanId: "f-1", weight: 1 })
      mockTx.user.findUnique.mockResolvedValue({ email: "platform@musiccoin.demo", wallet: { id: "pw-1" } })
      mockTx.wallet.findUnique.mockResolvedValue({ id: "w-1" })
      mockTx.wallet.update.mockResolvedValue({})
      mockTx.transaction.create.mockResolvedValue({})

      const result = await VoteService.castVote("f-1", "a-1")
      expect(result.vote.weight).toBe(1)
      expect(result.reward).toBe(10)
    })

    it("should not reward if fan already voted", async () => {
      mockTx.vote.findUnique.mockResolvedValue({ id: "v-1", artistId: "a-1", fanId: "f-1", weight: 1 })
      mockTx.vote.upsert.mockResolvedValue({ id: "v-1", artistId: "a-1", fanId: "f-1", weight: 1 })

      const result = await VoteService.castVote("f-1", "a-1")
      expect(result.reward).toBe(0)
    })
  })

  describe("getResults", () => {
    it("should return sorted results", async () => {
      mockPrisma.vote.findMany.mockResolvedValue([
        { artistId: "a-1", weight: 1, artist: { name: "Artist 1" } },
        { artistId: "a-1", weight: 1, artist: { name: "Artist 1" } },
        { artistId: "a-2", weight: 1, artist: { name: "Artist 2" } },
      ])

      const result = await VoteService.getResults()
      expect(result.results[0].artistId).toBe("a-1")
      expect(result.results[0].voteCount).toBe(2)
      expect(result.results[1].voteCount).toBe(1)
    })
  })
})
