# Music Coin Festival — Demo Platform

A **blockchain-themed music festival platform** built with Next.js. Features a digital currency (MC), NFT marketplace, event ticketing, royalty management, fan governance, multi-role dashboards, and full demo seeding.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Prisma ORM 7 |
| Auth | JWT (jose) + bcryptjs + Firebase Auth |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui, Lucide icons |
| Charts | Chart.js + react-chartjs-2, Recharts |
| Forms | react-hook-form + zod |
| Testing | Vitest 4 (50 tests) |

---

## Quick Start

```bash
npm install
# Edit .env with your DATABASE_URL
npx prisma migrate dev
npx prisma db seed          # Base seed (5 demo users)
npx tsx scripts/seed-demo.ts # Full demo (140+ users)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/login`.

---

## Feature Flow — Role by Role

### 1. Login (Demo Mode)

| Role | Email | Password | Redirects To |
|------|-------|----------|-------------|
| Admin | `admin@musiccoin.festival` | `Admin@123` | `/admin` |
| Organizer | `organizer@musiccoin.festival` | `Organizer@123` | `/organizer` |
| Artist | `artist@musiccoin.festival` | `Artist@123` | `/artist/dashboard` |
| Fan | `fan@musiccoin.festival` | `Fan@123` | `/fan` |
| Production House | `ph1@demo.com` | `demo` | `/production-house` |

Click role buttons on login page to auto-fill credentials. Toggle between **Demo Mode** (local DB auth) and **Real Mode** (Firebase Auth).

After login, a JWT session cookie is set. The middleware checks role level on each protected route request.

---

### 2. Admin Role (`/admin`)

| Page | Route | What It Does |
|------|-------|-------------|
| **Overview** | `/admin` | Shows platform analytics: total users, verified artists, events, tickets sold, NFT volume, royalty payments, monthly revenue, staking TVL, user retention. Fetches from `/api/admin/analytics`. |
| **User Management** | `/admin/users` | Lists all users with role/status; can update roles or approve users. |
| **Verification** | `/admin/artists/verification` | Lists artists pending verification; approve/reject. |
| **Event Moderation** | `/admin/events/moderation` | Lists all events; change status (publish/cancel). |
| **NFT Monitoring** | `/admin/nfts` | Lists all NFTs; flag for fraud. |
| **Transactions** | `/admin/transactions` | Lists all transactions; flag suspicious ones. |
| **Revenue Reports** | `/admin/revenue` | Shows total revenue + recent transactions. |
| **Security** | `/admin/security` | Audit log of all admin actions. |
| **Analytics** | `/admin/analytics` | Platform-wide charts and metrics. |
| **System Health** | `/admin/system/health` | System health check logs. |
| **AI Dashboard** | `/admin/ai` | AI monitoring dashboard. |
| **Settings** | `/admin/settings` | Platform configuration (CRUD). |

---

### 3. Organizer Role (`/organizer`)

| Page | Route | What It Does |
|------|-------|-------------|
| **Dashboard** | `/organizer` | Shows total revenue, tickets sold, active/draft events. Fetches from `/api/organizer/dashboard`. |
| **Event Management** | `/organizer/events` | Create, edit, publish, cancel events. Uses server actions (`getEventsAction`, `publishEventAction`). |
| **Create Event** | `/organizer/events/new` | Form to create new event (title, venue, date, ticket price, capacity). |
| **Ticket Management** | `/organizer/tickets` | Lists all tickets sold for organizer's events; search by event/attendee. |
| **Attendance** | `/organizer/attendance` | Verify ticket QR codes; mark tickets as used. |
| **Analytics** | `/organizer/analytics` | Event-specific analytics and charts. |
| **Payments** | `/organizer/payments` | Payment reconciliation. |
| **Artist Management** | `/organizer/artists` | Manage artists linked to events. |
| **Notifications** | `/organizer/notifications` | System notifications. |

---

### 4. Artist Role (`/artist/dashboard`)

| Page | Route | What It Does |
|------|-------|-------------|
| **Dashboard** | `/artist/dashboard` | Shows revenue, NFTs minted, sales, songs. Quick actions to manage NFTs, royalties, fans, analytics. |
| **Profile** | `/artist/profile` | Edit stage name, bio, genres, social links. |
| **Verification** | `/artist/verification` | Submit verification request with documents. |
| **NFT Management** | `/artist/nfts` | Mint new NFTs (title, description, price, royalty pct). Lists owned NFTs. |
| **Royalties** | `/artist/royalties` | Track earned royalties + payment history. |
| **Fan Management** | `/artist/fans` | View fan base, voting stats. |
| **Community** | `/artist/community` | Fan club discussions, voting results. |
| **Analytics** | `/artist/analytics` | NFT analytics, revenue, fan engagement charts. |
| **Notifications** | `/artist/notifications` | System notifications (verification, payments, etc.). |

---

### 5. Fan Role (`/fan/dashboard`)

