# Music Coin Festival MVP — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Next.js 16 project with Prisma + PostgreSQL, complete folder structure, full database schema with 9 models, TypeScript interfaces, and a verified database connection via a seed script.

**Architecture:** Next.js 16 App Router with TypeScript, Tailwind CSS, and Shadcn UI on the frontend; Prisma ORM connecting to PostgreSQL running in Docker via WSL. The folder structure follows domain-driven feature modules under `src/features/`.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Shadcn UI, React Hook Form + Zod, Prisma ORM, PostgreSQL 16 (Docker), Node.js 22+

## Global Constraints

- Node.js >= 22.0.0
- PostgreSQL 16 via Docker in WSL
- Prisma ORM as the only database access layer
- All file paths are case-sensitive and must match the spec exactly
- UUID primary keys for all models
- Cascade deletes on all foreign keys except NFT → User (owner) which uses Restrict
- Enums: UserRole (ADMIN, ARTIST, FAN), EventStatus (DRAFT, PUBLISHED, CANCELLED, COMPLETED), TransactionType (DEPOSIT, WITHDRAWAL, TRANSFER, TICKET_PURCHASE, ROYALTY_PAYMENT)
- All Decimal fields use Prisma's `Decimal` type (not Float)
- Next.js 16 (installed via @latest, as confirmed by user)

---
### Task 1: Initialize Git Repo and Docker PostgreSQL

**Files:**
- Create: `docker-compose.yml`
- Create: `.gitignore`
- Create: `.env`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
.next/
.env
prisma/migrations/
dist/
*.log
.DS_Store
```

- [ ] **Step 2: Create `docker-compose.yml`**

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16
    container_name: music-coin-db
    environment:
      POSTGRES_USER: musiccoin
      POSTGRES_PASSWORD: musiccoin_pass
      POSTGRES_DB: music_coin_demo
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 3: Create `.env` for database connection**

```
DATABASE_URL="postgresql://musiccoin:musiccoin_pass@localhost:5432/music_coin_demo"
```

- [ ] **Step 4: Initialize Git repo and commit**

Run: `git init`

```bash
git add .gitignore docker-compose.yml .env
git commit -m "chore: initialize git repo with Docker PostgreSQL setup"
```

- [ ] **Step 5: Start PostgreSQL container**

Run: `docker compose up -d` (from WSL terminal or PowerShell)

Expected: Container starts and PostgreSQL accepts connections on port 5432.

---
### Task 2: Scaffold Next.js 16 Project

**Files:**
- Create: Standard Next.js 16 scaffolded output

- [ ] **Step 1: Create Next.js project with TypeScript and Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack --force
```

- [ ] **Step 2: Verify the project builds**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js project with TypeScript and Tailwind CSS"
```

---
### Task 3: Install Dependencies

**Files:**
- Modify: `package.json` (dependencies added)

- [ ] **Step 1: Install shadcn/ui, Prisma, React Hook Form, Zod**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button card input label form select toast -y
npm install prisma @prisma/client react-hook-form @hookform/resolvers zod
npm install -D @types/node
```

- [ ] **Step 2: Verify installation**

```bash
npx prisma --version
```

