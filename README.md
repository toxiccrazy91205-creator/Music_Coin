# Music Coin Demo 🎵

A **music-focused blockchain demo platform** built with Next.js, featuring a digital currency (Music Coins), NFT marketplace, event ticketing, fan governance, royalty management, and an analytics dashboard. Designed for investor demonstrations with comprehensive demo seeding.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Database | [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM 7](https://www.prisma.io/) |
| Auth | JWT-based (jose) + bcryptjs |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui, Lucide icons |
| Charts | Chart.js + react-chartjs-2 |
| Forms | react-hook-form + zod |
| Testing | Vitest 4 |
| Runtime | tsx (for scripts) |

---

## Features

### Phase 1 — Core Platform
- **Authentication**: JWT-based login/register with role-based access control
- **5 user roles**: ADMIN, ORGANIZER, ARTIST, PRODUCTION_HOUSE, FAN
- **Wallet System**: Digital wallet per user with balance, send/receive Music Coins
- **Transaction Engine**: `DEPOSIT`, `WITHDRAWAL`, `TRANSFER`, `TICKET_PURCHASE`, `ROYALTY_PAYMENT` types
- **Sidebar navigation**: Role-aware menu showing only relevant pages

### Phase 2 — Event Ticketing
- **Event CRUD**: Organizers can create, edit, and manage events (title, venue, date, ticket price, capacity)
- **Event Publishing**: Draft → Published lifecycle
- **Ticket Purchasing**: Fans browse published events and buy tickets
- **Capacity Management**: Tickets cannot exceed event capacity
- **Server Actions**: Form handling with validation

### Phase 3 — NFT Music Marketplace
- **Song Registration**: Artists upload songs (title, description)
- **NFT Minting**: Artists mint NFTs linked to songs with configurable price and royalty percentage
- **NFT Marketplace**: Browse all available NFTs with song + artist info
- **NFT Purchasing**: Fans buy NFTs (wallet debited, transaction logged)

### Phase 4 — Royalties & Ticket Integration
- **Ticket Service**: Refactored ticket logic with service layer + API routes (`GET /api/tickets`, `POST /api/tickets/buy`)
- **NFT Royalties**: Automatic royalty calculation on NFT purchase based on predefined percentage
- **Artist NFT Minting Page**: UI for artists to create NFTs (`/artist/nfts`)
- **Fan NFT Marketplace Page**: UI for fans to browse and buy (`/nft-marketplace`)
- **Full test coverage**: Services + API routes tested

### Phase 5 — Analytics, Governance & Demo Data
- **Royalty API**: `GET /api/royalties` (list by role), `POST /api/royalties/distribute` (admin payout from platform wallet)
- **Fan Voting**: `POST /api/vote` (10 MC reward per vote), `GET /api/vote/results` (leaderboard)
- **Analytics Dashboard** (`/dashboard`): 4 Chart.js panels — Revenue (12-month line), NFT Sales (30-day bar), Event Sales summary, Top Artist Earnings (horizontal bar)
- **Demo Seeding Script**: Generates 100 fans, 20 artists, 10 organizers, 10 festivals, 100 NFTs, 500+ transactions, 50 royalties, and votes — all idempotent

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [PostgreSQL](https://www.postgresql.org/) 14+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd music-coin-demo

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string:
# DATABASE_URL="postgresql://user:password@localhost:5432/music_coin_demo"
```

### Database Setup

```bash
# Apply migrations
npx prisma migrate dev

# Seed with base data (5 users, 1 event, 1 NFT)
npx prisma db seed

# (Optional) Seed with full demo data (140+ users, events, NFTs, transactions)
npx tsx scripts/seed-demo.ts
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

---

## Base Seed Users

| Name | Email | Password | Role |
|------|-------|----------|------|
| Admin | `admin@musiccoin.festival` | `Admin@123` | ADMIN |
| Event Organizer | `organizer@musiccoin.festival` | `Organizer@123` | ORGANIZER |
| Artist One | `artist@musiccoin.festival` | `Artist@123` | ARTIST |
| Production House | `production@musiccoin.festival` | `Production@123` | PRODUCTION_HOUSE |
| Fan One | `fan@musiccoin.festival` | `Fan@123` | FAN |

## Demo Seed (Extended)

Run `npx tsx scripts/seed-demo.ts` to populate:
- 100 fans (password: `demo`)
- 20 artists
- 10 organizers
- 5 production houses
- 10 music festival events
- 50+ songs, 100 NFTs
- 500+ transactions (ticket purchases, NFT sales, deposits, royalty payments)
- 100 votes

Platform wallet (`platform@musiccoin.demo`) seeded with 100,000 MC for royalty distribution.

---

## API Routes

### Events
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/events` | List all events |
| POST | `/api/events` | Create event (ORGANIZER/ADMIN) |
| GET | `/api/events/[id]` | Get event details |
| PUT | `/api/events/[id]` | Update event |
| DELETE | `/api/events/[id]` | Delete event |

### Wallets & Transactions
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/wallet` | Get wallet & transactions |
| POST | `/api/wallet/transfer` | Send coins to another user |
| GET | `/api/wallet/transactions` | List transactions (paginated) |

### NFTs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/nfts` | List available NFTs |
| POST | `/api/nfts` | Mint NFT (ARTIST) |
| POST | `/api/nfts/buy` | Buy NFT (FAN) |

### Tickets
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tickets` | List user tickets |
| POST | `/api/tickets/buy` | Buy event ticket |

### Royalties
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/royalties` | List royalties (role-filtered) |
| POST | `/api/royalties/distribute` | Distribute unpaid royalties (ADMIN) |

### Voting
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/vote` | Cast vote (FAN, +10 MC reward) |
| GET | `/api/vote/results` | Get voting leaderboard |

---

## Project Structure

```
music-coin-demo/
├── prisma/
│   ├── schema.prisma          # 9 models, 3 enums
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Base seed (5 users)
├── scripts/
│   └── seed-demo.ts           # Extended demo seed
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & Register
│   │   ├── (dashboard)/       # Dashboard, events, NFTs, voting, wallet pages
│   │   ├── api/               # 13 REST API routes
│   │   ├── dashboard/         # Admin analytics dashboard + Chart.js
│   │   └── layout.tsx         # Root layout
│   ├── features/
│   │   ├── analytics/         # Aggregated data queries + chart components
│   │   ├── events/            # Event CRUD service + actions
│   │   ├── nfts/              # NFT minting, listing, purchasing
│   │   ├── royalties/         # Royalty tracking + distribution
│   │   ├── tickets/           # Ticket purchasing service
│   │   ├── voting/            # Fan voting + rewards
│   │   └── wallet/            # Wallet balance, transfers, transactions
│   ├── lib/                   # Auth, Prisma client, errors, validation
│   └── types/                 # TypeScript interfaces, enums, constants
├── vitest.config.ts
└── package.json
```

---

## Database Schema (9 Models)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | Platform users (5 roles) | `name`, `email`, `password`, `role` |
| `Wallet` | Music Coin wallet per user | `balance` (Decimal) |
| `Event` | Music festivals/concerts | `title`, `venue`, `date`, `ticketPrice`, `capacity`, `status` |
| `Ticket` | Event ticket purchases | `seatNumber`, relations to Event + User |
| `Song` | Music tracks by artists | `title`, `description` |
| `NFT` | Tokenized music ownership | `price`, `royaltyPercentage`, relations to Song + User |
| `Royalty` | Artist royalty tracking | `amount`, `paidAt` (null = unpaid) |
| `Vote` | Fan governance votes | `weight`, unique per fan+artist |
| `Transaction` | All coin movements | `senderId`, `receiverId`, `amount`, `type` |

---

## Testing

50 tests across 11 files covering all services:

| File | Tests |
|------|-------|
| `wallet.test.ts` | 7 |
| `events.test.ts` | 8 |
| `nft.test.ts` | 6 |
| `ticket.test.ts` | 7 |
| `royalty.test.ts` | 3 |
| `vote.test.ts` | 3 |
| `analytics.test.ts` | 1 |
| `roles.test.ts` | 5 |
| `validation.test.ts` | 6 |
| `session.test.ts` | 2 |
| `password.test.ts` | 2 |

```bash
npm test   # Runs all 50 tests
```

---

## Architecture Decisions

- **Feature modules**: Each domain (wallet, events, NFTs, etc.) is self-contained with service + actions + tests
- **Prisma transactions**: All multi-entity mutations wrapped in `$transaction` for atomicity
- **Role-based access**: API routes check session roles; UI shows role-specific navigation
- **Server Actions**: Form submissions use Next.js Server Actions with `"use server"`
- **Chart.js**: Client-side rendering with `"use client"` components, data fetched in server components
