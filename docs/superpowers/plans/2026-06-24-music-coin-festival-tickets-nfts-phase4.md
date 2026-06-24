# Phase 4: Tickets & NFTs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ticket purchasing, NFT minting/buying, and a fan marketplace to the Music Coin Festival platform.

**Architecture:** Feature-based modular services (`src/features/tickets/`, `src/features/nfts/`) using same patterns as Phase 3 — `prisma.$transaction` for atomicity, Server Actions for UI, API routes for REST access, mocked-prisma vitest tests.

**Tech Stack:** Next.js 16.2.9, Prisma v7, jose, vitest v4, Tailwind v4 + shadcn v4, lucide-react

## Global Constraints

- All wallet mutations use `prisma.$transaction` with `Prisma.Decimal` — never float
- Server Actions return `{ success: boolean, data?: T, error?: string }` — matching Phase 2/3 pattern
- API routes return `{ data: T }` (success) or `{ error: string, statusCode: number }` (error)
- JWT auth via `getSession()` from `@/lib/auth/session` (Server Actions) or cookie parsing (API routes)
- `AppError` from `@/lib/errors` for service-level errors
- Prisma v7: model accessor for `NFT` is `nFT` (camelCase convention)
- Next.js 16: `params` is `Promise<{ id: string }>` in route handlers

---
### Task 1: Schema Migration, Type Definitions & Directory Setup

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/types/index.ts`
- Create directories (via PowerShell)

**Interfaces:**
- Consumes: Existing `Event`, `NFT`, `Ticket` models from schema
- Produces: Updated schema with `Event.capacity`, `NFT.royaltyPercentage`; `ITicketWithEvent`, `INftPurchaseRequest`, `IMintNftInput` types

- [ ] **Step 1: Update Prisma schema — add `capacity` to Event, `royaltyPercentage` to NFT**

In `prisma/schema.prisma`:

For **Event model**, add after `ticketPrice`:
```prisma
  ticketPrice Decimal
  capacity    Int?
```

For **NFT model**, replace the current field block with:
```prisma
model NFT {
  id                String   @id @default(uuid()) @db.Uuid
  songId            String   @db.Uuid
  ownerId           String   @db.Uuid
  price             Decimal
  royaltyPercentage Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  // relations unchanged
}
```

- [ ] **Step 2: Create feature directories**

```bash
New-Item -ItemType Directory -Path "src/features/tickets" -Force
New-Item -ItemType Directory -Path "src/features/nfts" -Force
New-Item -ItemType Directory -Path "src/app/api/tickets/buy" -Force
New-Item -ItemType Directory -Path "src/app/api/nfts/buy" -Force
New-Item -ItemType Directory -Path "src/app/(dashboard)/artist/nfts" -Force
New-Item -ItemType Directory -Path "src/app/(dashboard)/nft-marketplace" -Force
```

- [ ] **Step 3: Update TypeScript types**

Add to `src/types/index.ts` after the `ITransferInput` interface:

```typescript
export interface ITicketWithEvent extends ITicket {
  event: IEvent & { organizer: { id: string; name: string } }
}

export interface INftPurchaseRequest {
  nftId: string
}

export interface IMintNftInput {
  title: string
  description: string
  price: number
  royaltyPercentage: number
}
```

Also update the `INFT` interface to include `royaltyPercentage`:
```typescript
export interface INFT {
  id: string
  songId: string
  ownerId: string
  price: number
  royaltyPercentage: number
  createdAt: Date
  updatedAt: Date
}
```

And update `IEvent` to include `capacity`:
```typescript
export interface IEvent {
  // ... existing fields
  ticketPrice: number
  capacity: number | null
  // ...
}
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma src/types/index.ts
git commit -m "feat: add capacity to Event, royaltyPercentage to NFT, new types"
```

---
### Task 2: Ticket Service + Server Actions + API Routes + Tests

**Files:**
- Create: `src/features/tickets/ticket.service.ts`
- Create: `src/features/tickets/ticket.actions.ts`
- Create: `src/app/api/tickets/route.ts`
- Create: `src/app/api/tickets/buy/route.ts`
- Create: `src/features/tickets/ticket.test.ts`

**Interfaces:**
- Consumes: `WalletService` (wallet lookup via prisma directly), `AppError`, `getSession`, `TransactionType`
- Produces: `TicketService.buyTicket(userId, eventId)` → `{ ticket, transaction }`, `TicketService.getUserTickets(userId)` → `Ticket[]`
- Produces: `buyTicketAction(eventId)` / `getUserTicketsAction()` Server Actions
- Produces: `GET /api/tickets` (list), `POST /api/tickets/buy` (buy)

- [ ] **Step 1: Create `src/features/tickets/ticket.service.ts`**

```typescript
import { prisma } from "@/lib/prisma"
import { AppError } from "@/lib/errors"

