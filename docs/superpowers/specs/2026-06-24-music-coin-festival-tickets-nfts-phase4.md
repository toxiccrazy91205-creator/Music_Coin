# Phase 4: Tickets, NFTs & Marketplace Design Spec

> **Date:** 2026-06-24
> **Project:** Music Coin Festival Demo MVP
> **Status:** Approved Design — Ready for Implementation

## Overview

Add ticket purchasing and NFT marketplace to the Music Coin Festival platform. Builds on Phase 3 wallet infrastructure (atomic `$transaction`, `Prisma.Decimal`, `WalletService`).

**6 implementation tasks:** schema migration → ticket service/API → NFT service/API → Artist NFT pages → Fan marketplace → integration + tests.

---

## 1. Schema Changes

### Event — add capacity field
```prisma
model Event {
  // ... existing fields
  ticketPrice Decimal
  status      EventStatus @default(DRAFT)
  capacity    Int?                     // NEW: null = unlimited
  // ...
}
```

### NFT — add royaltyPercentage field
```prisma
model NFT {
  // ... existing fields (id, songId, ownerId, price)
  royaltyPercentage Int      @default(0)   // NEW: 0–100
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  // ... existing relations
}
```

No new models needed — `TransactionType` already includes `TICKET_PURCHASE` and `ROYALTY_PAYMENT`.

---

## 2. Ticket Service (`src/features/tickets/ticket.service.ts`)

### `buyTicket(userId: string, eventId: string)`
- Validate: event exists, status === PUBLISHED, not at capacity (if capacity set, count existing tickets < capacity)
- `prisma.$transaction`:
  1. Find Fan wallet (`findUniqueOrThrow`), verify `balance >= event.ticketPrice`
  2. Find Organizer wallet via event.organizerId
  3. Debit Fan: `wallet.update({ where: { id: fanWalletId }, data: { balance: { decrement: ticketPrice } } })`
  4. Credit Organizer: `wallet.update({ where: { id: orgWalletId }, data: { balance: { increment: ticketPrice } } })`
  5. Create Ticket record
  6. Create Transaction record (type: TICKET_PURCHASE, senderId = fanWalletId, receiverId = orgWalletId)
- Return: `{ ticket, transaction }`

### `getUserTickets(userId: string)`
- Simple `prisma.ticket.findMany({ where: { userId }, include: { event: true } })`

**Server Actions** (`ticket.actions.ts`):
- `buyTicketAction(eventId: string)` — calls service, returns `{ success, data?, error? }`
- `getUserTicketsAction()` — calls service, returns `{ success, data?, error? }`

**API Routes:**
- `GET /api/tickets` — list current user's tickets
- `POST /api/tickets/buy` — `{ eventId }` body → buy ticket

---

## 3. NFT Service (`src/features/nfts/nft.service.ts`)

### `mintNft(artistId: string, input: { title, description, price, royaltyPercentage })`
- `prisma.$transaction`:
  1. Create Song record (artistId, title, description)
  2. Create NFT record (songId, ownerId = artistId, price, royaltyPercentage)
- Return: `{ song, nft }`

### `getAvailableNfts()`
- `prisma.nft.findMany({ include: { song: true, owner: { select: { id, name } } } })`

### `buyNft(buyerId: string, nftId: string)`
- Validate: nft exists, buyer != current owner
- `prisma.$transaction`:
  1. Find Buyer wallet, verify balance >= nft.price
  2. Find Artist wallet (current owner)
  3. Debit Buyer, credit Artist (full price)
  4. Update NFT owner to buyer
  5. Create Transaction (type: TRANSFER, sender = buyer, receiver = artist)
  6. If nft.royaltyPercentage > 0: create Royalty record + ROYALTY_PAYMENT transaction
- Return: `{ nft, transaction }`

**Server Actions** (`nft.actions.ts`):
- `mintNftAction(input)` — for Artist
- `getNftsAction()` — for Fan marketplace
- `buyNftAction(nftId)` — for Fan

**API Routes:**
- `GET /api/nfts` — list all NFTs with song/owner
- `POST /api/nfts` — mint new NFT (Artist)
- `POST /api/nfts/buy` — `{ nftId }` body → buy NFT (Fan)

---

## 4. Artist NFT Pages (`/artist/nfts`)

Two sub-pages:

### Page: List + Mint Form (`/artist/nfts`)
- Two-column layout
- Left: Mint form (song title, description, price, royalty percentage)
- Right: Table of owned NFTs (title, price, status, buyer count)
- On submit: mint NFT → redirect stays on page, new NFT appears in list

### No separate create/edit — minting is a single combined form (song + NFT).
Song editing is out of scope for MVP.

---

## 5. Fan Marketplace (`/nft-marketplace`)

Single page listing all NFTs available for purchase:
- Card grid (matching `/fan` events pattern)
- Each card shows: song title, artist name, description, price (MC), royalty %
- "Buy NFT" button on each card
- After purchase: show success/toast, card disappears, wallet balance updates

---

## 6. Sidebar & Nav Updates

Add to `roleNav` map in `sidebar.tsx`:

```typescript
ARTIST: [
  // ... existing items
  { href: "/artist/nfts", label: "My NFTs", icon: ImageIcon },
],
FAN: [
  // ... existing items
  { href: "/nft-marketplace", label: "Marketplace", icon: ImageIcon },
],
```

---

## 7. Error Handling

| Scenario | Error | HTTP |
|----------|-------|------|
| Event not found / not PUBLISHED | "Event not found or not available" | 404 |
| Event at capacity | "Event is sold out" | 400 |
| Insufficient balance (ticket) | "Insufficient funds to purchase ticket" | 400 |
| NFT not found | "NFT not found" | 404 |
| Buying own NFT | "Cannot purchase your own NFT" | 400 |
| Insufficient balance (NFT) | "Insufficient funds to purchase NFT" | 400 |
| Self-transfer (general) | "Cannot transfer to yourself" | 400 |

---

## 8. Tests

### Ticket tests (`src/features/tickets/ticket.test.ts`)
| Test | Scenario |
|------|----------|
| buyTicket | Success: fan buys ticket, wallet debited/credited, ticket created |
| buyTicket — insufficient funds | Fan with 0 balance tries to buy |
| buyTicket — event not published | Draft event |
| buyTicket — event at capacity | Sold out |
| getUserTickets | Returns tickets for user |

### NFT tests (`src/features/nfts/nft.test.ts`)
| Test | Scenario |
|------|----------|
| mintNft | Artist creates song + NFT |
| buyNft | Fan buys NFT, ownership transfers, transaction logged |
| buyNft — insufficient funds | Fan can't afford |
| buyNft — own NFT | Artist tries to buy own listing |
| buyNft — with royalty | Royalty percentage > 0, Royalty record created |

### Total: ~12 new tests

---

## 9. Implementation Order

1. Schema migration (capacity + royaltyPercentage)
2. Type definitions (INftPurchaseRequest, ITicketWithEvent, etc.)
3. Ticket service + Server Actions + API routes
4. NFT service + Server Actions + API routes
5. Artist NFT UI page
6. Fan Marketplace UI page
7. Sidebar nav + integration
8. Tests (ticket + nft)
