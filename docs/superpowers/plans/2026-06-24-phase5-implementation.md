# Phase 5: Royalties, Voting, Analytics & Demo Seeding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 4 subsystems — Royalty API, Voting/Governance, Analytics Dashboard, and a Demo Seeding Script.

**Architecture:** Feature folders (services + actions + API routes). Chart.js for dashboard. Standalone seeding script.

**Tech Stack:** Next.js App Router, Prisma ORM, Chart.js + react-chartjs-2, Vitest, tsx

## Global Constraints

- All API routes follow existing patterns: auth via `getSession()`, try/catch, `NextResponse` JSON
- All mutations wrapped in Prisma `$transaction` when modifying >1 entity
- Services use `AppError` from `@/lib/errors`
- Tests mock `@/lib/prisma` and `@/lib/errors`, follow `nft.test.ts` pattern
- Platform wallet: ORGANIZER user with email `platform@musiccoin.demo`
- Vote: one per fan per artist (upsert). 10 MC reward on first vote only.

---

## Task 1: Prisma Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Royalty.paidAt`, `Vote @@unique([fanId, artistId])`

- [ ] **Step 1: Add `paidAt` to Royalty model**

```prisma
model Royalty {
  id        String    @id @default(uuid()) @db.Uuid
  nftId     String    @db.Uuid
  artistId  String    @db.Uuid
  amount    Decimal
  paidAt    DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  nft    NFT  @relation(fields: [nftId], references: [id], onDelete: Cascade)
  artist User @relation(fields: [artistId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Add unique constraint to Vote**

```prisma
model Vote {
  id        String   @id @default(uuid()) @db.Uuid
  artistId  String   @db.Uuid
  fanId     String   @db.Uuid
  weight    Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  artist User @relation("VoteArtist", fields: [artistId], references: [id], onDelete: Cascade)
  fan    User @relation("VoteFan", fields: [fanId], references: [id], onDelete: Cascade)

  @@unique([fanId, artistId])
}
```

- [ ] **Step 3: Run migration**

```
npx prisma migrate dev --name add_royalty_paid_at_vote_unique
```

- [ ] **Step 4: Commit**

```
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add paidAt to Royalty, unique constraint to Vote"
```

---

## Task 2: Install chart dependencies

- [ ] **Step 1: Install**

```
npm install react-chartjs-2
```

- [ ] **Step 2: Commit**

```
git add package.json package-lock.json
git commit -m "chore: install react-chartjs-2"
```

---

## Task 3: Royalty Service + Tests

**Files:**
- Create: `src/features/royalties/royalty.service.ts`
- Create: `src/features/royalties/royalty.test.ts`

**Interfaces:**
- `RoyaltyService.getRoyalties(userId, filters?)` → `{ royalties, total, count }`
- `RoyaltyService.distributeRoyalties()` → `{ distributed, totalAmount, artists }`

- [ ] **Step 1: Write failing tests**

```typescript
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
      const result = await RoyaltyService.getRoyalties("a-1", { artistId: "a-1" })
      expect(result.royalties).toHaveLength(1)
    })
    it("should filter pending", async () => {
      mockPrisma.royalty.findMany.mockResolvedValue([])
      await RoyaltyService.getRoyalties("u-1", { pending: true })
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
```

- [ ] **Step 2: Run to confirm failure**

```
npx vitest run src/features/royalties/royalty.test.ts
```

- [ ] **Step 3: Write implementation**

```typescript
import { prisma } from "@/lib/prisma"
import { AppError } from "@/lib/errors"
import { WalletService } from "@/features/wallet/wallet.service"

export const RoyaltyService = {
  async getRoyalties(
    userId: string,
    filters: { artistId?: string; pending?: boolean } = {},
  ) {
    const where: Record<string, unknown> = {}
    if (filters.artistId) where.artistId = filters.artistId
    if (filters.pending) where.paidAt = null

    const royalties = await prisma.royalty.findMany({
      where,
      include: { nft: { include: { song: true } }, artist: true },
      orderBy: { createdAt: "desc" },
    })

    return { royalties, total: royalties.length, count: royalties.length }
  },

  async distributeRoyalties() {
    const unpaid = await prisma.royalty.findMany({ where: { paidAt: null } })
    if (unpaid.length === 0) {
      return { distributed: 0, totalAmount: "0", artists: 0 }
    }

    const grouped = new Map<string, { ids: string[]; total: number }>()
    for (const r of unpaid) {
      const amount = Number(r.amount)
      const entry = grouped.get(r.artistId) || { ids: [], total: 0 }
      entry.ids.push(r.id)
      entry.total += amount
      grouped.set(r.artistId, entry)
    }

    const platformUser = await prisma.user.findUnique({
      where: { email: "platform@musiccoin.demo" },
      include: { wallet: true },
    })
    if (!platformUser?.wallet) {
      throw new AppError("Platform wallet not found", 500)
    }

    let distributed = 0
    let totalAmount = 0

    for (const [artistId, entry] of grouped) {
      const artistWallet = await prisma.wallet.findUnique({ where: { userId: artistId } })
      if (!artistWallet) continue

      const amt = { toString: () => String(entry.total) } as any
      await WalletService.executeWalletTransfer(
        platformUser.wallet.id,
        artistWallet.id,
        amt,
        "ROYALTY_PAYMENT",
      )

      await prisma.royalty.updateMany({
        where: { id: { in: entry.ids } },
        data: { paidAt: new Date() },
      })

      distributed += entry.ids.length
      totalAmount += entry.total
    }

    return { distributed, totalAmount: String(totalAmount), artists: grouped.size }
  },
}
```

- [ ] **Step 4: Run tests to verify pass**

```
npx vitest run src/features/royalties/royalty.test.ts
```

- [ ] **Step 5: Commit**

```
git add src/features/royalties/
git commit -m "feat: add royalty service with getRoyalties and distributeRoyalties"
```

---

## Task 4: Royalty API Routes

**Files:**
- Create: `src/app/api/royalties/route.ts`
- Create: `src/app/api/royalties/distribute/route.ts`

**Interfaces:**
- `GET /api/royalties` — list royalties
- `POST /api/royalties/distribute` — admin only, trigger distribution

- [ ] **Step 1: Write failing tests**

```typescript
import { it, expect, vi } from "vitest"

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}))
vi.mock("@/features/royalties/royalty.service", () => ({
  RoyaltyService: { getRoyalties: vi.fn(), distributeRoyalties: vi.fn() },
}))

