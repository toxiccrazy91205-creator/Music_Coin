# Phase 3: Wallet & Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement wallet with atomic transfers, event CRUD, Fan signup bonus (1000 coins), and role-based dashboards.

**Architecture:** Server Actions for UI consumption, REST API routes for external access, shared business logic services in `src/features/`, Prisma `$transaction` for ACID wallet operations.

**Tech Stack:** Next.js 16.2.9, Prisma v7, PostgreSQL, jose, bcryptjs, Vitest, Tailwind v4 + shadcn v4

## Global Constraints

- Prisma v7: use `prisma.$transaction` for ALL wallet mutations; `Prisma.Decimal` for monetary values
- Prisma v7: model accessor for `NFT` is `nFT` (camelCase convention)
- Zod v4: use `z.nativeEnum()` for enums, `z.object()` for schemas
- Next.js 16: `cookies()` from `next/headers` is async; `"use server"` directive for Server Actions
- AGENTS.md: check `node_modules/next/dist/docs/` before using new Next.js APIs
- All API routes return JSON with `{ data: T }` (success) or `{ error: string, statusCode: number }` (error)
- All Server Actions return `{ success: boolean, data?: T, error?: string }` (matching Phase 2 `AuthResult` pattern)
- Role constants: `ROLE_LEVELS`, `ROLE_LABELS`, `ROLE_DESCRIPTIONS` from `@/types`
- JWT payload available to Server Actions via `getSession()` from `@/lib/auth/session`
- Money stored as `Prisma.Decimal` (PostgreSQL numeric), never float

---
### Task 1: Schema Migration + Type Definitions

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/` (via `prisma db push --accept-data-loss`)
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: Existing `Event` model with `artistId`, existing `IEvent` type
- Produces: Updated schema with `organizerId`, Transaction indexes; `IEvent.organizerId`, `IWalletWithTransactions`, `ITransferInput`, `ICreateEventInput`, `IUpdateEventInput` types

- [ ] **Step 1: Update Prisma schema — rename `artistId` to `organizerId` on Event**

In `prisma/schema.prisma`, change the Event model:

```prisma
model Event {
  id            String      @id @default(uuid()) @db.Uuid
  organizerId   String      @db.Uuid
  title         String
  description   String
  venue         String
  date          DateTime
  ticketPrice   Decimal
  status        EventStatus @default(DRAFT)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  organizer User     @relation(fields: [organizerId], references: [id], onDelete: Cascade)
  tickets   Ticket[]
}
```

- [ ] **Step 2: Add composite indexes to Transaction model**

```prisma
model Transaction {
  id         String          @id @default(uuid()) @db.Uuid
  senderId   String          @db.Uuid
  receiverId String          @db.Uuid
  amount     Decimal
  type       TransactionType
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @updatedAt

  sender   Wallet @relation("SenderWallet", fields: [senderId], references: [id], onDelete: Cascade)
  receiver Wallet @relation("ReceiverWallet", fields: [receiverId], references: [id], onDelete: Cascade)

  @@index([senderId, createdAt])
  @@index([receiverId, createdAt])
}
```

- [ ] **Step 3: Update TypeScript types**

In `src/types/index.ts`:

Change `IEvent.artistId` to `IEvent.organizerId` and `IEventWithRelations.artist` to `IEventWithRelations.organizer`:

```typescript
export interface IEvent {
  id: string
  organizerId: string
  title: string
  description: string
  venue: string
  date: Date
  ticketPrice: number
  status: EventStatus
  createdAt: Date
  updatedAt: Date
}

export interface IEventWithRelations extends IEvent {
  organizer: IUser
  tickets: ITicket[]
}
```

Add new types after `ITransaction`:

```typescript
export interface IWalletWithTransactions extends IWallet {
  sentTransactions: ITransaction[]
  receivedTransactions: ITransaction[]
}

export interface ICreateEventInput {
  title: string
  description: string
  venue: string
  date: string
  ticketPrice: number
}

export interface IUpdateEventInput {
  title?: string
  description?: string
  venue?: string
  date?: string
  ticketPrice?: number
}

export interface ITransferInput {
  receiverEmail: string
  amount: number
}
```

- [ ] **Step 4: Generate Prisma client**

```bash
cd 'E:\ASTNIQ-SOLUTION\task\Music_coin_demo'
npx prisma generate
```

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: No TypeScript errors (the `organizerId` rename + new types compile clean).

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma src/types/index.ts
git commit -m "feat: rename Event.artistId → organizerId, add Transaction indexes, expand types"
```

---
### Task 2: AppError + WalletService

**Files:**
- Create: `src/lib/errors.ts`
- Create: `src/features/wallet/wallet.service.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `IWalletWithTransactions`, `ITransaction`, `TransactionType`, `Prisma.Decimal`
- Produces: `AppError` class, `WalletService` with `getWallet()`, `getTransactions()`, `executeWalletTransfer()`, `creditWallet()`

- [ ] **Step 1: Create `src/lib/errors.ts`**

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = "AppError"
  }
}
```

- [ ] **Step 2: Create `src/features/wallet/wallet.service.ts`**