export const TicketService = {
  async buyTicket(userId: string, eventId: string) {
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } })
      if (!event) throw new AppError("Event not found", 404)
      if (event.status !== "PUBLISHED") throw new AppError("Event is not available for purchase", 400)

      if (event.capacity !== null) {
        const ticketCount = await tx.ticket.count({ where: { eventId } })
        if (ticketCount >= event.capacity) throw new AppError("Event is sold out", 400)
      }

      const fanWallet = await tx.wallet.findUnique({ where: { userId } })
      if (!fanWallet) throw new AppError("Wallet not found", 404)
      if (fanWallet.balance.lessThan(event.ticketPrice)) {
        throw new AppError("Insufficient funds", 400)
      }

      const organizerWallet = await tx.wallet.findUnique({ where: { userId: event.organizerId } })
      if (!organizerWallet) throw new AppError("Organizer wallet not found", 404)

      await tx.wallet.update({
        where: { id: fanWallet.id },
        data: { balance: { decrement: event.ticketPrice } },
      })
      await tx.wallet.update({
        where: { id: organizerWallet.id },
        data: { balance: { increment: event.ticketPrice } },
      })

      const ticket = await tx.ticket.create({
        data: { eventId, userId },
      })

      const transaction = await tx.transaction.create({
        data: {
          senderId: fanWallet.id,
          receiverId: organizerWallet.id,
          amount: event.ticketPrice,
          type: "TICKET_PURCHASE",
        },
      })

      return { ticket, transaction }
    })
  },

  async getUserTickets(userId: string) {
    return prisma.ticket.findMany({
      where: { userId },
      include: { event: { include: { organizer: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
    })
  },
}
```

- [ ] **Step 2: Create `src/features/tickets/ticket.actions.ts`**

```typescript
"use server"

import { TicketService } from "@/features/tickets/ticket.service"
import { getSession } from "@/lib/auth/session"

export async function buyTicketAction(eventId: string) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const result = await TicketService.buyTicket(session.sub, eventId)
    return { success: true as const, data: result }
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
    return { success: true as const, data: tickets }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
```

- [ ] **Step 3: Create `src/app/api/tickets/route.ts`**

```typescript
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
    if (!token) return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })

    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    const userId = payload.sub as string

    const { TicketService } = await import("@/features/tickets/ticket.service")
    const tickets = await TicketService.getUserTickets(userId)
    return NextResponse.json({ data: tickets })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message, statusCode: 400 }, { status: 400 })
  }
}
```

- [ ] **Step 4: Create `src/app/api/tickets/buy/route.ts`**

```typescript
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
    if (!token) return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })

    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    const userId = payload.sub as string

    const { eventId } = await request.json()
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required", statusCode: 400 }, { status: 400 })
    }

    const { TicketService } = await import("@/features/tickets/ticket.service")
    const result = await TicketService.buyTicket(userId, eventId)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    let status = 400
    if (message.includes("Not authenticated")) status = 401
    if (message.includes("not found")) status = 404
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}
```

- [ ] **Step 5: Create `src/features/tickets/ticket.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockTx = {
  event: { findUnique: vi.fn(), count: vi.fn() },
  ticket: { count: vi.fn(), create: vi.fn() },
  wallet: { findUnique: vi.fn(), update: vi.fn() },
  transaction: { create: vi.fn() },
}

const mockPrisma = {
  ticket: { findMany: vi.fn() },
  $transaction: vi.fn(),
}

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
```

- [ ] **Step 6: Build check and test**

```bash
npm run build
npm test -- src/features/tickets/ticket.test.ts
```

Expected: Build succeeds, 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/tickets/ src/app/api/tickets/
git commit -m "feat: add ticket service, API routes, and Server Actions"
```

