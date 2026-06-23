import { describe, it, expect, vi, beforeEach } from "vitest"
import { Prisma } from "@prisma/client"

const mockPrisma = vi.hoisted(() => ({
  wallet: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  transaction: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
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

import { WalletService } from "./wallet.service"

describe("WalletService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getWallet", () => {
    it("should return wallet with transactions for a valid user", async () => {
      const mockData = {
        id: "wallet-1",
        userId: "user-1",
        balance: new Prisma.Decimal(1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        sentTransactions: [],
        receivedTransactions: [],
      }
      mockPrisma.wallet.findUnique.mockResolvedValue(mockData)

      const result = await WalletService.getWallet("user-1")
      expect(result.id).toBe("wallet-1")
      expect(mockPrisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: {
          sentTransactions: { orderBy: { createdAt: "desc" }, take: 50 },
          receivedTransactions: { orderBy: { createdAt: "desc" }, take: 50 },
        },
      })
    })

    it("should throw AppError if wallet not found", async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null)
      await expect(WalletService.getWallet("nonexistent")).rejects.toThrow("Wallet not found")
    })
  })

  describe("getTransactions", () => {
    it("should return paginated transactions", async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({ id: "wallet-1", userId: "user-1" })
      mockPrisma.transaction.findMany.mockResolvedValue([{ id: "tx-1", amount: new Prisma.Decimal(100) }])
      mockPrisma.transaction.count.mockResolvedValue(1)

      const result = await WalletService.getTransactions("user-1", 1, 20)
      expect(result.total).toBe(1)
      expect(result.data).toHaveLength(1)
      expect(result.page).toBe(1)
    })
  })

  describe("executeWalletTransfer", () => {
    it("should transfer funds atomically", async () => {
      const senderWallet = { id: "wallet-1", balance: new Prisma.Decimal(500) }
      const receiverWallet = { id: "wallet-2", balance: new Prisma.Decimal(100) }

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        return cb({
          wallet: {
            findUniqueOrThrow: vi.fn()
              .mockResolvedValueOnce(senderWallet),
            update: vi.fn()
              .mockResolvedValueOnce({ ...senderWallet, balance: new Prisma.Decimal(400) })
              .mockResolvedValueOnce({ ...receiverWallet, balance: new Prisma.Decimal(200) }),
          },
          transaction: {
            create: vi.fn().mockResolvedValue({
              id: "tx-1",
              senderId: "wallet-1",
              receiverId: "wallet-2",
              amount: new Prisma.Decimal(100),
              type: "TRANSFER",
            }),
          },
        })
      })

      const result = await WalletService.executeWalletTransfer(
        "wallet-1", "wallet-2", new Prisma.Decimal(100),
      )
      expect(result.type).toBe("TRANSFER")
      expect(result.amount).toEqual(new Prisma.Decimal(100))
    })

    it("should reject transfer with insufficient funds", async () => {
      const senderWallet = { id: "wallet-1", balance: new Prisma.Decimal(10) }

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        return cb({
          wallet: {
            findUniqueOrThrow: vi.fn().mockResolvedValue(senderWallet),
          },
        })
      })

      await expect(
        WalletService.executeWalletTransfer("wallet-1", "wallet-2", new Prisma.Decimal(100)),
      ).rejects.toThrow("Insufficient funds")
    })

    it("should reject non-positive amount", async () => {
      await expect(
        WalletService.executeWalletTransfer("wallet-1", "wallet-2", new Prisma.Decimal(0)),
      ).rejects.toThrow("Amount must be positive")

      await expect(
        WalletService.executeWalletTransfer("wallet-1", "wallet-2", new Prisma.Decimal(-50)),
      ).rejects.toThrow("Amount must be positive")
    })
  })

  describe("creditWallet", () => {
    it("should credit wallet and create DEPOSIT transaction", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        return cb({
          wallet: {
            update: vi.fn().mockResolvedValue({
              id: "wallet-1",
              balance: new Prisma.Decimal(1000),
            }),
          },
          transaction: {
            create: vi.fn().mockResolvedValue({
              id: "tx-1",
              senderId: "wallet-1",
              receiverId: "wallet-1",
              amount: new Prisma.Decimal(1000),
              type: "DEPOSIT",
            }),
          },
        })
      })

      const result = await WalletService.creditWallet("wallet-1", new Prisma.Decimal(1000))
      expect(result.transaction.type).toBe("DEPOSIT")
      expect(result.wallet.balance).toEqual(new Prisma.Decimal(1000))
    })
  })
})