Expected: Prisma CLI version displayed.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: install shadcn/ui, Prisma, React Hook Form, and Zod"
```

---
### Task 4: Create Complete Folder Structure

**Files:**
- Create: All directory structure per spec

- [ ] **Step 1: Create all directories**

```bash
mkdir -p prisma
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/register
mkdir -p src/app/\(dashboard\)/events
mkdir -p src/app/\(dashboard\)/wallet
mkdir -p src/app/\(dashboard\)/nfts
mkdir -p src/app/\(dashboard\)/voting
mkdir -p src/app/\(dashboard\)/analytics
mkdir -p src/api/auth
mkdir -p src/api/events
mkdir -p src/api/wallet
mkdir -p src/api/nfts
mkdir -p src/api/voting
mkdir -p src/components/ui
mkdir -p src/features/wallet
mkdir -p src/features/events
mkdir -p src/features/tickets
mkdir -p src/features/nfts
mkdir -p src/features/royalties
mkdir -p src/features/voting
mkdir -p src/features/analytics
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/types
```

- [ ] **Step 2: Add placeholder `page.tsx` files and `layout.tsx`**

`src/app/(auth)/login/page.tsx`:
```tsx
export default function LoginPage() {
  return <div>Login Page</div>
}
```

`src/app/(auth)/register/page.tsx`:
```tsx
export default function RegisterPage() {
  return <div>Register Page</div>
}
```

`src/app/(dashboard)/layout.tsx`:
```tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  )
}
```

`src/app/(dashboard)/events/page.tsx`:
```tsx
export default function EventsPage() {
  return <div>Events Page</div>
}
```

`src/app/(dashboard)/wallet/page.tsx`:
```tsx
export default function WalletPage() {
  return <div>Wallet Page</div>
}
```

`src/app/(dashboard)/nfts/page.tsx`:
```tsx
export default function NFTsPage() {
  return <div>NFTs Page</div>
}
```

`src/app/(dashboard)/voting/page.tsx`:
```tsx
export default function VotingPage() {
  return <div>Voting Page</div>
}
```

`src/app/(dashboard)/analytics/page.tsx`:
```tsx
export default function AnalyticsPage() {
  return <div>Analytics Page</div>
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: create complete folder structure with route placeholders"
```

---
### Task 5: Write Complete Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `.env` (ensure DATABASE_URL is set)

- [ ] **Step 1: Write `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  ARTIST
  FAN
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  TRANSFER
  TICKET_PURCHASE
  ROYALTY_PAYMENT
}