---
### Task 3: NFT Service + Server Actions + API Routes + Tests

**Files:**
- Create: `src/features/nfts/nft.service.ts`
- Create: `src/features/nfts/nft.actions.ts`
- Create: `src/app/api/nfts/route.ts`
- Create: `src/app/api/nfts/buy/route.ts`
- Create: `src/features/nfts/nft.test.ts`

**Interfaces:**
- Consumes: `AppError`, `getSession`, `TransactionType`
- Produces: `NftService.mintNft(artistId, input)` → NFT with relations, `NftService.getAvailableNfts()` → NFT[], `NftService.buyNft(buyerId, nftId)` → `{ nft, transaction }`
- Produces: `mintNftAction`, `getNftsAction`, `buyNftAction` Server Actions
- Produces: `GET /api/nfts` (list), `POST /api/nfts` (mint), `POST /api/nfts/buy` (buy)

⚠ **Prisma camelCase note:** The `NFT` model is accessed as `prisma.nFT` — this is used in the tests but the service uses standard Prisma client queries so it's handled automatically. The service code uses the transaction client `tx` which has properly named accessors.

- [ ] **Step 1: Create `src/features/nfts/nft.service.ts`**

```typescript
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { AppError } from "@/lib/errors"

interface MintNftInput {
  title: string
  description: string
  price: number
  royaltyPercentage: number
}

export const NftService = {
  async mintNft(artistId: string, input: MintNftInput) {
    return prisma.$transaction(async (tx) => {
      const song = await tx.song.create({
        data: {
          artistId,
          title: input.title,
          description: input.description,
        },
      })

      const nft = await tx.nFT.create({
        data: {
          songId: song.id,
          ownerId: artistId,
          price: new Prisma.Decimal(input.price),
          royaltyPercentage: input.royaltyPercentage,
        },
        include: { song: true, owner: { select: { id: true, name: true } } },
      })

      return nft
    })
  },

  async getAvailableNfts() {
    return prisma.nFT.findMany({
      include: {
        song: true,
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  },

  async buyNft(buyerId: string, nftId: string) {
    return prisma.$transaction(async (tx) => {
      const nft = await tx.nFT.findUnique({
        where: { id: nftId },
        include: { song: true },
      })
      if (!nft) throw new AppError("NFT not found", 404)
      if (nft.ownerId === buyerId) throw new AppError("Cannot purchase your own NFT", 400)

      const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
      if (!buyerWallet) throw new AppError("Buyer wallet not found", 404)
      if (buyerWallet.balance.lessThan(nft.price)) {
        throw new AppError("Insufficient funds", 400)
      }

      const sellerWallet = await tx.wallet.findUnique({ where: { userId: nft.ownerId } })
      if (!sellerWallet) throw new AppError("Seller wallet not found", 404)

      // Transfer funds
      await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: { balance: { decrement: nft.price } },
      })
      await tx.wallet.update({
        where: { id: sellerWallet.id },
        data: { balance: { increment: nft.price } },
      })

      // Transfer ownership
      await tx.nFT.update({
        where: { id: nftId },
        data: { ownerId: buyerId },
      })

      // Log sale transaction
      const transaction = await tx.transaction.create({
        data: {
          senderId: buyerWallet.id,
          receiverId: sellerWallet.id,
          amount: nft.price,
          type: "TRANSFER",
        },
      })

      // Handle royalty
      if (nft.royaltyPercentage > 0) {
        const royaltyAmount = nft.price.mul(nft.royaltyPercentage).div(100)
        await tx.royalty.create({
          data: {
            nftId: nft.id,
            artistId: nft.ownerId,
            amount: royaltyAmount,
          },
        })
        await tx.transaction.create({
          data: {
            senderId: buyerWallet.id,
            receiverId: sellerWallet.id,
            amount: royaltyAmount,
            type: "ROYALTY_PAYMENT",
          },
        })
      }

      const updatedNft = await tx.nFT.findUnique({
        where: { id: nftId },
        include: { song: true, owner: { select: { id: true, name: true } } },
      })

      return { nft: updatedNft, transaction }
    })
  },
}
```