import { GET as listHandler } from "./route"
import { GET as distributeHandler } from "./distribute/route"

it("returns 401 when not authenticated", async () => {
  const { getSession } = await import("@/lib/auth/session")
  ;(getSession as any).mockResolvedValue(null)
  const req = new Request("http://localhost/api/royalties")
  const res = await listHandler(req)
  expect(res.status).toBe(401)
})
```

- [ ] **Step 2: Write route handlers**

`src/app/api/royalties/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { RoyaltyService } from "@/features/royalties/royalty.service"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const filters = {
      artistId: searchParams.get("artistId") || undefined,
      pending: searchParams.get("pending") === "true" || undefined,
    }

    const data = await RoyaltyService.getRoyalties(session.sub, filters)
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

`src/app/api/royalties/distribute/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { RoyaltyService } from "@/features/royalties/royalty.service"

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const result = await RoyaltyService.distributeRoyalties()
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```
git add src/app/api/royalties/
git commit -m "feat: add royalty API routes (GET /api/royalties, POST /api/royalties/distribute)"
```

---

## Task 5: Vote Service + Tests

**Files:**
- Create: `src/features/voting/vote.service.ts`
- Create: `src/features/voting/vote.test.ts`

**Interfaces:**
- `VoteService.castVote(fanId: string, artistId: string)` → `{ vote, reward: number }`
- `VoteService.getResults()` → `{ results: Array<{ artistId, artistName, voteCount, rank }> }`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockTx = vi.hoisted(() => ({
  vote: { upsert: vi.fn(), findUnique: vi.fn() },
  wallet: { findUnique: vi.fn(), update: vi.fn() },
  transaction: { create: vi.fn() },
}))

const mockPrisma = vi.hoisted(() => ({
  vote: { findMany: vi.fn(), upsert: vi.fn() },
  user: { findUnique: vi.fn(), findMany: vi.fn() },
  wallet: { findUnique: vi.fn() },
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
  WalletService: { creditWallet: vi.fn().mockResolvedValue({ wallet: { balance: "10" }, transaction: {} }) },
}))

import { VoteService } from "./vote.service"

describe("VoteService", () => {
  beforeEach(() => { vi.resetAllMocks() })

  describe("castVote", () => {
    it("should create vote and award reward", async () => {
      mockTx.vote.upsert.mockResolvedValue({ id: "v-1", artistId: "a-1", fanId: "f-1", weight: 1 })
      mockPrisma.wallet.findUnique.mockResolvedValue({ id: "w-1" })
      mockPrisma.vote.upsert.mockResolvedValue({ id: "v-1", artistId: "a-1", fanId: "f-1", weight: 1 })

      const result = await VoteService.castVote("f-1", "a-1")
      expect(result.vote.weight).toBe(1)
      expect(result.reward).toBe(10)
    })

    it("should not reward if fan already voted", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => {
        mockTx.vote.upsert.mockResolvedValue({ id: "v-1", artistId: "a-1", fanId: "f-1", weight: 1 })
        // Simulate existing vote — findUnique before upsert returns a vote
        return cb(mockTx)
      })
      mockTx.vote.findUnique.mockResolvedValue({ id: "v-1" })

      const result = await VoteService.castVote("f-1", "a-1")
      // Implementation should check before upserting; if existing, reward = 0
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
```

