import { describe, it, expect, vi, beforeEach } from "vitest"

const mockTx = vi.hoisted(() => ({
  royalty: { findMany: vi.fn(), updateMany: vi.fn() },
  wallet: { findUnique: vi.fn(), update: vi.fn() },
  transaction: { create: vi.fn() },
}))

const mockPrisma = vi.hoisted(() => ({
  royalty: { findMany: vi.fn(), updateMany: vi.fn() },
  wallet: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
  $transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
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
vi.mock("@/features/wallet/wallet.service", () => ({
  WalletService: { executeWalletTransfer: vi.fn().mockResolvedValue({ id: "tx-1" }) },
}))

import { RoyaltyService } from "./royalty.service"

describe("RoyaltyService", () => {
  beforeEach(() => { vi.resetAllMocks() })

  describe("getRoyalties", () => {
    it("should return royalties for an artist", async () => {
      mockPrisma.royalty.findMany.mockResolvedValue([
        { id: "r-1", nftId: "n-1", artistId: "a-1", amount: { toString: () => "10" }, paidAt: null, nft: { song: { title: "Song" } }, artist: { name: "Artist" }, createdAt: new Date(), updatedAt: new Date() },
      ])
      const result = await RoyaltyService.getRoyalties("a-1", "ADMIN", { artistId: "a-1" })
      expect(result.royalties).toHaveLength(1)
    })
    it("should filter pending", async () => {
      mockPrisma.royalty.findMany.mockResolvedValue([])
      await RoyaltyService.getRoyalties("u-1", "ADMIN", { pending: true })
      expect(mockPrisma.royalty.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ paidAt: null }),
      }))
    })
  })

  describe("distributeRoyalties", () => {
    it("should distribute unpaid royalties", async () => {
      mockPrisma.royalty.findMany.mockResolvedValue([
        { id: "r-1", artistId: "a-1", amount: "100" },
        { id: "r-2", artistId: "a-1", amount: "50" },
      ])
      mockPrisma.user.findUnique.mockResolvedValue({
        email: "platform@musiccoin.demo",
        wallet: { id: "pw-1" },
      })
      mockPrisma.wallet.findUnique.mockResolvedValue({ id: "aw-1" })
      mockTx.royalty.updateMany.mockResolvedValue({ count: 1 })

      const result = await RoyaltyService.distributeRoyalties()
      expect(result.distributed).toBe(2)
      expect(result.artists).toBe(1)
    })
  })
})