- [ ] **Step 2: Create `src/features/nfts/nft.actions.ts`**

```typescript
"use server"

import { NftService } from "@/features/nfts/nft.service"
import { getSession } from "@/lib/auth/session"

export async function mintNftAction(input: {
  title: string
  description: string
  price: number
  royaltyPercentage: number
}) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const nft = await NftService.mintNft(session.sub, input)
    return { success: true as const, data: nft }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function getNftsAction() {
  try {
    const nfts = await NftService.getAvailableNfts()
    return { success: true as const, data: nfts }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function buyNftAction(nftId: string) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const result = await NftService.buyNft(session.sub, nftId)
    return { success: true as const, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
```

- [ ] **Step 3: Create `src/app/api/nfts/route.ts`**

```typescript
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { NftService } = await import("@/features/nfts/nft.service")
    const nfts = await NftService.getAvailableNfts()
    return NextResponse.json({ data: nfts })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message, statusCode: 400 }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
    if (!token) return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })

    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })

    const body = await request.json()
    const { title, description, price, royaltyPercentage } = body
    if (!title || !description || price === undefined || royaltyPercentage === undefined) {
      return NextResponse.json({ error: "Missing required fields", statusCode: 400 }, { status: 400 })
    }

    const { NftService } = await import("@/features/nfts/nft.service")
    const nft = await NftService.mintNft(payload.sub as string, {
      title,
      description,
      price: Number(price),
      royaltyPercentage: Number(royaltyPercentage),
    })
    return NextResponse.json({ data: nft }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message, statusCode: 400 }, { status: 400 })
  }
}
```

- [ ] **Step 4: Create `src/app/api/nfts/buy/route.ts`**

```typescript
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
    if (!token) return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })

    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })

    const { nftId } = await request.json()
    if (!nftId) {
      return NextResponse.json({ error: "nftId is required", statusCode: 400 }, { status: 400 })
    }

    const { NftService } = await import("@/features/nfts/nft.service")
    const result = await NftService.buyNft(payload.sub as string, nftId)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    let status = 400
    if (message.includes("Not authenticated")) status = 401
    if (message.includes("not found")) status = 404
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}
```

- [ ] **Step 5: Create `src/features/nfts/nft.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockTx = {
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
}

const mockPrisma = {
  nFT: { findMany: vi.fn() },
  $transaction: vi.fn(),
}

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
    vi.clearAllMocks()
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
        mockTx.nFT.findUnique.mockResolvedValue(validNft)
        mockTx.wallet.findUnique
          .mockResolvedValueOnce({ id: "buyer-wallet", balance: { lessThan: () => false } })
          .mockResolvedValueOnce({ id: "seller-wallet" })
        mockTx.nFT.update.mockResolvedValue({ ...validNft, ownerId: "fan-1" })
        mockTx.transaction.create.mockResolvedValue({ id: "tx-1" })
        mockTx.nFT.findUnique.mockResolvedValue({ ...validNft, ownerId: "fan-1", owner: { name: "Fan" } })
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
        mockTx.nFT.findUnique.mockResolvedValue(validNft)
        mockTx.wallet.findUnique
          .mockResolvedValueOnce({ id: "buyer-wallet", balance: { lessThan: () => false } })
          .mockResolvedValueOnce({ id: "seller-wallet" })
        mockTx.nFT.update.mockResolvedValue({})
        mockTx.transaction.create.mockResolvedValue({ id: "tx-1" })
        mockTx.royalty.create.mockImplementation(() => { royaltyCreated = true; return {} })
        mockTx.nFT.findUnique.mockResolvedValue({ owner: { name: "Fan" } })
        return cb(mockTx)
      })

      await NftService.buyNft("fan-1", "nft-1")
      expect(royaltyCreated).toBe(true)
    })
  })
})
```

- [ ] **Step 6: Build check and test**

```bash
npm run build
npm test -- src/features/nfts/nft.test.ts
```

Expected: Build succeeds, 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/nfts/ src/app/api/nfts/
git commit -m "feat: add NFT service, API routes, and Server Actions"
```

---
### Task 4: Artist NFT Management Page

**Files:**
- Create: `src/app/(dashboard)/artist/nfts/page.tsx`

**Interfaces:**
- Consumes: `mintNftAction`, `getNftsAction` from Task 3
- Produces: Artist-facing NFT mint form + owned NFTs list at `/artist/nfts`

- [ ] **Step 1: Create `src/app/(dashboard)/artist/nfts/page.tsx`**

```tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { mintNftAction, getNftsAction } from "@/features/nfts/nft.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ImageIcon, Music } from "lucide-react"