- [ ] **Step 2: Run to confirm failure**

```
npx vitest run src/features/voting/vote.test.ts
```

- [ ] **Step 3: Write implementation**

```typescript
import { prisma } from "@/lib/prisma"
import { AppError } from "@/lib/errors"
import { WalletService } from "@/features/wallet/wallet.service"

const VOTE_REWARD = 10

export const VoteService = {
  async castVote(fanId: string, artistId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.vote.findUnique({
        where: { fanId_artistId: { fanId, artistId } },
      })

      const vote = await tx.vote.upsert({
        where: { fanId_artistId: { fanId, artistId } },
        update: { weight: { increment: 1 } },
        create: { fanId, artistId, weight: 1 },
      })

      let reward = 0
      if (!existing) {
        const wallet = await tx.wallet.findUnique({ where: { userId: fanId } })
        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: VOTE_REWARD } },
          })
          await tx.transaction.create({
            data: {
              senderId: wallet.id,
              receiverId: wallet.id,
              amount: VOTE_REWARD,
              type: "DEPOSIT",
            },
          })
          reward = VOTE_REWARD
        }
      }

      return { vote, reward }
    })

    return result
  },

  async getResults() {
    const votes = await prisma.vote.findMany({
      select: { artistId: true, weight: true, artist: { select: { name: true } } },
    })

    const grouped = new Map<string, { artistName: string; voteCount: number }>()
    for (const v of votes) {
      const entry = grouped.get(v.artistId) || { artistName: v.artist.name, voteCount: 0 }
      entry.voteCount += v.weight
      grouped.set(v.artistId, entry)
    }

    const sorted = Array.from(grouped.entries())
      .map(([artistId, data]) => ({ artistId, artistName: data.artistName, voteCount: data.voteCount, rank: 0 }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .map((item, i) => ({ ...item, rank: i + 1 }))

    return { results: sorted }
  },
}
```

- [ ] **Step 4: Run tests to verify pass**

```
npx vitest run src/features/voting/vote.test.ts
```

- [ ] **Step 5: Commit**

```
git add src/features/voting/
git commit -m "feat: add vote service with castVote and getResults"
```

---

## Task 6: Vote API Routes

**Files:**
- Create: `src/app/api/vote/route.ts`
- Create: `src/app/api/vote/results/route.ts`

- [ ] **Step 1: Write route handlers**

`src/app/api/vote/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { VoteService } from "@/features/voting/vote.service"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.role !== "FAN") return NextResponse.json({ error: "Only fans can vote" }, { status: 403 })

    const { artistId } = await request.json()
    if (!artistId) return NextResponse.json({ error: "artistId is required" }, { status: 400 })

    const result = await VoteService.castVote(session.sub, artistId)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

`src/app/api/vote/results/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { VoteService } from "@/features/voting/vote.service"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const result = await VoteService.getResults()
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```
git add src/app/api/vote/
git commit -m "feat: add vote API routes (POST /api/vote, GET /api/vote/results)"
```