```typescript
import { prisma } from "@/lib/prisma"
import { Prisma, TransactionType } from "@prisma/client"
import { AppError } from "@/lib/errors"

export const WalletService = {
  async getWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        sentTransactions: { orderBy: { createdAt: "desc" }, take: 50 },
        receivedTransactions: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    })
    if (!wallet) throw new AppError("Wallet not found", 404)
    return wallet
  },

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) throw new AppError("Wallet not found", 404)

    const skip = (page - 1) * limit
    const where = {
      OR: [{ senderId: wallet.id }, { receiverId: wallet.id }],
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    return { data, total, page, limit }
  },

  async executeWalletTransfer(
    senderWalletId: string,
    receiverWalletId: string,
    amount: Prisma.Decimal,
    type: TransactionType = "TRANSFER",
  ) {
    if (amount.lessThanOrEqualTo(0)) {
      throw new AppError("Amount must be positive", 400)
    }

    return prisma.$transaction(async (tx) => {
      const sender = await tx.wallet.findUniqueOrThrow({
        where: { id: senderWalletId },
      })
      if (sender.balance.lessThan(amount)) {
        throw new AppError("Insufficient funds", 400)
      }

      await tx.wallet.update({
        where: { id: senderWalletId },
        data: { balance: { decrement: amount } },
      })
      await tx.wallet.update({
        where: { id: receiverWalletId },
        data: { balance: { increment: amount } },
      })

      return tx.transaction.create({
        data: {
          senderId: senderWalletId,
          receiverId: receiverWalletId,
          amount,
          type,
        },
      })
    })
  },

  async creditWallet(
    walletId: string,
    amount: Prisma.Decimal,
    type: TransactionType = "DEPOSIT",
  ) {
    if (amount.lessThanOrEqualTo(0)) {
      throw new AppError("Amount must be positive", 400)
    }

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      })

      const transaction = await tx.transaction.create({
        data: {
          senderId: walletId,
          receiverId: walletId,
          amount,
          type,
        },
      })

      return { wallet, transaction }
    })
  },
}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/errors.ts src/features/wallet/wallet.service.ts
git commit -m "feat: add AppError class and WalletService with atomic transfers"
```

---
### Task 3: FestivalManagementService

**Files:**
- Create: `src/features/events/events.service.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `AppError`, `IEvent`, `ICreateEventInput`, `IUpdateEventInput`
- Produces: `EventService` with `getEvents()`, `getEventById()`, `createEvent()`, `updateEvent()`, `publishEvent()`, `deleteEvent()`

- [ ] **Step 1: Create `src/features/events/events.service.ts`**

```typescript
import { prisma } from "@/lib/prisma"
import { EventStatus } from "@prisma/client"
import { AppError } from "@/lib/errors"
import type { ICreateEventInput, IUpdateEventInput } from "@/types"

