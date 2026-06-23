# Music Coin Festival Demo — Phase 3: Wallet & Events

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16.2.9 App (App Router, TypeScript)                │
│                                                              │
│  src/features/wallet/                                       │
│  ├── wallet.service.ts        ← Business logic + ACID ops   │
│  ├── wallet.actions.ts        ← Server Actions for UI       │
│  └── wallet.test.ts           ← Unit tests                  │
│                                                              │
│  src/features/events/                                        │
│  ├── events.service.ts        ← FestivalManagementService   │
│  ├── events.actions.ts        ← Server Actions for UI       │
│  ├── components/              ← Event-specific components   │
│  └── events.test.ts           ← Unit tests                  │
│                                                              │
│  src/app/api/wallet/                                         │
│  ├── route.ts                 ← GET /api/wallet             │
│  ├── transactions/route.ts    ← GET /api/wallet/transactions│
│  └── transfer/route.ts        ← POST /api/wallet/transfer   │
│                                                              │
│  src/app/api/events/                                         │
│  ├── route.ts                 ← GET, POST /api/events       │
│  └── [id]/route.ts            ← GET, PUT, DELETE            │
│                                                              │
│  src/app/(dashboard)/                                        │
│  ├── layout.tsx               ← Sidebar + header shell      │
│  ├── page.tsx                 ← Role-based redirect         │
│  ├── organizer/                                              │
│  │   ├── page.tsx             ← Overview / stats            │
│  │   ├── events/                                             │
│  │   │   ├── page.tsx         ← Event list (manage)         │
│  │   │   ├── new/page.tsx     ← Create event form           │
│  │   │   └── [id]/edit/       ← Edit event                  │
│  │   └── wallet/                                             │
│  │       └── page.tsx         ← Wallet + transfers          │
│  └── fan/                                                    │
│      ├── page.tsx             ← Browse events               │
│      └── wallet/                                             │
│          └── page.tsx         ← Wallet + transfers          │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack (unchanged from Phase 2)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.2.9 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + Shadcn UI v4 |
| Forms | React Hook Form v7 + Zod v4 |
| Database | PostgreSQL 16 via Docker (WSL) + Prisma v7 |
| Auth | Custom JWT (jose) + HttpOnly cookies + bcryptjs |
| Testing | Vitest v4 |

## Data Layer Changes

### Schema Migration: Event.artistId → Event.organizerId

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

### Transaction Indexes

```prisma
model Transaction {
  ...
  @@index([senderId, createdAt])
  @@index([receiverId, createdAt])
}
```

### Type Changes

- `IEvent.artistId` → `IEvent.organizerId`
- `IEventWithRelations.artist` → `IEventWithRelations.organizer`
- `IWalletWithTransactions` — new interface extending IWallet with transactions array
- `ICreateEventInput`, `IUpdateEventInput` — new interfaces for event forms
- `ITransferInput` — new interface for wallet transfer form

## Wallet Domain

### WalletService (`src/features/wallet/wallet.service.ts`)

| Function | Returns | Description |
|---|---|---|
| `getWallet(userId: string)` | `Promise<IWalletWithTransactions>` | Fetch wallet + full tx history for user |
| `getTransactions(userId: string, page, limit)` | `Promise<PaginatedResult<ITransaction>>` | Paginated transaction history (sent + received, newest first) |
| `executeWalletTransfer(senderWalletId, receiverWalletId, amount, type)` | `Promise<ITransaction>` | ACID transfer: validate balance, decrement sender, increment receiver, log tx. All in `$transaction`. Throws if insufficient funds. |
| `creditWallet(walletId, amount, type, description?)` | `Promise<ITransaction>` | Atomic credit + transaction log. Used for genesis deposits, refunds. |

### core.executeWalletTransfer — ACID Semantics

```typescript
async executeWalletTransfer(
  senderWalletId: string,
  receiverWalletId: string,
  amount: Prisma.Decimal,
  type: TransactionType,
): Promise<ITransaction> {
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
      data: { senderId: senderWalletId, receiverId: receiverWalletId, amount, type },
    })
  })
}
```

### Fan Registration Bonus (updated `src/lib/auth/auth.ts`)

When `role === "FAN"`, the registration flow deposits 1000 Demo Music Coins atomically:

```typescript
const user = await prisma.$transaction(async (tx) => {
  const newUser = await tx.user.create({
    data: { name, email, password: hashed, role },
  })
  const wallet = await tx.wallet.create({
    data: { userId: newUser.id, balance: new Prisma.Decimal(0) },
  })
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
  return newUser
})
```