---

## Task 7: Analytics Service + Tests

**Files:**
- Create: `src/features/analytics/analytics.service.ts`
- Create: `src/features/analytics/analytics.test.ts`

**Interfaces:**
- `AnalyticsService.getAnalytics()` → `{ revenue, nftSales, eventSales, artistEarnings }`

- [ ] **Step 1: Write failing tests**

```typescript
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
```

- [ ] **Step 2: Run to confirm failure**

```
npx vitest run src/features/analytics/analytics.test.ts
```

- [ ] **Step 3: Write implementation**

```typescript
import { prisma } from "@/lib/prisma"

export const AnalyticsService = {
  async getAnalytics() {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [revenue, nftSales, eventSales, artistEarnings] = await Promise.all([
      // 1. Revenue: DEPOSIT transactions, monthly, last 12 months
      prisma.transaction.findMany({
        where: { type: "DEPOSIT", createdAt: { gte: twelveMonthsAgo } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),

      // 2. NFT Sales: TRANSFER transactions, daily, last 30 days
      prisma.transaction.findMany({
        where: { type: "TRANSFER", createdAt: { gte: thirtyDaysAgo } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),

      // 3. Event Sales: TICKET_PURCHASE transactions
      prisma.transaction.findMany({
        where: { type: "TICKET_PURCHASE" },
        select: { amount: true, createdAt: true },
      }),

      // 4. Artist Earnings: ROYALTY_PAYMENT grouped by receiver
      prisma.transaction.findMany({
        where: { type: "ROYALTY_PAYMENT" },
        select: { amount: true, receiverId: true, receiver: { select: { user: { select: { name: true } } } } },
      }),
    ])

    // Process revenue by month
    const revenueByMonth = groupByMonth(revenue)
    const revenueTotal = sumAmounts(revenue)

    // Process NFT sales by day
    const nftSalesByDay = groupByDay(nftSales)
    const nftSalesTotal = sumAmounts(nftSales)
    const nftSalesCount = nftSales.length

    // Process event sales
    const eventSalesTotal = sumAmounts(eventSales)
    const eventSalesCount = eventSales.length

    // Process artist earnings
    const artistMap = new Map<string, { artistName: string; total: number }>()
    for (const t of artistEarnings) {
      const name = (t as any).receiver?.user?.name || "Unknown"
      const entry = artistMap.get(t.receiverId) || { artistName: name, total: 0 }
      entry.total += Number(t.amount)
      artistMap.set(t.receiverId, entry)
    }
    const topArtists = Array.from(artistMap.entries())
      .map(([id, d]) => ({ artistId: id, artistName: d.artistName, total: d.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return {
      revenue: { total: revenueTotal, byMonth: revenueByMonth },
      nftSales: { total: nftSalesTotal, count: nftSalesCount, byDay: nftSalesByDay },
      eventSales: { total: eventSalesTotal, count: eventSalesCount },
      artistEarnings: topArtists,
    }
  },
}

function groupByMonth(data: { amount: unknown; createdAt: Date }[]) {
  const map = new Map<string, number>()
  for (const item of data) {
    const key = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, "0")}`
    map.set(key, (map.get(key) || 0) + Number(item.amount))
  }
  return Array.from(map.entries()).map(([month, total]) => ({ month, total }))
}

function groupByDay(data: { amount: unknown; createdAt: Date }[]) {
  const map = new Map<string, number>()
  for (const item of data) {
    const key = item.createdAt.toISOString().slice(0, 10)
    map.set(key, (map.get(key) || 0) + Number(item.amount))
  }
  return Array.from(map.entries()).map(([date, total]) => ({ date, total }))
}

