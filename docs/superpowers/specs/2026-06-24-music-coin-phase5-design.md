# Phase 5: Royalties, Voting, Analytics & Demo Seeding

**Date:** 2026-06-24
**Project:** Music_coin_demo
**Status:** Draft

---

## 1. Royalty API

### Data Model Change
Add `paidAt` nullable timestamp to the `Royalty` model:

```prisma
model Royalty {
  id        String    @id @default(uuid()) @db.Uuid
  nftId     String    @db.Uuid
  artistId  String    @db.Uuid
  amount    Decimal
  paidAt    DateTime? // null = unpaid
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### Endpoints

**GET /api/royalties**
- Auth: any authenticated user
- Behavior:
  - ARTIST role: return royalties where `artistId = currentUser.id`
  - FAN role: return royalties where the NFT was purchased by current user
  - ORGANIZER/ADMIN: return all royalties
- Query params: `?artistId=xxx&pending=true` (pending filters to `paidAt IS NULL`)
- Returns: `{ royalties: Royalty[], total: Decimal, count: number }`

**POST /api/royalties/distribute**
- Auth: ADMIN only
- Behavior:
  1. Find all royalties where `paidAt IS NULL`
  2. Group by `artistId`, sum amounts
  3. Find the platform wallet by looking up a designated ORGANIZER user with email `platform@musiccoin.demo`
  4. For each artist: deduct `sum(amount)` from platform wallet, credit artist wallet
  5. Create DEPOSIT transaction for artist, WITHDRAWAL transaction for platform
  6. Set `paidAt = now()` on all processed royalties
- Returns: `{ distributed: number, totalAmount: Decimal, artists: number }`

### Service Layer
- `features/royalties/royalty.service.ts` — `getRoyalties()`, `distributeRoyalties()`
- `features/royalties/royalty.actions.ts` — Server Actions
- `app/api/royalties/` — API routes delegating to actions

---

## 2. Voting / Governance

### Data Model (existing)
```prisma
model Vote {
  id        String   @id @default(uuid()) @db.Uuid
  artistId  String   @db.Uuid
  fanId     String   @db.Uuid
  weight    Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Endpoints

**POST /api/vote**
- Auth: FAN only
- Body: `{ artistId: string }`
- Behavior:
  1. Upsert Vote (one vote per fan per artist — use `fanId + artistId` unique constraint)
  2. Award 10 MC: create DEPOSIT transaction, credit fan wallet
- Returns: `{ vote: Vote, reward: number }`

**GET /api/vote/results**
- Auth: any authenticated user
- Returns: `{ results: Array<{ artistId, artistName, voteCount, rank }> }`
- Sorted by `voteCount` descending, ranked by position

### Vote Rules
- Each fan votes once per artist (upsert — subsequent votes update weight/time)
- Reward is awarded on first vote only (check if existing vote exists before rewarding)
- Reward coins come from a seeded platform/organizer wallet

### Service Layer
- `features/voting/vote.service.ts` — `castVote()`, `getResults()`
- `features/voting/vote.actions.ts` — Server Actions
- `app/api/vote/` — API routes

---

## 3. Analytics Dashboard

### Route
- `app/dashboard/` — new admin dashboard page, guarded by ADMIN role

### Data Queries (Server Action — `features/analytics/analytics.service.ts`)

1. **Revenue:** Sum of all DEPOSIT transactions, grouped by month (last 12 months)
2. **NFT Sales:** Count and total volume of TRANSFER transactions, grouped by day (last 30 days)
3. **Event Sales:** Count and revenue sum of TICKET_PURCHASE transactions, grouped by event
4. **Artist Earnings:** Sum of ROYALTY_PAYMENT amounts per receiver, top 10

### Visualization
- Use `react-chartjs-2` with Chart.js
- 4 card panels: summary stat + chart (Line, Bar, Bar, Horizontal Bar)
- Responsive grid layout using Tailwind
- Charts rendered client-side via `'use client'` components

### Folder Structure
- `features/analytics/analytics.service.ts`
- `features/analytics/analytics.actions.ts`
- `app/dashboard/page.tsx` — server component fetching data
- `app/dashboard/` — chart components

---

## 4. Demo Seeding Script

### Location
- `scripts/seed-demo.ts`

### Target Counts
| Entity | Count |
|--------|-------|
| Fans | 100 |
| Artists | 20 |
| Organizers | 10 |
| Production Houses | 5 |
| Festivals | 10 |
| Songs | 50 |
| NFTs | 100 |
| Transactions | 500 |
| Royalties | 50 |

### Execution Strategy
1. Check `SETTINGS` table for `SEED_EXECUTED` key — skip if already set
2. Create users with appropriate roles and create wallets for each
3. Create organizers → events → tickets
4. Create artists → songs → NFTs for each artist (2-3 songs each, 1-2 NFTs per song)
5. Randomly simulate activity:
   - Fans buy random NFTs
   - Fans buy event tickets
   - Fans cast votes for random artists
   - Royalties are logged during NFT purchases
6. Seed platform wallet with 100,000 MC for distribution
7. Set `SEED_EXECUTED` flag in SETTINGS table

### Run Command
```bash
npx tsx scripts/seed-demo.ts
```

### Dependencies
- Uses Prisma client from `prisma/client`
- Uses existing UserService/NftService/TicketService patterns
- Idempotent — safe to run multiple times (skips on second run)

---

## 5. Sidebar Navigation

Update `features/navigation/` to add:
- "Dashboard" link (visible to ADMIN only)
- "Vote" link (visible to FAN only)

---

## 6. Non-Functional

- All endpoints return typed JSON responses
- All mutations wrapped in Prisma transactions
- Error handling via existing `ActionResponse<T>` pattern
- Tests for each new service
- Seed script output logs progress to stdout