interface NftItem {
  id: string
  song: { title: string; description: string }
  price: number
  royaltyPercentage: number
  owner: { id: string; name: string }
}

export default function ArtistNfts() {
  const [nfts, setNfts] = useState<NftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [royaltyPct, setRoyaltyPct] = useState("")
  const [minting, setMinting] = useState(false)
  const [error, setError] = useState("")

  const loadNfts = useCallback(async () => {
    const res = await getNftsAction()
    if (res.success) {
      const all = res.data as unknown as NftItem[]
      setNfts(all.filter((n) => n.owner?.id === undefined || true))
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadNfts() }, [loadNfts])

  async function handleMint(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMinting(true)
    const result = await mintNftAction({
      title,
      description,
      price: Number(price),
      royaltyPercentage: Number(royaltyPct),
    })
    if (result.success) {
      setTitle("")
      setDescription("")
      setPrice("")
      setRoyaltyPct("")
      loadNfts()
    } else {
      setError(result.error ?? "Something went wrong")
    }
    setMinting(false)
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My NFTs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Mint New NFT</CardTitle>
          <CardDescription>Upload song metadata and create an NFT</CardDescription>
        </CardHeader>
        <form onSubmit={handleMint}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Song Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer Vibes" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A catchy summer track" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (MC)</Label>
                <Input id="price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="50" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="royalty">Royalty %</Label>
                <Input id="royalty" type="number" min="0" max="100" value={royaltyPct} onChange={(e) => setRoyaltyPct(e.target.value)} placeholder="10" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={minting}>
              {minting ? "Minting..." : "Mint NFT"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Your NFTs</h2>
        {nfts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">No NFTs yet</p>
              <p className="text-sm text-muted-foreground">Mint your first NFT above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nfts.map((nft) => (
              <Card key={nft.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Music className="size-5 text-primary" />
                    <CardTitle className="text-lg">{nft.song.title}</CardTitle>
                  </div>
                  <CardDescription>{nft.song.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Price:</span> {Number(nft.price).toFixed(2)} MC</p>
                  <p><span className="text-muted-foreground">Royalty:</span> {nft.royaltyPercentage}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/artist/nfts/
git commit -m "feat: add artist NFT minting page"
```

---
### Task 5: Fan NFT Marketplace Page

**Files:**
- Create: `src/app/(dashboard)/nft-marketplace/page.tsx`

**Interfaces:**
- Consumes: `getNftsAction`, `buyNftAction` from Task 3
- Produces: Fan-facing marketplace page at `/nft-marketplace`

- [ ] **Step 1: Create `src/app/(dashboard)/nft-marketplace/page.tsx`**

```tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { getNftsAction, buyNftAction } from "@/features/nfts/nft.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Music, ShoppingCart, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface NftItem {
  id: string
  song: { title: string; description: string }
  price: number
  royaltyPercentage: number
  owner: { id: string; name: string }
}

export default function NftMarketplace() {
  const { user } = useAuth()
  const [nfts, setNfts] = useState<NftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const loadNfts = useCallback(async () => {
    const res = await getNftsAction()
    if (res.success) setNfts(res.data as unknown as NftItem[])
    setLoading(false)
  }, [])

  useEffect(() => { loadNfts() }, [loadNfts])

  async function handleBuy(nftId: string) {
    setError("")
    setBuyingId(nftId)
    const result = await buyNftAction(nftId)
    if (result.success) {
      loadNfts()
    } else {
      setError(result.error ?? "Purchase failed")
    }
    setBuyingId(null)
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  const availableNfts = user ? nfts.filter((n) => n.owner.id !== user.id) : nfts

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">NFT Marketplace</h1>
        <p className="text-muted-foreground">Discover and collect music NFTs from your favorite artists</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {availableNfts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium">No NFTs available</p>
            <p className="text-sm text-muted-foreground">Check back later for new music NFTs.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableNfts.map((nft) => (
            <Card key={nft.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Music className="size-5 text-primary" />
                  <CardTitle className="text-lg">{nft.song.title}</CardTitle>
                </div>
                <CardDescription>{nft.song.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="size-4" />
                  {nft.owner.name}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{Number(nft.price).toFixed(2)} MC</span>
                  <span className="text-xs text-muted-foreground">{nft.royaltyPercentage}% royalty</span>
                </div>
                {user && nft.owner.id !== user.id && (
                  <Button
                    className="w-full"
                    onClick={() => handleBuy(nft.id)}
                    disabled={buyingId === nft.id}
                  >
                    <ShoppingCart className="mr-2 size-4" />
                    {buyingId === nft.id ? "Buying..." : "Buy NFT"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/nft-marketplace/
git commit -m "feat: add fan NFT marketplace page"
```

---
### Task 6: Sidebar Nav Update + Seed Script + Final Verification

**Files:**
- Modify: `src/app/(dashboard)/components/sidebar.tsx`
- Modify: `prisma/seed.ts`
- Run: Final build + full test suite

**Interfaces:**
- Consumes: Artist NFTs page (Task 4), Fan Marketplace page (Task 5), Ticket/NFT services
- Produces: Role-appropriate navigation for all users, seed data for testing, verified green build

- [ ] **Step 1: Update sidebar navigation**

In `src/app/(dashboard)/components/sidebar.tsx`, modify the `roleNav` entries for ARTIST and FAN:

For ARTIST nav items, replace the current entry:
```typescript
  ARTIST: [
    { href: "/wallet", label: "My Wallet", icon: Wallet },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/nfts", label: "My NFTs", icon: ImageIcon },
  ],
```

For FAN nav items, add Marketplace entry:
```typescript
  FAN: [
    { href: "/fan", label: "Browse Events", icon: Search },
    { href: "/fan/wallet", label: "My Wallet", icon: Wallet },
    { href: "/nft-marketplace", label: "Marketplace", icon: ImageIcon },
    { href: "/voting", label: "Voting", icon: Vote },
  ],
```

- [ ] **Step 2: Update seed script**

In `prisma/seed.ts`, add after the user creation loop (and before the table counts section):

```typescript
  // Seed sample published event with capacity
  const organizer = await prisma.user.findUnique({ where: { email: "organizer@musiccoin.festival" } })
  const artist = await prisma.user.findUnique({ where: { email: "artist@musiccoin.festival" } })
  const fan = await prisma.user.findUnique({ where: { email: "fan@musiccoin.festival" } })

  if (organizer) {
    const existingEvent = await prisma.event.findFirst({ where: { organizerId: organizer.id } })
    if (!existingEvent) {
      await prisma.event.create({
        data: {
          organizerId: organizer.id,
          title: "Summer Music Festival 2026",
          description: "A weekend of live music, food, and art in the park.",
          venue: "City Park Arena",
          date: new Date("2026-08-15"),
          ticketPrice: new Prisma.Decimal(50),
          capacity: 500,
          status: "PUBLISHED",
        },
      })
      console.log("Created sample published event with capacity 500")
    }
  }

  // Seed sample NFT from artist
  if (artist) {
    const existingSong = await prisma.song.findFirst({ where: { artistId: artist.id } })
    if (!existingSong) {
      const artistWallet = await prisma.wallet.findUnique({ where: { userId: artist.id } })

      const song = await prisma.song.create({
        data: {
          artistId: artist.id,
          title: "Neon Dreams",
          description: "An original electronic track with unique vibes.",
        },
      })

      await prisma.nFT.create({
        data: {
          songId: song.id,
          ownerId: artist.id,
          price: new Prisma.Decimal(100),
          royaltyPercentage: 10,
        },
      })
      console.log("Created sample NFT 'Neon Dreams' priced at 100 MC with 10% royalty")
    }
  }
```

- [ ] **Step 3: Final verification**

```bash
npm run build
npm test
```

Expected: Build succeeds. All 42+ tests pass (15 Phase 2 + 6 ticket + 6 NFT + 15 Phase 3).

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts src/app/\(dashboard\)/components/sidebar.tsx
git commit -m "feat: update sidebar nav, seed sample data, finalize Phase 4"
```