model User {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  email     String   @unique
  password  String
  role      UserRole @default(FAN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  wallet       Wallet?
  events       Event[]
  tickets      Ticket[]
  songs        Song[]
  votesGiven   Vote[]    @relation("VoteFan")
  votesReceived Vote[]   @relation("VoteArtist")
  nftsOwned    NFT[]
  royalties    Royalty[]
}

model Wallet {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @unique @db.Uuid
  balance   Decimal  @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  sentTransactions  Transaction[] @relation("SenderWallet")
  receivedTransactions Transaction[] @relation("ReceiverWallet")
}

model Event {
  id          String      @id @default(uuid()) @db.Uuid
  artistId    String      @db.Uuid
  title       String
  description String
  venue       String
  date        DateTime
  ticketPrice Decimal
  status      EventStatus @default(DRAFT)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  artist  User     @relation(fields: [artistId], references: [id], onDelete: Cascade)
  tickets Ticket[]
}

model Ticket {
  id         String   @id @default(uuid()) @db.Uuid
  eventId    String   @db.Uuid
  userId     String   @db.Uuid
  seatNumber String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Song {
  id          String   @id @default(uuid()) @db.Uuid
  artistId    String   @db.Uuid
  title       String
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  artist User  @relation(fields: [artistId], references: [id], onDelete: Cascade)
  nfts   NFT[]
}

model NFT {
  id        String   @id @default(uuid()) @db.Uuid
  songId    String   @db.Uuid
  ownerId   String   @db.Uuid
  price     Decimal
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  song      Song      @relation(fields: [songId], references: [id], onDelete: Cascade)
  owner     User      @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  royalties Royalty[]
}

model Royalty {
  id        String   @id @default(uuid()) @db.Uuid
  nftId     String   @db.Uuid
  artistId  String   @db.Uuid
  amount    Decimal
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  nft    NFT  @relation(fields: [nftId], references: [id], onDelete: Cascade)
  artist User @relation(fields: [artistId], references: [id], onDelete: Cascade)
}

model Vote {
  id        String   @id @default(uuid()) @db.Uuid
  artistId  String   @db.Uuid
  fanId     String   @db.Uuid
  weight    Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  artist User @relation("VoteArtist", fields: [artistId], references: [id], onDelete: Cascade)
  fan    User @relation("VoteFan", fields: [fanId], references: [id], onDelete: Cascade)
}

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
}
```

- [ ] **Step 2: Run Prisma format to validate**

```bash
npx prisma format
```

Expected: Schema is formatted without errors.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add complete Prisma schema with 9 models, enums, and cascading deletes"
```

---
### Task 6: Create Prisma Client Singleton and Set Up Database

**Files:**
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Create `src/lib/prisma.ts`**

```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 2: Run Prisma generate and push**

```bash
npx prisma generate
npx prisma db push
```

Expected: `prisma generate` creates the client. `prisma db push` applies the schema to PostgreSQL and outputs "Your database is now in sync with your Prisma schema."

- [ ] **Step 3: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat: create Prisma client singleton and push schema to database"
```

---
### Task 7: Create TypeScript Interfaces

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create `src/types/index.ts`**

```typescript
export enum UserRole {
  ADMIN = "ADMIN",
  ARTIST = "ARTIST",
  FAN = "FAN",
}

export enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER = "TRANSFER",
  TICKET_PURCHASE = "TICKET_PURCHASE",
  ROYALTY_PAYMENT = "ROYALTY_PAYMENT",
}

export interface IUser {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface IWallet {
  id: string
  userId: string
  balance: number
  createdAt: Date
  updatedAt: Date
}

export interface IEvent {
  id: string
  artistId: string
  title: string
  description: string
  venue: string
  date: Date
  ticketPrice: number
  status: EventStatus
  createdAt: Date
  updatedAt: Date
}

export interface ITicket {
  id: string
  eventId: string
  userId: string
  seatNumber: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ISong {
  id: string
  artistId: string
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export interface INFT {
  id: string
  songId: string
  ownerId: string
  price: number
  createdAt: Date
  updatedAt: Date
}

export interface IRoyalty {
  id: string
  nftId: string
  artistId: string
  amount: number
  createdAt: Date
  updatedAt: Date
}

export interface IVote {
  id: string
  artistId: string
  fanId: string
  weight: number
  createdAt: Date
  updatedAt: Date
}

export interface ITransaction {
  id: string
  senderId: string
  receiverId: string
  amount: number
  type: TransactionType
  createdAt: Date
  updatedAt: Date
}

export interface IUserWithRelations extends IUser {
  wallet: IWallet | null
  events: IEvent[]
  tickets: ITicket[]
  songs: ISong[]
  nftsOwned: INFT[]
  votesGiven: IVote[]
  votesReceived: IVote[]
}

export interface IEventWithRelations extends IEvent {
  artist: IUser
  tickets: ITicket[]
}

export interface INFTWithRelations extends INFT {
  song: ISong
  owner: IUser
  royalties: IRoyalty[]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript interfaces for all database models with relations"
```

---
### Task 8: Write Seed Script and Verify Database Connection

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Install tsx for running seed**

```bash
npm install -D tsx
```

- [ ] **Step 2: Create `prisma/seed.ts`**

```typescript
import { PrismaClient } from "@prisma/client"
import * as crypto from "crypto"

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

async function main() {
  console.log("Seeding database...")

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@musiccoin.festival" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@musiccoin.festival",
      password: hashPassword("Admin@123"),
      role: "ADMIN",
    },
  })

  console.log(`Admin user created: ${adminUser.email} (${adminUser.id})`)

  const wallet = await prisma.wallet.findUnique({
    where: { userId: adminUser.id },
  })

  if (!wallet) {
    await prisma.wallet.create({
      data: {
        userId: adminUser.id,
        balance: 1000,
      },
    })
    console.log("Wallet created for admin user with balance 1000")
  } else {
    console.log(`Wallet found with balance: ${wallet.balance}`)
  }

  const tableCounts = {
    users: await prisma.user.count(),
    wallets: await prisma.wallet.count(),
    events: await prisma.event.count(),
    tickets: await prisma.ticket.count(),
    songs: await prisma.song.count(),
    nfts: await prisma.nft.count(),
    royalties: await prisma.royalty.count(),
    votes: await prisma.vote.count(),
    transactions: await prisma.transaction.count(),
  }

  console.log("Database connection verified. Table counts:", JSON.stringify(tableCounts, null, 2))
  console.log("Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] **Step 3: Add seed configuration to `package.json`**

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 4: Run the seed script to verify connection**

```bash
npx prisma db seed
```

Expected: Output shows "Admin user created", wallet found/created, table counts all at 0 (except users=1, wallets=1). No errors.

- [ ] **Step 5: Run seed again to verify upsert idempotency**

```bash
npx prisma db seed
```

Expected: Runs without error (upsert updates the existing admin).

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed script with admin user creation and database verification"
```