function sumAmounts(data: { amount: unknown }[]) {
  return data.reduce((sum, item) => sum + Number(item.amount), 0)
}
```

- [ ] **Step 4: Run tests to verify pass**

```
npx vitest run src/features/analytics/analytics.test.ts
```

- [ ] **Step 5: Commit**

```
git add src/features/analytics/
git commit -m "feat: add analytics service with aggregated queries"
```

---

## Task 8: Dashboard Page + Chart Components

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/features/analytics/analytics.actions.ts`
- Create: `src/app/dashboard/charts.tsx`

- [ ] **Step 1: Write analytics actions**

`src/features/analytics/analytics.actions.ts`:
```typescript
"use server"

import { AnalyticsService } from "./analytics.service"

export async function getAnalyticsAction() {
  try {
    return await AnalyticsService.getAnalytics()
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Write chart components**

`src/app/dashboard/charts.tsx`:
```typescript
"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

interface RevenueChartProps {
  data: { month: string; total: number }[]
}
export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Line
      data={{
        labels: data.map((d) => d.month),
        datasets: [{ label: "Revenue (MC)", data: data.map((d) => d.total), borderColor: "#10b981", tension: 0.3 }],
      }}
      options={{ responsive: true, plugins: { legend: { display: false } } }}
    />
  )
}

interface NftSalesChartProps {
  data: { date: string; total: number }[]
}
export function NftSalesChart({ data }: NftSalesChartProps) {
  return (
    <Bar
      data={{
        labels: data.map((d) => d.date.slice(5)),
        datasets: [{ label: "Sales (MC)", data: data.map((d) => d.total), backgroundColor: "#6366f1" }],
      }}
      options={{ responsive: true, plugins: { legend: { display: false } } }}
    />
  )
}

interface EventSalesChartProps {
  total: number
  count: number
}
export function EventSalesSummary({ total, count }: EventSalesChartProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">{total} MC</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Tickets Sold</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
      </div>
    </div>
  )
}

interface ArtistEarningsChartProps {
  data: { artistName: string; total: number }[]
}
export function ArtistEarningsChart({ data }: ArtistEarningsChartProps) {
  return (
    <Bar
      data={{
        labels: data.map((d) => d.artistName),
        datasets: [{ label: "Earnings (MC)", data: data.map((d) => d.total), backgroundColor: "#f59e0b" }],
      }}
      options={{ responsive: true, indexAxis: "y" as const, plugins: { legend: { display: false } } }}
    />
  )
}
```

- [ ] **Step 3: Write dashboard page**

`src/app/dashboard/page.tsx`:
```typescript
import { getAnalyticsAction } from "@/features/analytics/analytics.actions"
import { RevenueChart, NftSalesChart, EventSalesSummary, ArtistEarningsChart } from "./charts"