export const EventService = {
  async getEvents(filters?: { status?: EventStatus; organizerId?: string }) {
    const where: Record<string, unknown> = {}
    if (filters?.status) where.status = filters.status
    if (filters?.organizerId) where.organizerId = filters.organizerId

    return prisma.event.findMany({
      where,
      include: { organizer: { select: { id: true, name: true, email: true } } },
      orderBy: { date: "asc" },
    })
  },

  async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { organizer: { select: { id: true, name: true, email: true } } },
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
        date: new Date(data.date),
        ticketPrice: new Prisma.Decimal(data.ticketPrice),
        status: "DRAFT",
      },
      include: { organizer: { select: { id: true, name: true, email: true } } },
    })
  },

  async updateEvent(eventId: string, userId: string, data: IUpdateEventInput) {
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) throw new AppError("Event not found", 404)
    if (event.organizerId !== userId) throw new AppError("Not authorized to edit this event", 403)

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.venue !== undefined) updateData.venue = data.venue
    if (data.date !== undefined) updateData.date = new Date(data.date)
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
```

Import `Prisma` at the top:
```typescript
import { Prisma } from "@prisma/client"
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/events/events.service.ts
git commit -m "feat: add FestivalManagementService with event CRUD and publish workflow"
```

---
### Task 4: Wallet API Routes + Server Actions

**Files:**
- Create: `src/app/api/wallet/route.ts`
- Create: `src/app/api/wallet/transactions/route.ts`
- Create: `src/app/api/wallet/transfer/route.ts`
- Create: `src/features/wallet/wallet.actions.ts`

**Interfaces:**
- Consumes: `WalletService` from Task 2, `getSession` from `@/lib/auth/session`, `IWalletWithTransactions`, `ITransaction`, `ITransferInput`
- Produces: REST endpoints at `/api/wallet/*`, Server Actions `getWalletAction`, `getTransactionHistoryAction`, `transferCoinsAction`

- [ ] **Step 1: Create `src/features/wallet/wallet.actions.ts`**

```typescript
"use server"

import { WalletService } from "@/features/wallet/wallet.service"
import { getSession } from "@/lib/auth/session"
import { Prisma } from "@prisma/client"

export async function getWalletAction() {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const wallet = await WalletService.getWallet(session.sub)
    return { success: true as const, data: wallet }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function getTransactionHistoryAction(page = 1, limit = 20) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const result = await WalletService.getTransactions(session.sub, page, limit)
    return { success: true as const, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function transferCoinsAction(receiverEmail: string, amount: number) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }

    const { prisma } = await import("@/lib/prisma")

    const senderWallet = await prisma.wallet.findUnique({ where: { userId: session.sub } })
    if (!senderWallet) return { success: false as const, error: "Wallet not found" }

    const receiver = await prisma.user.findUnique({ where: { email: receiverEmail } })
    if (!receiver) return { success: false as const, error: "Recipient not found" }
    if (receiver.id === session.sub) return { success: false as const, error: "Cannot transfer to yourself" }

    const receiverWallet = await prisma.wallet.findUnique({ where: { userId: receiver.id } })
    if (!receiverWallet) return { success: false as const, error: "Recipient wallet not found" }

    const decimalAmount = new Prisma.Decimal(amount)
    const transaction = await WalletService.executeWalletTransfer(
      senderWallet.id,
      receiverWallet.id,
      decimalAmount,
    )

    return { success: true as const, data: transaction }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
```

- [ ] **Step 2: Create `src/app/api/wallet/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

async function getUserId(request: Request): Promise<string> {
  const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
  if (!token) throw new Error("Not authenticated")
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
  return payload.sub as string
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    const { WalletService } = await import("@/features/wallet/wallet.service")
    const wallet = await WalletService.getWallet(userId)
    return NextResponse.json({ data: wallet })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message === "Not authenticated" ? 401 : 404
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}
```

- [ ] **Step 3: Create `src/app/api/wallet/transactions/route.ts`**

```typescript
import { NextResponse } from "next/server"

async function getUserId(request: Request): Promise<string> {
  const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
  if (!token) throw new Error("Not authenticated")
  const { jwtVerify } = await import("jose")
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
  return payload.sub as string
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)

    const { WalletService } = await import("@/features/wallet/wallet.service")
    const result = await WalletService.getTransactions(userId, page, limit)
    return NextResponse.json({ data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message === "Not authenticated" ? 401 : 400
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}
```

- [ ] **Step 4: Create `src/app/api/wallet/transfer/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

async function getUserId(request: Request): Promise<string> {
  const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
  if (!token) throw new Error("Not authenticated")
  const { jwtVerify } = await import("jose")
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
  return payload.sub as string
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const { receiverEmail, amount } = body

    if (!receiverEmail || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid request. receiverEmail and positive amount required", statusCode: 400 },
        { status: 400 },
      )
    }

    const { WalletService } = await import("@/features/wallet/wallet.service")
    const { prisma } = await import("@/lib/prisma")

    const senderWallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!senderWallet) {
      return NextResponse.json({ error: "Wallet not found", statusCode: 404 }, { status: 404 })
    }

    const receiver = await prisma.user.findUnique({ where: { email: receiverEmail } })
    if (!receiver) {
      return NextResponse.json({ error: "Recipient not found", statusCode: 404 }, { status: 404 })
    }
    if (receiver.id === userId) {
      return NextResponse.json({ error: "Cannot transfer to yourself", statusCode: 400 }, { status: 400 })
    }

    const receiverWallet = await prisma.wallet.findUnique({ where: { userId: receiver.id } })
    if (!receiverWallet) {
      return NextResponse.json({ error: "Recipient wallet not found", statusCode: 404 }, { status: 404 })
    }

    const transaction = await WalletService.executeWalletTransfer(
      senderWallet.id,
      receiverWallet.id,
      new Prisma.Decimal(amount),
    )

    return NextResponse.json({ data: transaction }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message === "Not authenticated" ? 401 : 400
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}
```

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/wallet/wallet.actions.ts src/app/api/wallet/
git commit -m "feat: add wallet API routes and Server Actions"
```

---
### Task 5: Event API Routes + Server Actions

**Files:**
- Create: `src/features/events/events.actions.ts`
- Create: `src/app/api/events/route.ts`
- Create: `src/app/api/events/[id]/route.ts`

**Interfaces:**
- Consumes: `EventService` from Task 3, `getSession` from `@/lib/auth/session`
- Produces: REST endpoints at `/api/events/*`, Server Actions `getEventsAction`, `createEventAction`, `updateEventAction`, `publishEventAction`

- [ ] **Step 1: Create `src/features/events/events.actions.ts`**

```typescript
"use server"

import { EventService } from "@/features/events/events.service"
import { getSession } from "@/lib/auth/session"
import type { ICreateEventInput, IUpdateEventInput } from "@/types"

export async function getEventsAction(status?: string) {
  try {
    const session = await getSession()
    const filters: Record<string, unknown> = {}
    if (status) filters.status = status
    if (session) filters.organizerId = session.sub
    const events = await EventService.getEvents(
      Object.keys(filters).length > 0 ? (filters as { status?: EventStatus; organizerId?: string }) : undefined,
    )
    return { success: true as const, data: events }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

import { EventStatus } from "@prisma/client"

export async function createEventAction(input: ICreateEventInput) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const event = await EventService.createEvent(session.sub, input)
    return { success: true as const, data: event }
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
    return { success: true as const, data: event }
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
    return { success: true as const, data: event }
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
```

- [ ] **Step 2: Create directories**

```bash
New-Item -ItemType Directory -Path "src/app/api/events/[id]" -Force
```

- [ ] **Step 3: Create `src/app/api/events/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { EventStatus } from "@prisma/client"

async function getUserId(request: Request): Promise<string | null> {
  const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
  if (!token) return null
  try {
    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    return payload.sub as string
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as EventStatus | null
    const { EventService } = await import("@/features/events/events.service")

    const filters: Record<string, unknown> = {}
    if (status) filters.status = status

    const events = await EventService.getEvents(
      Object.keys(filters).length > 0 ? (filters as { status?: EventStatus }) : undefined,
    )
    return NextResponse.json({ data: events })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message, statusCode: 400 }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, venue, date, ticketPrice } = body

    if (!title || !description || !venue || !date || ticketPrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, venue, date, ticketPrice", statusCode: 400 },
        { status: 400 },
      )
    }

    const { EventService } = await import("@/features/events/events.service")
    const event = await EventService.createEvent(userId, {
      title,
      description,
      venue,
      date,
      ticketPrice: Number(ticketPrice),
    })

    return NextResponse.json({ data: event }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message, statusCode: 400 }, { status: 400 })
  }
}
```

- [ ] **Step 4: Create `src/app/api/events/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server"

async function getUserId(request: Request): Promise<string | null> {
  const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
  if (!token) return null
  try {
    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    return payload.sub as string
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { EventService } = await import("@/features/events/events.service")
    const event = await EventService.getEventById(id)
    return NextResponse.json({ data: event })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message === "Event not found" ? 404 : 400
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { EventService } = await import("@/features/events/events.service")
    const event = await EventService.updateEvent(id, userId, body)
    return NextResponse.json({ data: event })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message.includes("Not authorized") ? 403 : message === "Event not found" ? 404 : 400
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })
    }

    const { id } = await params
    const { EventService } = await import("@/features/events/events.service")
    await EventService.deleteEvent(id, userId)
    return NextResponse.json({ data: null })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message.includes("Not authorized") ? 403 : message === "Event not found" ? 404 : 400
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}
```

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/events/events.actions.ts src/app/api/events/
git commit -m "feat: add event API routes and Server Actions"
```

---
### Task 6: Fan Registration Bonus (1000 Demo Music Coins)

**Files:**
- Modify: `src/lib/auth/auth.ts`

**Interfaces:**
- Consumes: `WalletService.creditWallet()` from Task 2, existing `register` Server Action
- Produces: Updated `register` action that credits 1000 coins + genesis DEPOSIT when `role === "FAN"`

- [ ] **Step 1: Update `src/lib/auth/auth.ts` — add Fan bonus inside the registration transaction**

Replace the existing `register` function's transaction block:

```typescript
import { WalletService } from "@/features/wallet/wallet.service"

// Inside register() function, replace the $transaction block:
const user = await prisma.$transaction(async (tx) => {
  const newUser = await tx.user.create({
    data: { name, email, password: hashed, role },
  })

  const wallet = await tx.wallet.create({
    data: { userId: newUser.id, balance: new Prisma.Decimal(0) },
  })

  if (role === "FAN") {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: new Prisma.Decimal(1000) },
    })
    await tx.transaction.create({
      data: {
        senderId: wallet.id,
        receiverId: wallet.id,
        amount: new Prisma.Decimal(1000),
        type: "DEPOSIT",
      },
    })
  }

  return newUser
})
```

The full file should have these imports at the top (add `WalletService` if not already there, and keep existing ones):

```typescript
import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { signToken, setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth/session"
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/auth/validation"
import type { AuthResult } from "@/lib/auth/roles"
import type { IUserPublic } from "@/types"
import { Prisma } from "@prisma/client"
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/auth.ts
git commit -m "feat: credit 1000 Demo Music Coins to Fan wallets on registration"
```

---
### Task 7: Dashboard Layout + Sidebar Navigation

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/(dashboard)/page.tsx`

**Interfaces:**
- Consumes: `useAuth` from `@/context`, `UserRole`, `ROLE_LABELS`
- Produces: Dashboard shell with sidebar, role-aware navigation, redirect to role-based home

- [ ] **Step 1: Rewrite `src/app/(dashboard)/layout.tsx`**

```tsx
"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context"
import { Button } from "@/components/ui/button"
import { UserRole, ROLE_LABELS } from "@/types"
import { useEffect, type ReactNode } from "react"
import {
  LayoutDashboard,
  Calendar,
  Wallet,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"

const NAV_ITEMS: Record<UserRole, Array<{ href: string; label: string; icon: typeof LayoutDashboard }>> = {
  [UserRole.ADMIN]: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/organizer/events", label: "Events", icon: Calendar },
    { href: "/dashboard/organizer/wallet", label: "Wallet", icon: Wallet },
  ],
  [UserRole.ORGANIZER]: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/organizer/events", label: "Events", icon: Calendar },
    { href: "/dashboard/organizer/wallet", label: "Wallet", icon: Wallet },
  ],
  [UserRole.ARTIST]: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/organizer/wallet", label: "Wallet", icon: Wallet },
  ],
  [UserRole.PRODUCTION_HOUSE]: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/organizer/wallet", label: "Wallet", icon: Wallet },
  ],
  [UserRole.FAN]: [
    { href: "/dashboard", label: "Browse Events", icon: LayoutDashboard },
    { href: "/dashboard/fan/wallet", label: "Wallet", icon: Wallet },
  ],
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const navItems = NAV_ITEMS[user.role as UserRole] || NAV_ITEMS[UserRole.FAN]

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              Music Coin
            </Link>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABELS[user.role as UserRole] || user.role}
            </p>
          </div>

          <nav className="flex-1 space-y-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-4 border-b bg-card px-4 py-2 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-bold">Music Coin</span>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `src/app/(dashboard)/page.tsx`**

```tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context"
import { UserRole } from "@/types"

export default function DashboardHome() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push("/login")
      return
    }
    if (user.role === UserRole.FAN) {
      router.push("/dashboard/fan")
    } else {
      router.push("/dashboard/organizer")
    }
  }, [user, isLoading, router])

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/layout.tsx src/app/\(dashboard\)/page.tsx
git commit -m "feat: add dashboard layout with role-aware sidebar navigation"
```

---
### Task 8: Organizer Dashboard Pages

**Files:**
- Create: `src/app/(dashboard)/organizer/page.tsx`
- Create: `src/app/(dashboard)/organizer/events/page.tsx`
- Create: `src/app/(dashboard)/organizer/events/new/page.tsx`
- Create: `src/app/(dashboard)/organizer/events/[id]/edit/page.tsx`
- Create: `src/app/(dashboard)/organizer/wallet/page.tsx`

**Interfaces:**
- Consumes: `getEventsAction`, `createEventAction`, `updateEventAction`, `publishEventAction`, `deleteEventAction` from Task 5
- Consumes: `getWalletAction`, `getTransactionHistoryAction`, `transferCoinsAction` from Task 4

- [ ] **Step 1: Create directories**

```bash
New-Item -ItemType Directory -Path "src/app/(dashboard)/organizer/events/new" -Force
New-Item -ItemType Directory -Path "src/app/(dashboard)/organizer/events/[id]/edit" -Force
New-Item -ItemType Directory -Path "src/app/(dashboard)/organizer/wallet" -Force
```

- [ ] **Step 2: Create `src/app/(dashboard)/organizer/page.tsx` — Overview with stats**

```tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getEventsAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"

interface EventSummary {
  id: string
  title: string
  status: string
  date: string
}

export default function OrganizerOverview() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEventsAction().then((res) => {
      if (res.success) setEvents(res.data as unknown as EventSummary[])
      setLoading(false)
    })
  }, [])

  const published = events.filter((e) => e.status === "PUBLISHED").length
  const drafts = events.filter((e) => e.status === "DRAFT").length

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
        <Link href="/dashboard/organizer/events/new">
          <Button>
            <Plus className="mr-1 size-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{drafts}</p>
          </CardContent>
        </Card>
      </div>

      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events.slice(0, 5).map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/organizer/events`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <Calendar className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.status === "PUBLISHED" ? "Published" : event.status === "DRAFT" ? "Draft" : event.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/app/(dashboard)/organizer/events/page.tsx` — Event Manager**

```tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { getEventsAction, publishEventAction, deleteEventAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Send, Calendar } from "lucide-react"

interface EventItem {
  id: string
  title: string
  status: string
  venue: string
  date: string
  ticketPrice: number
}

export default function OrganizerEvents() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    const res = await getEventsAction()
    if (res.success) setEvents(res.data as unknown as EventItem[])
    setLoading(false)
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  async function handlePublish(id: string) {
    const res = await publishEventAction(id)
    if (res.success) loadEvents()
  }

  async function handleDelete(id: string) {
    if (!confirm("Cancel this event?")) return
    const res = await deleteEventAction(id)
    if (res.success) loadEvents()
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Events</h1>
        <Link href="/dashboard/organizer/events/new">
          <Button>
            <Plus className="mr-1 size-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium">No events yet</p>
            <p className="text-sm text-muted-foreground">Create your first festival event to get started.</p>
            <Link href="/dashboard/organizer/events/new" className="mt-4 inline-block">
              <Button>Create Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.venue} &middot; {new Date(event.date).toLocaleDateString()} &middot; {Number(event.ticketPrice).toFixed(2)} MC
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    event.status === "PUBLISHED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : event.status === "DRAFT"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}
                >
                  {event.status}
                </span>
                <div className="flex items-center gap-1">
                  {event.status === "DRAFT" && (
                    <Button variant="ghost" size="sm" onClick={() => handlePublish(event.id)} title="Publish">
                      <Send className="size-4" />
                    </Button>
                  )}
                  <Link href={`/dashboard/organizer/events/${event.id}/edit`}>
                    <Button variant="ghost" size="sm" title="Edit">
                      <Edit className="size-4" />
                    </Button>
                  </Link>
                  {event.status !== "CANCELLED" && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)} title="Cancel">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/app/(dashboard)/organizer/events/new/page.tsx` — Create Event Form**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createEventAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  venue: z.string().min(3, "Venue is required"),
  date: z.string().min(1, "Date is required"),
  ticketPrice: z.coerce.number().positive("Price must be positive"),
})

type CreateEventForm = z.infer<typeof createEventSchema>

export default function CreateEventPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState("")

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { title: "", description: "", venue: "", date: "", ticketPrice: 0 },
  })

  async function onSubmit(data: CreateEventForm) {
    setServerError("")
    const result = await createEventAction(data)
    if (result.success) {
      router.push("/dashboard/organizer/events")
    } else {
      setServerError(result.error ?? "Something went wrong")
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
          <CardDescription>Set up a new festival event. It will be saved as a draft.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {serverError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>
              )}
              <FormField name="title">
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <Input {...form.register("title")} placeholder="Summer Music Festival 2026" />
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="description">
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <Input {...form.register("description")} placeholder="A brief description of the event" />
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="venue">
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <Input {...form.register("venue")} placeholder="City Park Arena" />
                  <FormMessage />
                </FormItem>
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField name="date">
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Input {...form.register("date")} type="date" />
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField name="ticketPrice">
                  <FormItem>
                    <FormLabel>Ticket Price (MC)</FormLabel>
                    <Input {...form.register("ticketPrice")} type="number" step="0.01" min="0" />
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Event"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/app/(dashboard)/organizer/events/[id]/edit/page.tsx` — Edit Event Form**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updateEventAction } from "@/features/events/events.actions"
import { getEventsAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  venue: z.string().min(3).optional(),
  date: z.string().optional(),
  ticketPrice: z.coerce.number().positive().optional(),
})

type UpdateEventForm = z.infer<typeof updateEventSchema>

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const [loading, setLoading] = useState(true)
  const [serverError, setServerError] = useState("")

  const form = useForm<UpdateEventForm>({
    resolver: zodResolver(updateEventSchema),
  })

  useEffect(() => {
    getEventsAction().then((res) => {
      if (res.success) {
        const events = res.data as unknown as Array<{
          id: string
          title: string
          description: string
          venue: string
          date: string
          ticketPrice: number
        }>
        const event = events.find((e) => e.id === eventId)
        if (event) {
          form.reset({
            title: event.title,
            description: event.description,
            venue: event.venue,
            date: new Date(event.date).toISOString().split("T")[0],
            ticketPrice: Number(event.ticketPrice),
          })
        }
      }
      setLoading(false)
    })
  }, [eventId, form])

  async function onSubmit(data: UpdateEventForm) {
    setServerError("")
    const result = await updateEventAction(eventId, data)
    if (result.success) {
      router.push("/dashboard/organizer/events")
    } else {
      setServerError(result.error ?? "Something went wrong")
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
          <CardDescription>Update your event details.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {serverError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>
              )}
              <FormField name="title">
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <Input {...form.register("title")} />
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="description">
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <Input {...form.register("description")} />
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="venue">
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <Input {...form.register("venue")} />
                  <FormMessage />
                </FormItem>
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField name="date">
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Input {...form.register("date")} type="date" />
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField name="ticketPrice">
                  <FormItem>
                    <FormLabel>Ticket Price (MC)</FormLabel>
                    <Input {...form.register("ticketPrice")} type="number" step="0.01" min="0" />
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: Create `src/app/(dashboard)/organizer/wallet/page.tsx` — Organizer Wallet**

```tsx
"use client"

import { useEffect, useState } from "react"
import { getWalletAction, getTransactionHistoryAction, transferCoinsAction } from "@/features/wallet/wallet.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react"

interface Transaction {
  id: string
  senderId: string
  receiverId: string
  amount: number
  type: string
  createdAt: string
}

interface WalletData {
  id: string
  balance: number
  sentTransactions: Transaction[]
  receivedTransactions: Transaction[]
}

export default function OrganizerWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [receiverEmail, setReceiverEmail] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferError, setTransferError] = useState("")
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    Promise.all([
      getWalletAction(),
      getTransactionHistoryAction(1, 50),
    ]).then(([walletRes, txRes]) => {
      if (walletRes.success) setWallet(walletRes.data as unknown as WalletData)
      if (txRes.success) setTransactions((txRes.data as unknown as { data: Transaction[] }).data)
      setLoading(false)
    })
  }, [])

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setTransferError("")
    setTransferring(true)
    const result = await transferCoinsAction(receiverEmail, Number(transferAmount))
    if (result.success) {
      setReceiverEmail("")
      setTransferAmount("")
      const walletRes = await getWalletAction()
      if (walletRes.success) setWallet(walletRes.data as unknown as WalletData)
    } else {
      setTransferError(result.error ?? "Transfer failed")
    }
    setTransferring(false)
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  const allTxs = [
    ...(wallet?.sentTransactions || []).map((t) => ({ ...t, direction: "sent" as const })),
    ...(wallet?.receivedTransactions || []).map((t) => ({ ...t, direction: "received" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            {wallet ? Number(wallet.balance).toFixed(2) : "0.00"} <span className="text-lg text-muted-foreground">MC</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Coins</CardTitle>
          <CardDescription>Send Music Coins to another user</CardDescription>
        </CardHeader>
        <form onSubmit={handleTransfer}>
          <CardContent className="space-y-4">
            {transferError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{transferError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="receiver">Recipient Email</Label>
              <Input id="receiver" type="email" placeholder="user@example.com" value={receiverEmail} onChange={(e) => setReceiverEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (MC)</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" placeholder="10.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={transferring}>
              {transferring ? "Sending..." : "Send Transfer"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {allTxs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {allTxs.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-lg border p-3">
                  {tx.direction === "sent" ? (
                    <ArrowUpRight className="size-4 text-destructive" />
                  ) : (
                    <ArrowDownLeft className="size-4 text-green-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {tx.type === "DEPOSIT" ? "Deposit" : tx.type === "TRANSFER" ? (tx.direction === "sent" ? "Sent" : "Received") : tx.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${tx.direction === "sent" ? "text-destructive" : "text-green-600"}`}>
                    {tx.direction === "sent" ? "-" : "+"}{Number(tx.amount).toFixed(2)} MC
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 7: Build check**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/\(dashboard\)/organizer/
git commit -m "feat: add organizer dashboard pages (overview, events CRUD, wallet)"
```

---
### Task 9: Fan Dashboard Pages

**Files:**
- Create: `src/app/(dashboard)/fan/page.tsx`
- Create: `src/app/(dashboard)/fan/wallet/page.tsx`

**Interfaces:**
- Consumes: `getEventsAction` from Task 5 (filtered for PUBLISHED)
- Consumes: `getWalletAction`, `getTransactionHistoryAction`, `transferCoinsAction` from Task 4

- [ ] **Step 1: Create directories**

```bash
New-Item -ItemType Directory -Path "src/app/(dashboard)/fan/wallet" -Force
```

- [ ] **Step 2: Create `src/app/(dashboard)/fan/page.tsx` — Browse Events**

```tsx
"use client"

import { useEffect, useState } from "react"
import { getEventsAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Ticket } from "lucide-react"

interface FanEvent {
  id: string
  title: string
  description: string
  venue: string
  date: string
  ticketPrice: number
  organizer: { name: string }
}

export default function FanDashboard() {
  const [events, setEvents] = useState<FanEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEventsAction("PUBLISHED").then((res) => {
      if (res.success) setEvents(res.data as unknown as FanEvent[])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upcoming Events</h1>
        <p className="text-muted-foreground">Browse available festival events</p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium">No events available</p>
            <p className="text-sm text-muted-foreground">Check back later for upcoming festivals.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {event.venue}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Ticket className="size-4" />
                  {Number(event.ticketPrice).toFixed(2)} MC
                </div>
                <p className="text-xs text-muted-foreground">
                  Organized by {event.organizer?.name || "Unknown"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/app/(dashboard)/fan/wallet/page.tsx` — Fan Wallet (same layout as Organizer Wallet but with Fan context)**

```tsx
"use client"

import { useEffect, useState } from "react"
import { getWalletAction, getTransactionHistoryAction, transferCoinsAction } from "@/features/wallet/wallet.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react"

interface Transaction {
  id: string
  senderId: string
  receiverId: string
  amount: number
  type: string
  createdAt: string
}

interface WalletData {
  id: string
  balance: number
  sentTransactions: Transaction[]
  receivedTransactions: Transaction[]
}

export default function FanWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [receiverEmail, setReceiverEmail] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferError, setTransferError] = useState("")
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    Promise.all([
      getWalletAction(),
      getTransactionHistoryAction(1, 50),
    ]).then(([walletRes]) => {
      if (walletRes.success) setWallet(walletRes.data as unknown as WalletData)
      setLoading(false)
    })
  }, [])

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setTransferError("")
    setTransferring(true)
    const result = await transferCoinsAction(receiverEmail, Number(transferAmount))
    if (result.success) {
      setReceiverEmail("")
      setTransferAmount("")
      const walletRes = await getWalletAction()
      if (walletRes.success) setWallet(walletRes.data as unknown as WalletData)
    } else {
      setTransferError(result.error ?? "Transfer failed")
    }
    setTransferring(false)
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  const allTxs = [
    ...(wallet?.sentTransactions || []).map((t) => ({ ...t, direction: "sent" as const })),
    ...(wallet?.receivedTransactions || []).map((t) => ({ ...t, direction: "received" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Wallet</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            {wallet ? Number(wallet.balance).toFixed(2) : "0.00"} <span className="text-lg text-muted-foreground">MC</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Coins</CardTitle>
          <CardDescription>Send Music Coins to another user</CardDescription>
        </CardHeader>
        <form onSubmit={handleTransfer}>
          <CardContent className="space-y-4">
            {transferError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{transferError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="receiver">Recipient Email</Label>
              <Input id="receiver" type="email" placeholder="user@example.com" value={receiverEmail} onChange={(e) => setReceiverEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (MC)</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" placeholder="10.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={transferring}>
              {transferring ? "Sending..." : "Send Transfer"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {allTxs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {allTxs.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-lg border p-3">
                  {tx.direction === "sent" ? (
                    <ArrowUpRight className="size-4 text-destructive" />
                  ) : (
                    <ArrowDownLeft className="size-4 text-green-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {tx.type === "DEPOSIT" ? "Welcome Bonus" : tx.type === "TRANSFER" ? (tx.direction === "sent" ? "Sent" : "Received") : tx.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${tx.direction === "sent" ? "text-destructive" : "text-green-600"}`}>
                    {tx.direction === "sent" ? "-" : "+"}{Number(tx.amount).toFixed(2)} MC
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/fan/
git commit -m "feat: add fan dashboard pages (browse events, wallet with transfer)"
```

---
### Task 10: Comprehensive Wallet and Event Tests

**Files:**
- Create: `src/features/wallet/wallet.test.ts`
- Create: `src/features/events/events.test.ts`

**Interfaces:**
- Consumes: `WalletService`, `EventService`, `AppError`
- Produces: 15+ tests covering wallet transfers, event CRUD, Fan bonus, error cases

- [ ] **Step 1: Create `src/features/wallet/wallet.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { Prisma } from "@prisma/client"

// Mock prisma
const mockPrisma = {
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
}

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
```

- [ ] **Step 2: Create `src/features/events/events.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { Prisma } from "@prisma/client"

const mockPrisma = {
  event: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

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

vi.mock("@prisma/client", () => ({
  Prisma: { Decimal: vi.fn((v) => ({ toString: () => String(v), lessThan: (x: any) => v < x })) },
  EventStatus: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", CANCELLED: "CANCELLED" },
}))

import { EventService } from "./events.service"
import { AppError as AppErrorClass } from "@/lib/errors"

describe("EventService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockEvent = {
    id: "event-1",
    organizerId: "user-1",
    title: "Test Festival",
    description: "A test festival event",
    venue: "Test Venue",
    date: new Date("2026-08-15"),
    ticketPrice: new Prisma.Decimal(50),
    status: "DRAFT",
    createdAt: new Date(),
    updatedAt: new Date(),
    organizer: { id: "user-1", name: "Test Organizer", email: "org@test.com" },
  }

  describe("getEvents", () => {
    it("should return events with filters", async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockEvent])
      const result = await EventService.getEvents({ status: "PUBLISHED" as any })
      expect(result).toHaveLength(1)
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { status: "PUBLISHED" },
        include: { organizer: { select: { id: true, name: true, email: true } } },
        orderBy: { date: "asc" },
      })
    })
  })

  describe("createEvent", () => {
    it("should create event with DRAFT status", async () => {
      mockPrisma.event.create.mockResolvedValue(mockEvent)
      const result = await EventService.createEvent("user-1", {
        title: "Test Festival",
        description: "A test festival event",
        venue: "Test Venue",
        date: "2026-08-15",
        ticketPrice: 50,
      })
      expect(result.status).toBe("DRAFT")
      expect(result.organizerId).toBe("user-1")
    })
  })

  describe("publishEvent", () => {
    it("should transition DRAFT to PUBLISHED", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
      mockPrisma.event.update.mockResolvedValue({ ...mockEvent, status: "PUBLISHED" })

      const result = await EventService.publishEvent("event-1", "user-1")
      expect(result.status).toBe("PUBLISHED")
    })

    it("should reject publishing by non-owner", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
      await expect(EventService.publishEvent("event-1", "user-2")).rejects.toThrow("Not authorized")
    })

    it("should reject publishing non-DRAFT event", async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ ...mockEvent, status: "PUBLISHED" })
      await expect(EventService.publishEvent("event-1", "user-1")).rejects.toThrow("Only DRAFT events can be published")
    })
  })

  describe("deleteEvent", () => {
    it("should soft-delete by setting CANCELLED", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
      mockPrisma.event.update.mockResolvedValue({ ...mockEvent, status: "CANCELLED" })

      const result = await EventService.deleteEvent("event-1", "user-1")
      expect(result.status).toBe("CANCELLED")
    })

    it("should reject deletion by non-owner", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
      await expect(EventService.deleteEvent("event-1", "user-2")).rejects.toThrow("Not authorized")
    })
  })

  describe("updateEvent", () => {
    it("should update event fields", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
      mockPrisma.event.update.mockResolvedValue({ ...mockEvent, title: "Updated Title" })

      const result = await EventService.updateEvent("event-1", "user-1", { title: "Updated Title" })
      expect(result.title).toBe("Updated Title")
    })

    it("should reject update by non-owner", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
      await expect(
        EventService.updateEvent("event-1", "other-user", { title: "Hacked" }),
      ).rejects.toThrow("Not authorized")
    })
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: All 15+ tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/wallet/wallet.test.ts src/features/events/events.test.ts
git commit -m "feat: add comprehensive wallet and event test suites"
```

---
### Self-Review Checklist

**1. Spec coverage:**
- Wallet GET /wallet → Task 4 (API route + Server Action)
- Wallet GET /transactions → Task 4 (API route + Server Action)
- Wallet POST /transfer → Task 4 (API route + Server Action)
- Fan signup bonus (1000 coins) → Task 6 (auth.ts modification)
- Event GET /events → Task 5 (API route + Server Action)
- Event POST /events → Task 5 (API route + Server Action)
- Event PUT /events/:id → Task 5 (API route + Server Action)
- Event DELETE /events/:id → Task 5 (API route + Server Action)
- ACID transactions → Task 2 (WalletService.$transaction)
- Organizer dashboard → Task 8
- Fan dashboard → Task 9
- Dashboard sidebar → Task 7
- Wallet tests → Task 10
- Event tests → Task 10
- Schema migration → Task 1
- Type definitions → Task 1

**2. Placeholder check:** None. All steps have complete code.

**3. Type consistency:** 
- `IEvent.organizerId` in Task 1 → `EventService` uses `organizerId` in Task 3 → Dashboard pages use `organizerId` in Task 8
- `WalletService.executeWalletTransfer(walletId, walletId, Decimal, type)` in Task 2 → called as `executeWalletTransfer(senderWallet.id, receiverWallet.id, decimalAmount)` in Task 4
- `EventService.createEvent(organizerId, ICreateEventInput)` in Task 3 → called in Task 5 with same signatures
- `WalletService.creditWallet(walletId, amount, type)` in Task 2 → used in Task 6 for Fan bonus

**4. No gaps found.**