| Page | Route | What It Does |
|------|-------|-------------|
| **Dashboard** | `/fan/dashboard` | Shows token balance, ticket count, NFT collection, rewards. Recent activity feed. |
| **Profile** | `/fan/profile` | Edit display name, email, change password. |
| **Browse Events** | `/fan/events` | Browse & purchase tickets for published events. |
| **My Tickets** | `/fan/tickets` | View purchased tickets with QR codes. |
| **NFT Marketplace** | `/fan/marketplace` | Browse & buy music NFTs. |
| **Wallet** | `/fan/wallet` | View balance, send/receive MC, transaction history. |
| **MusicCoin Token** | `/fan/token` | Token details, stake/claim actions. |
| **Community** | `/fan/community` | Fan discussions, voting. |
| **Notifications** | `/fan/notifications` | System notifications. |
| **Voting** | `/voting` | Vote for artists (+10 MC reward), view leaderboard. |

---

### 6. Production House Role (`/production-house`)

| Page | Route | What It Does |
|------|-------|-------------|
| **Dashboard** | `/production-house` | Shows total/active contracts, total revenue, stakeholders. Recent contracts list. |
| **Rights Management** | `/production-house/contracts` | Create & manage artist contracts (revenue split, royalty split). |
| **Royalty Management** | `/production-house/royalties` | Track revenue splits, distribute revenue to artists, payment history. |
| **Stakeholders** | `/production-house/stakeholders` | Add stakeholders with percentage splits (artist/producer/label/PH/organizer). Edit shares. |
| **Transactions** | `/production-house/transactions` | View all wallet transactions (type, amount, status). |
| **Analytics** | `/production-house/analytics` | Revenue reports, monthly trends, top contracts. Period filter (7D/30D/90D). |
| **Profile Settings** | `/production-house/profile` | Edit company name, view wallet details. |

---

## All API Routes (76 total)

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login (demo + Firebase) |
| POST | `/api/auth/register` | Register (demo + Firebase) |
| POST | `/api/auth/logout` | Logout, clear session |
| POST | `/api/auth/refresh` | Refresh session token |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/send-otp` | Send MFA/verification OTP |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| POST | `/api/auth/mfa/enable` | Enable MFA |
| POST | `/api/auth/mfa/verify` | Verify MFA |
| GET | `/api/auth/wallet` | Get auth wallet info |

### Events
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/events` | List events (supports `?status=`, `?limit=`) |
| POST | `/api/events` | Create event (Organizer) |
| GET | `/api/events/[id]` | Get event details |
| PUT | `/api/events/[id]` | Update event |
| DELETE | `/api/events/[id]` | Cancel event |
| GET | `/api/events/[id]/analytics` | Event analytics |

### Wallet
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/wallet/balance` | Get wallet balance |
| POST | `/api/wallet/transfer` | Send MC to another user |
| GET | `/api/wallet/transactions` | List transactions |
| POST | `/api/wallet/claim` | Claim rewards |
| POST | `/api/wallet/action` | Wallet actions (stake/unstake) |

### NFTs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/nfts` | List available NFTs (supports `?limit=`) |
| POST | `/api/nfts` | Mint NFT (Artist) |
| POST | `/api/nfts/buy` | Buy NFT (Fan) |

### Tickets
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tickets` | List user tickets |
| POST | `/api/tickets/purchase` | Buy event ticket |
| POST | `/api/tickets/verify` | Verify/use ticket |

### Voting
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/vote` | Cast vote (+10 MC reward) |
| GET | `/api/vote/results` | Voting leaderboard |

### Royalties
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/royalties/history` | Royalty payment history |
| POST | `/api/royalties/distribute` | Distribute royalties (Admin) |

### Production House
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/production-house/dashboard` | PH dashboard stats |
| GET/POST | `/api/production-house/contracts` | List/create artist contracts |
| GET/POST | `/api/production-house/royalties` | Royalties + distribute revenue |
| GET/POST/PUT | `/api/production-house/stakeholders` | Stakeholder CRUD |
| GET | `/api/production-house/analytics` | PH analytics |
| GET/PUT | `/api/production-house/profile` | PH profile |
| GET | `/api/production-house/transactions` | PH transactions |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/analytics` | Platform analytics |
| GET/PATCH | `/api/admin/users` | User management |
| GET/PATCH | `/api/admin/nfts` | NFT monitoring |
| GET/PATCH | `/api/admin/events` | Event moderation |
| GET/PATCH | `/api/admin/transactions` | Transaction monitoring |
| GET | `/api/admin/audit` | Audit log |
| GET | `/api/admin/system` | System health |
| GET/PATCH | `/api/admin/revenue` | Revenue reports |
| GET/PATCH | `/api/admin/revenue/config` | Revenue config |
| GET/PATCH | `/api/admin/settings/config` | Platform settings |
| GET/PATCH | `/api/admin/artists/verification` | Artist verification |

### Users
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/update` | Update profile |
| DELETE | `/api/users/delete` | Delete account |
| POST | `/api/users/kyc` | Submit KYC documents |

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics/platform` | Platform-wide analytics |
| GET | `/api/analytics/artists` | Artist analytics |
| GET | `/api/analytics/events` | Event analytics |

### Miscellaneous
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/artists` | List/create artists |
| GET | `/api/artists/[id]` | Get artist details |
| POST | `/api/artists/[id]/endorse` | Endorse artist |
| GET | `/api/fanclub/content` | Fan club content |
| GET/POST | `/api/fantoken` | Fan token management |
| POST | `/api/multisig` | Multi-sig wallet actions |
| POST | `/api/payments/checkout` | Payment checkout |
| POST | `/api/revenue/distribute` | Revenue distribution |
| GET/POST | `/api/production-house/contracts` | Production contracts |
| GET | `/api/vote/results` | Vote results |