### Wallet API Routes

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/wallet` | JWT required | — | `{ id, userId, balance, updatedAt }` |
| GET | `/api/wallet/transactions` | JWT required | `?page=1&limit=20` | `{ data: Transaction[], total, page, limit }` |
| POST | `/api/wallet/transfer` | JWT required | `{ receiverEmail: string, amount: number }` | `{ transaction: Transaction }` |

### Wallet Server Actions

| Action | Purpose |
|---|---|
| `getWalletAction()` | Get current user's wallet for dashboard |
| `getTransactionHistoryAction(page, limit)` | Paginated transactions |
| `transferCoinsAction(receiverEmail, amount)` | Transfer with validation |

## Event Domain

### FestivalManagementService (`src/features/events/events.service.ts`)

| Function | Returns | Description |
|---|---|---|
| `getEvents(filters)` | `Promise<IEventWithOrganizer[]>` | List published events; owner sees own drafts |
| `getEventById(id)` | `Promise<IEventWithOrganizer | null>` | Single event (PUBLISHED or owner) |
| `createEvent(organizerId, data)` | `Promise<IEvent>` | Create event as DRAFT. Validates organizerId exists. |
| `updateEvent(eventId, userId, data)` | `Promise<IEvent>` | Update title/desc/venue/date/price. Owner or ADMIN only. |
| `publishEvent(eventId, userId)` | `Promise<IEvent>` | Transition DRAFT → PUBLISHED. Validates required fields filled. |
| `deleteEvent(eventId, userId)` | `Promise<void>` | Transition to CANCELLED (soft-delete). Owner or ADMIN only. |

### Authorization Rules

| Operation | Allowed Roles | Ownership Check |
|---|---|---|
| `getEvents` (list) | PUBLIC (published), ORGANIZER/ARTIST/ADMIN (own drafts) | Optional |
| `getEventById` | PUBLIC (if published), owner/ADMIN (any) | Yes |
| `createEvent` | ORGANIZER, ARTIST, ADMIN | N/A (creator = owner) |
| `updateEvent` | Owner or ADMIN | Yes |
| `publishEvent` | Owner or ADMIN | Yes |
| `deleteEvent` | Owner or ADMIN | Yes (soft-delete to CANCELLED) |

### Event API Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/events` | Optional | List events. `?status=PUBLISHED` for public listing |
| GET | `/api/events/[id]` | Optional | Single event detail |
| POST | `/api/events` | JWT (Org/Artist) | Create new event |
| PUT | `/api/events/[id]` | JWT (Owner) | Update event fields |
| DELETE | `/api/events/[id]` | JWT (Owner) | Cancel event |

### Event Server Actions

| Action | Purpose |
|---|---|
| `getEventsAction(status?)` | List events for dashboard |
| `createEventAction(data)` | Create event form submission |
| `updateEventAction(eventId, data)` | Edit event form submission |
| `publishEventAction(eventId)` | Publish event from dashboard |

## Dashboard Layout

### DashboardShell (`src/app/(dashboard)/layout.tsx`)

The updated dashboard layout provides:
- **Sidebar** with role-aware navigation links
- **Header** showing user name, role badge, logout button
- **Mobile-responsive** sidebar toggle

Navigation items by role:

| Route | Organizer | Fan |
|---|---|---|
| `/dashboard` | Overview | Browse Events |
| `/dashboard/events` | Manage Events | — |
| `/dashboard/wallet` | Wallet | Wallet |

### Organizer Pages

**Overview** (`/dashboard/organizer/page.tsx`):
- Stats cards: total events, published, drafts, upcoming
- Recent events list (last 5)

**Event Manager** (`/dashboard/organizer/events/page.tsx`):
- Table: title, status badge, date, ticket price, actions (edit, publish, delete)
- "Create Event" button → `/dashboard/organizer/events/new`

**Event Create** (`/dashboard/organizer/events/new/page.tsx`):
- Form: title, description, venue, date picker, ticket price
- Submit creates DRAFT event, redirects to event list

**Event Edit** (`/dashboard/organizer/events/[id]/edit/page.tsx`):
- Pre-filled form with existing event data
- Save updates event, returns to event list

**Wallet** (`/dashboard/organizer/wallet/page.tsx`):
- Balance display card
- Transaction history table (date, type, amount, counterparty)
- Transfer form (receiver email, amount)

### Fan Pages

**Browse Events** (`/dashboard/fan/page.tsx`):
- Grid of PUBLISHED event cards
- Each card: title, venue, date, ticket price, view details link

**Wallet** (`/dashboard/fan/wallet/page.tsx`):
- Balance display (should show 1000 for new signups)
- Transaction history table
- Transfer form to send coins to other users

## Error Handling

### AppError Class

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

All services throw `AppError` with descriptive messages and HTTP status codes. Server Actions catch errors and return `{ success: false, error: string }` (matching the Phase 2 `AuthResult` pattern). API Routes catch errors and return structured JSON.

### API Response Format

```typescript
// Success
{ data: T }
{ data: T[], total: number, page: number, limit: number }

// Error
{ error: string, statusCode: number }
```

## Testing

### Wallet Tests

| Test | Type | What it verifies |
|---|---|---|
| "execute transfer deducts sender balance" | Unit | Sender balance decreases by amount |
| "execute transfer credits receiver" | Unit | Receiver balance increases by amount |
| "execute transfer rejects insufficient funds" | Unit | Throws AppError, no balance change |
| "execute transfer is atomic on failure" | Unit | Partial updates roll back on error |
| "credit wallet adds balance + genesis tx" | Unit | Balance increases, DEPOSIT tx created |
| "Fan registration yields 1000 balance" | Integration | New FAN user has wallet with 1000 + genesis DEPOSIT |
| "get transactions returns paginated history" | Unit | Correct ordering, pagination metadata |

### Event Tests

| Test | Type | What it verifies |
|---|---|---|
| "create event sets DRAFT status" | Unit | Event created with DRAFT, correct organizerId |
| "update event modifies allowed fields" | Unit | Title/desc/venue/date/price updated |
| "publish event transitions to PUBLISHED" | Unit | DRAFT → PUBLISHED |
| "delete event sets CANCELLED status" | Unit | Soft-delete via CANCELLED |
| "non-owner cannot update event" | Unit | Throws AppError |
| "list events excludes other's drafts" | Unit | Non-owner sees only published |
| "organizer scenario: create → publish → fan views" | Integration | Full flow works end-to-end |

### Running Tests

```bash
npm test                    # All tests
npm run test:wallet         # Wallet tests only
npm run test:events         # Event tests only
```