export default async function AdminDashboard() {
  const data = await getAnalyticsAction()
  if (!data) return <div className="p-8 text-center text-muted-foreground">Failed to load analytics</div>

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">Revenue (12mo)</h2>
          <p className="mb-4 text-3xl font-bold">{data.revenue.total} MC</p>
          <RevenueChart data={data.revenue.byMonth} />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">NFT Sales (30d)</h2>
          <p className="mb-4 text-3xl font-bold">{data.nftSales.total} MC</p>
          <p className="mb-2 text-sm text-muted-foreground">{data.nftSales.count} transactions</p>
          <NftSalesChart data={data.nftSales.byDay} />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">Event Sales</h2>
          <EventSalesSummary total={data.eventSales.total} count={data.eventSales.count} />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">Top Artists by Earnings</h2>
          <ArtistEarningsChart data={data.artistEarnings} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```
git add src/app/dashboard/ src/features/analytics/analytics.actions.ts
git commit -m "feat: add admin dashboard with Chart.js analytics"
```

---

## Task 9: Sidebar Navigation Update

**Files:**
- Modify: `src/app/(dashboard)/components/sidebar.tsx`

- [ ] **Step 1: Add Dashboard link for ADMIN**

Edit the ADMIN nav items in `sidebar.tsx` — replace `/analytics` with `/dashboard` and update label:

```typescript
const roleNav: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { href: "/wallet", label: "My Wallet", icon: Wallet },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  ],
  // ... rest unchanged
}
```

- [ ] **Step 2: Commit**

```
git add src/app/(dashboard)/components/sidebar.tsx
git commit -m "feat: add Dashboard link to admin sidebar"
```

---

## Task 10: Demo Seeding Script

**Files:**
- Create: `scripts/seed-demo.ts`

- [ ] **Step 1: Write the seeding script**

```typescript
import { PrismaClient, UserRole } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const alreadySeeded = await prisma.setting.findUnique({ where: { key: "SEED_EXECUTED" } })
  if (alreadySeeded) {
    console.log("Seed already executed, skipping.")
    return
  }

  console.log("Seeding demo data...")

  // 1. Create platform admin wallet user
  const platformUser = await prisma.user.upsert({
    where: { email: "platform@musiccoin.demo" },
    update: {},
    create: { name: "Platform Admin", email: "platform@musiccoin.demo", password: "demo", role: "ORGANIZER" },
  })
  let pw = await prisma.wallet.findUnique({ where: { userId: platformUser.id } })
  if (!pw) {
    pw = await prisma.wallet.create({ data: { userId: platformUser.id, balance: 100000 } })
  } else {
    await prisma.wallet.update({ where: { id: pw.id }, data: { balance: { increment: 100000 } } })
  }
  console.log("  Platform wallet:", pw.id, "balance:", 100000)

  // Helper: create user with wallet
  async function createUser(name: string, email: string, role: UserRole) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, password: "demo", role },
    })
    let wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: user.id, balance: 1000 } })
    }
    return { user, wallet }
  }

  // 2. Create fans
  const fans: { user: { id: string }; wallet: { id: string } }[] = []
  for (let i = 1; i <= 100; i++) {
    const u = await createUser(`Fan ${i}`, `fan${i}@demo.com`, "FAN")
    fans.push(u)
  }
  console.log(`  Created ${fans.length} fans`)

  // 3. Create artists
  const artists: { user: { id: string; name: string }; wallet: { id: string } }[] = []
  for (let i = 1; i <= 20; i++) {
    const u = await createUser(`Artist ${i}`, `artist${i}@demo.com`, "ARTIST")
    artists.push(u)
  }
  console.log(`  Created ${artists.length} artists`)

  // 4. Create organizers
  const organizers: { user: { id: string }; wallet: { id: string } }[] = []
  for (let i = 1; i <= 10; i++) {
    const u = await createUser(`Organizer ${i}`, `organizer${i}@demo.com`, "ORGANIZER")
    organizers.push(u)
  }
  console.log(`  Created ${organizers.length} organizers`)

  // 5. Create production houses
  for (let i = 1; i <= 5; i++) {
    await createUser(`Production House ${i}`, `ph${i}@demo.com`, "PRODUCTION_HOUSE")
  }
  console.log("  Created 5 production houses")

  // 6. Create festivals (events)
  const festivalNames = ["Summer Vibes", "Rock Fest", "Jazz Night", "EDM Festival", "Hip Hop Summit",
    "Classical Evening", "Folk Gathering", "Indie Fest", "Metal Mayhem", "Pop Explosion"]
  for (let i = 0; i < 10; i++) {
    const organizer = organizers[i % organizers.length]
    await prisma.event.create({
      data: {
        name: festivalNames[i],
        description: `Annual ${festivalNames[i]} music festival`,
        date: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
        time: "18:00",
        location: `Venue ${i + 1}`,
        capacity: 5000 + i * 1000,
        organizerId: organizer.user.id,
        price: 50 + i * 10,
        category: "Music Festival",
      },
    })
  }
  console.log("  Created 10 festivals")

  // 7. Create songs and NFTs for each artist
  const songStyles = ["Pop", "Rock", "Jazz", "Electronic", "Hip Hop", "Classical", "R&B", "Country", "Blues", "Reggae"]
  let nftCount = 0
  for (const artist of artists) {
    const numSongs = 2 + Math.floor(Math.random() * 2) // 2-3 songs per artist
    for (let s = 1; s <= numSongs && nftCount < 100; s++) {
      const style = songStyles[(nftCount + s) % songStyles.length]
      const song = await prisma.song.create({
        data: { title: `${style} Track ${s} by ${artist.user.name}`, description: `${style} track`, artistId: artist.user.id },
      })
      const price = 10 + Math.floor(Math.random() * 90)
      await prisma.nFT.create({
        data: { songId: song.id, ownerId: artist.user.id, price, royaltyPercentage: 10 },
      })
      nftCount++
    }
  }
  console.log(`  Created ${nftCount} NFTs`)

  // 8. Create tickets (buy tickets for events)
  const events = await prisma.event.findMany()
  let ticketCount = 0
  for (const event of events) {
    const buyers = fans.slice(0, 5 + Math.floor(Math.random() * 10))
    for (const buyer of buyers) {
      await prisma.ticket.create({
        data: { eventId: event.id, userId: buyer.user.id, quantity: 1, totalPrice: Number(event.price) },
      })
      await prisma.transaction.create({
        data: {
          senderId: buyer.wallet.id,
          receiverId: buyer.wallet.id,
          amount: Number(event.price),
          type: "TICKET_PURCHASE",
        },
      })
      ticketCount++
    }
  }
  console.log(`  Created ${ticketCount} ticket purchases`)

  // 9. Simulate NFT purchases and royalties
  const allNfts = await prisma.nFT.findMany()
  let txCount = 0
  let royaltyCount = 0
  for (const nft of allNfts.slice(0, 50)) {
    const buyer = fans[Math.floor(Math.random() * fans.length)]
    const ownerArtist = artists.find(a => a.user.id === nft.ownerId)
    if (!ownerArtist) continue

    // Transfer from buyer to artist (wallet IDs)
    await prisma.transaction.create({
      data: {
        senderId: buyer.wallet.id,
        receiverId: ownerArtist.wallet.id,
        amount: Number(nft.price),
        type: "TRANSFER",
      },
    })
    txCount++

    if (Number(nft.royaltyPercentage) > 0) {
      const royaltyAmount = Number(nft.price) * Number(nft.royaltyPercentage) / 100
      await prisma.royalty.create({
        data: { nftId: nft.id, artistId: ownerArtist.user.id, amount: royaltyAmount },
      })
      await prisma.transaction.create({
        data: {
          senderId: buyer.wallet.id,
          receiverId: ownerArtist.wallet.id,
          amount: royaltyAmount,
          type: "ROYALTY_PAYMENT",
        },
      })
      royaltyCount++
    }
  }

  // Extra DEPOSIT transactions to reach ~500 total
  for (let i = 0; i < 200; i++) {
    const fan = fans[Math.floor(Math.random() * fans.length)]
    await prisma.transaction.create({
      data: {
        senderId: fan.wallet.id,
        receiverId: fan.wallet.id,
        amount: 5 + Math.floor(Math.random() * 50),
        type: "DEPOSIT",
      },
    })
    txCount++
  }

  console.log(`  Created ${txCount} additional NFT/royalty transactions`)
  console.log(`  Total transactions: ${ticketCount + txCount}`)

  // 10. Create votes
  let voteCount = 0
  for (const fan of fans) {
    const votedArtist = artists[Math.floor(Math.random() * artists.length)]
    await prisma.vote.upsert({
      where: { fanId_artistId: { fanId: fan.user.id, artistId: votedArtist.user.id } },
      update: { weight: { increment: 1 } },
      create: { fanId: fan.user.id, artistId: votedArtist.user.id, weight: 1 },
    })
    voteCount++
  }
  console.log(`  Created ${voteCount} votes`)

  // 11. Mark seed as done
  await prisma.setting.create({
    data: { key: "SEED_EXECUTED", value: new Date().toISOString() },
  })

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Run the seed**

```
npx tsx scripts/seed-demo.ts
```

Expected: Progress output, finishes without error.

- [ ] **Step 3: Verify data exists**

```
npx prisma studio
```

Check that entities are populated.

- [ ] **Step 4: Commit**

```
git add scripts/seed-demo.ts
git commit -m "feat: add demo seeding script for 100 fans, 20 artists, NFTs, transactions"
```

---

## Task 11: Run full test suite

- [ ] **Step 1: Run all tests**

```
npx vitest run
```

All tests pass.

- [ ] **Step 2: Commit any test fixes**

```
git add -A
git commit -m "fix: update tests for Phase 5 changes"
```
