# Music Coin Festival Demo MVP — Phase 1 Design

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Next.js 15 App (App Router)                     │
│  ├── src/app/(auth)/        — Auth pages         │
│  ├── src/app/(dashboard)/   — Protected pages    │
│  ├── src/components/        — Shared UI (shadcn) │
│  ├── src/features/          — Domain modules     │
│  ├── src/api/               — API routes/actions │
│  ├── src/lib/               — Utilities/config   │
│  ├── src/hooks/             — Custom hooks       │
│  └── src/types/             — TypeScript defs    │
│                                                    │
│  Prisma (PostgreSQL via Docker in WSL)            │
│  React Hook Form + Zod (forms/validation)         │
│  Tailwind CSS + Shadcn UI (styling/components)    │
└─────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS + Shadcn UI |
| Forms | React Hook Form + Zod |
| Database | PostgreSQL via Docker (WSL) + Prisma ORM |
| Auth | NextAuth.js or custom credential auth (Phase 2) |

## Folder Structure

```
project-root/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── events/
│   │   │   ├── wallet/
│   │   │   ├── nfts/
│   │   │   ├── voting/
│   │   │   ├── analytics/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── events/
│   │   ├── wallet/
│   │   ├── nfts/
│   │   └── voting/
│   ├── components/
│   │   └── ui/ (shadcn components)
│   ├── features/
│   │   ├── wallet/
│   │   ├── events/
│   │   ├── tickets/
│   │   ├── nfts/
│   │   ├── royalties/
│   │   ├── voting/
│   │   └── analytics/
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── utils.ts
│   ├── hooks/
│   └── types/
│       └── index.ts
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env
```

## Database Schema (9 Models)

### User
- `id` (UUID, PK)
- `name` (String)
- `email` (String, unique)
- `password` (String, hashed)
- `role` (Enum: ADMIN, ARTIST, FAN)
- `createdAt`, `updatedAt`

Relations: Wallet (1), Events (many, as artist), Tickets (many), Songs (many), Votes cast (many)

### Wallet
- `id` (UUID, PK)
- `userId` (FK → User, cascade delete)
- `balance` (Decimal, default 0)
- `createdAt`, `updatedAt`

Relations: User (1), Transactions (many, as sender or receiver)

### Event
- `id` (UUID, PK)
- `artistId` (FK → User, cascade delete)
- `title` (String)
- `description` (String)
- `venue` (String)
- `date` (DateTime)
- `ticketPrice` (Decimal)
- `status` (Enum: DRAFT, PUBLISHED, CANCELLED, COMPLETED)
- `createdAt`, `updatedAt`

Relations: Artist/User (1), Tickets (many)

### Ticket
- `id` (UUID, PK)
- `eventId` (FK → Event, cascade delete)
- `userId` (FK → User, cascade delete)
- `seatNumber` (String, optional)
- `createdAt`, `updatedAt`

Relations: Event (1), User (1)

### Song
- `id` (UUID, PK)
- `artistId` (FK → User, cascade delete)
- `title` (String)
- `description` (String)
- `createdAt`, `updatedAt`

Relations: Artist/User (1), NFTs (many)

### NFT
- `id` (UUID, PK)
- `songId` (FK → Song, cascade delete)
- `ownerId` (FK → User, restrict delete)
- `price` (Decimal)
- `createdAt`, `updatedAt`

Relations: Song (1), Owner/User (1), Royalties (many)

### Royalty
- `id` (UUID, PK)
- `nftId` (FK → NFT, cascade delete)
- `artistId` (FK → User, cascade delete)
- `amount` (Decimal)
- `createdAt`, `updatedAt`

Relations: NFT (1), Artist/User (1)

### Vote
- `id` (UUID, PK)
- `artistId` (FK → User, cascade delete)
- `fanId` (FK → User, cascade delete)
- `weight` (Int, default 1)
- `createdAt`, `updatedAt`

Relations: Artist/User (1), Fan/User (1)

### Transaction
- `id` (UUID, PK)
- `senderId` (FK → Wallet, cascade delete)
- `receiverId` (FK → Wallet, cascade delete)
- `amount` (Decimal)
- `type` (Enum: DEPOSIT, WITHDRAWAL, TRANSFER, TICKET_PURCHASE, ROYALTY_PAYMENT)
- `createdAt`, `updatedAt`

Relations: Sender Wallet (1), Receiver Wallet (1)

## Relational Constraints

- User → Wallet: 1:1 (cascade on User delete)
- User → Event: 1:many (cascade on User delete)
- User → Ticket: 1:many (cascade on User delete)
- User → Song: 1:many (cascade on User delete)
- User → Vote (as artist): 1:many (cascade on User delete)
- Event → Ticket: 1:many (cascade on Event delete)
- Song → NFT: 1:many (cascade on Song delete)
- NFT → Royalty: 1:many (cascade on NFT delete)
- Wallet → Transaction: 1:many (cascade on Wallet delete)
- NFT → User (owner): Restrict (prevent deleting a user who owns NFTs)
