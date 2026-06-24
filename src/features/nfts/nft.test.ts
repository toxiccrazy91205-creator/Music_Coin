import { describe, it, expect, vi, beforeEach } from "vitest"

const mockTx = vi.hoisted(() => ({
  song: { create: vi.fn() },
  nFT: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  wallet: { findUnique: vi.fn(), update: vi.fn() },
  transaction: { create: vi.fn() },
  royalty: { create: vi.fn() },
}))

const mockPrisma = vi.hoisted(() => ({
  nFT: { findMany: vi.fn() },
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

import { NftService } from "./nft.service"

describe("NftService", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe("mintNft", () => {
    it("should create song and NFT", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.song.create.mockResolvedValue({ id: "song-1", title: "My Track" })
        mockTx.nFT.create.mockResolvedValue({
          id: "nft-1",
          songId: "song-1",
          price: { toString: () => "100" },
          royaltyPercentage: 10,
          song: { title: "My Track" },
          owner: { id: "artist-1", name: "Artist" },
        })
        return cb(mockTx)
      })

      const nft = await NftService.mintNft("artist-1", {
        title: "My Track",
        description: "A great track",
        price: 100,
        royaltyPercentage: 10,
      })
      expect(nft.royaltyPercentage).toBe(10)
      expect(mockTx.song.create).toHaveBeenCalled()
      expect(mockTx.nFT.create).toHaveBeenCalled()
    })
  })

  describe("getAvailableNfts", () => {
    it("should return all NFTs with relations", async () => {
      mockPrisma.nFT.findMany.mockResolvedValue([{ id: "nft-1", song: { title: "Track" }, owner: { name: "Artist" } }])
      const nfts = await NftService.getAvailableNfts()
      expect(nfts).toHaveLength(1)
    })
  })

  describe("buyNft", () => {
    const validNft = {
      id: "nft-1",
      ownerId: "artist-1",
      price: { lessThan: (x: number) => false, mul: (p: number) => ({ div: (d: number) => ({ toString: () => "10" }) }) },
      royaltyPercentage: 10,
      song: { title: "Track" },
    }

    it("should buy an NFT and transfer ownership", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.nFT.findUnique
          .mockResolvedValueOnce(validNft)
          .mockResolvedValueOnce({ ...validNft, ownerId: "fan-1", owner: { name: "Fan" } })
        mockTx.wallet.findUnique
          .mockResolvedValueOnce({ id: "buyer-wallet", balance: { lessThan: () => false } })
          .mockResolvedValueOnce({ id: "seller-wallet" })
        mockTx.nFT.update.mockResolvedValue({ ...validNft, ownerId: "fan-1" })
        mockTx.transaction.create.mockResolvedValue({ id: "tx-1" })
        return cb(mockTx)
      })

      const result = await NftService.buyNft("fan-1", "nft-1")
      expect(result.nft?.ownerId).toBe("fan-1")
    })

    it("should reject buying own NFT", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.nFT.findUnique.mockResolvedValue({ ...validNft, ownerId: "fan-1" })
        return cb(mockTx)
      })
      await expect(NftService.buyNft("fan-1", "nft-1")).rejects.toThrow("Cannot purchase your own NFT")
    })

    it("should reject if insufficient funds", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.nFT.findUnique.mockResolvedValue(validNft)
        mockTx.wallet.findUnique.mockResolvedValue({ id: "buyer-wallet", balance: { lessThan: () => true } })
        return cb(mockTx)
      })
      await expect(NftService.buyNft("fan-1", "nft-1")).rejects.toThrow("Insufficient funds")
    })

    it("should log royalty when royaltyPercentage > 0", async () => {
      let royaltyCreated = false
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.nFT.findUnique
          .mockResolvedValueOnce(validNft)
          .mockResolvedValueOnce({ owner: { name: "Fan" } })
        mockTx.wallet.findUnique
          .mockResolvedValueOnce({ id: "buyer-wallet", balance: { lessThan: () => false } })
          .mockResolvedValueOnce({ id: "seller-wallet" })
        mockTx.nFT.update.mockResolvedValue({})
        mockTx.transaction.create.mockResolvedValue({ id: "tx-1" })
        mockTx.royalty.create.mockImplementation(() => { royaltyCreated = true; return {} })
        return cb(mockTx)
      })

      await NftService.buyNft("fan-1", "nft-1")
      expect(royaltyCreated).toBe(true)
    })
  })
})