---

## Auth Flow

1. **Login page** (`/login`) — Demo mode buttons auto-fill credentials; Real mode uses Firebase Auth
2. **JWT issued** — `__session` cookie (15min) + `__refresh` cookie (7 days)
3. **Middleware** (`src/middleware.ts`) — Checks session on every request, enforces role-based route access
4. **Role levels**: ADMIN(100) > ORGANIZER(80) > ARTIST(60) > PRODUCTION_HOUSE(40) > FAN(20)
5. **Logout** — Clears cookies, redirects to `/login`

---

## Database Schema (31 models)

| Model | Purpose |
|-------|---------|
| `User` | 5 roles: ADMIN, ORGANIZER, ARTIST, PRODUCTION_HOUSE, FAN |
| `Wallet` | Digital wallet per user (Decimal balance) |
| `Event` | Festivals/concerts with venue, date, capacity, ticket price |
| `Ticket` | Purchased tickets linked to event + user |
| `Song` | Music tracks by artists |
| `NFT` | Tokenized music with price, royalty % |
| `Royalty` | Artist royalty amounts |
| `Vote` | Fan → artist voting with weight |
| `Transaction` | All coin movements (10 types) |
| `ProductionContract` | PH ↔ Artist contracts (revenue/royalty splits) |
| `SmartContractSplit` | Multi-party percentage splits |
| `OTP` | One-time passwords for MFA |
| `Artist` | Extended artist profile/verification |
| `FanClubDiscussion` | Fan community posts |
| `Notification` | User notifications |
| `PlatformConfig` | Platform settings |
| `SystemHealth` | Health check logs |
| `AuditLog` | Admin action audit trail |
| `MultiSigRequest` | Multi-signature wallet requests |
| +12 more | Polls, subscriptions, advertisements, etc. |

---

## Testing

```bash
npm test          # Runs all 50 tests
npm run test:watch # Watch mode
```

| File | Tests | Coverage |
|------|-------|----------|
| `wallet.test.ts` | 7 | Balance, transfer, transactions |
| `events.test.ts` | 8 | CRUD, publish, cancel, filtering |
| `nft.test.ts` | 6 | Mint, buy, royalties |
| `ticket.test.ts` | 7 | Purchase, capacity, funds, history |
| `royalty.test.ts` | 3 | Distribution, history |
| `vote.test.ts` | 3 | Cast vote, results |
| `analytics.test.ts` | 1 | Aggregation queries |
| `roles.test.ts` | 5 | Permission checks |
| `validation.test.ts` | 6 | Zod schemas |
| `session.test.ts` | 2 | Token sign/verify |
| `password.test.ts` | 2 | Hash/verify |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                # Login, Register, Forgot-password
│   ├── (dashboard)/           # All role pages (admin/, artist/, fan/, organizer/, production-house/)
│   ├── api/                   # 76 REST API route handlers
│   └── layout.tsx             # Root layout with AuthProvider
├── components/ui/             # shadcn/ui components
├── context/
│   └── AuthContext.tsx        # Client-side auth provider
├── features/
│   ├── analytics/             # Service + actions + tests
│   ├── artists/               # Artist actions
│   ├── events/                # Event CRUD service + actions + tests
│   ├── nfts/                  # NFT mint/buy service + actions + tests
│   ├── notifications/         # Notification actions
│   ├── production-house/      # PH service (dashboard, contracts, royalties, stakeholders, analytics)
│   ├── royalties/             # Royalty service + tests
│   ├── tickets/               # Ticket service + actions + tests
│   ├── voting/                # Vote service + tests
│   └── wallet/                # Wallet service + actions + tests
├── hooks/                     # useAuth hook
├── lib/
│   ├── auth/                  # Auth server actions, session, roles, password, validation
│   ├── firebase/              # Firebase client + admin SDK
│   ├── security/              # Encryption utilities
│   └── prisma.ts              # Prisma client singleton
├── middleware.ts              # Auth, CORS, rate limiting, CSRF
└── types/                     # All TypeScript interfaces & enums
```

---

## Architecture Notes

- **Dual communication**: Server Actions (`"use server"`) for form submissions; REST API routes for client-side fetch calls
- **Consistent API format**: All routes return `{ success: true, data: ... }` / `{ success: false, error: "..." }`
- **Response standardization**: Wrapped responses ensure frontend pages always access `json.data` for payload
- **Prisma transactions**: Multi-entity mutations (wallet transfers, NFT purchases, ticket sales) wrapped in `$transaction`
- **Role-based navigation**: Sidebar auto-adapts to user role showing only relevant pages
- **Demo seeding**: Idempotent seed script creates 140+ users, 100 NFTs, 500+ transactions
