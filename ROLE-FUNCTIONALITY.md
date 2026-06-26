# Music Coin Festival — Role Functionality Map

## Roles

| Role | Level | Description |
|---|---|---|
| `ADMIN` | 100 | Platform admin — sees system-wide analytics |
| `ORGANIZER` | 80 | Creates/manages events, sells tickets |
| `ARTIST` | 60 | NFTs, songs, events |
| `PRODUCTION_HOUSE` | 40 | Event production/logistics |
| `FAN` | 20 | Buy tickets, NFTs, vote |

---

## Pages Accessible Per Role

### PUBLIC (no login)

| Route | File | What it does |
|---|---|---|
| `/login` | `src/app/(auth)/login/page.tsx` | Email/password form + demo quick-login buttons (Admin, Organizer, Artist, Fan) |
| `/register` | `src/app/(auth)/register/page.tsx` | Registration form with role selection (Fan, Artist, Production House, Organizer — not Admin) |

### ADMIN (login redirect → `/dashboard`)

| Route | File | What it does |
|---|---|---|
| `/dashboard` | `src/app/dashboard/page.tsx` | **Admin Dashboard** — Revenue chart (12mo), NFT sales (30d), event sales summary, top artists earnings chart. Server-side role check: `ADMIN` only |
| `/wallet` | `src/app/(dashboard)/wallet/page.tsx` | **Wallet** — placeholder (`<div>Wallet Page</div>`) |

### ORGANIZER (login redirect → `/organizer`)

| Route | File | What it does |
|---|---|---|
| `/organizer` | `src/app/(dashboard)/organizer/page.tsx` | **Dashboard** — total/published/draft event counts, recent events list, quick Create button |
| `/organizer/wallet` | `src/app/(dashboard)/organizer/wallet/page.tsx` | **Wallet** — balance display, transfer MC to other users, transaction history |
| `/organizer/events` | `src/app/(dashboard)/organizer/events/page.tsx` | **Events list** — list all events, publish drafts, edit, cancel |
| `/organizer/events/new` | `src/app/(dashboard)/organizer/events/new/page.tsx` | **Create event** form (title, desc, venue, date, ticket price) — saves as DRAFT, redirects to events list |
| `/organizer/events/[id]/edit` | `src/app/(dashboard)/organizer/events/[id]/edit/page.tsx` | **Edit event** form — pre-filled, saves updates, redirects to events list |
| `/analytics` | `src/app/(dashboard)/analytics/page.tsx` | **Analytics** — same charts as admin dashboard (Revenue, NFT Sales, Event Sales, Top Artists) |

### ARTIST (login redirect → `/artist/nfts`)

| Route | File | What it does |
|---|---|---|
| `/wallet` | `src/app/(dashboard)/wallet/page.tsx` | **Wallet** — placeholder |
| `/events` | `src/app/(dashboard)/events/page.tsx` | **Events list** — placeholder |
| `/nfts` | `src/app/(dashboard)/nfts/page.tsx` | **NFTs page** — placeholder |
| `/artist/nfts` | `src/app/(dashboard)/artist/nfts/page.tsx` | **Mint & manage NFTs** — form to mint (title, description, price, royalty %), view owned NFTs |

### PRODUCTION_HOUSE (login redirect → `/dashboard` fallback)

| Route | File | What it does |
|---|---|---|
| `/wallet` | `src/app/(dashboard)/wallet/page.tsx` | **Wallet** — placeholder |
| `/events` | `src/app/(dashboard)/events/page.tsx` | **Events list** — placeholder |

### FAN (login redirect → `/fan`)

| Route | File | What it does |
|---|---|---|
| `/fan` | `src/app/(dashboard)/fan/page.tsx` | **Browse Events** — all published events with date/venue/price |
| `/fan/wallet` | `src/app/(dashboard)/fan/wallet/page.tsx` | **Wallet** — balance, transfer MC, transaction history |
| `/nft-marketplace` | `src/app/(dashboard)/nft-marketplace/page.tsx` | **NFT Marketplace** — browse & buy NFTs (filters out own) |
| `/voting` | `src/app/(dashboard)/voting/page.tsx` | **Voting page** — placeholder |

---

## Sidebar Navigation Per Role

**File:** `src/app/(dashboard)/components/sidebar.tsx`

### ADMIN

| Icon | Label | Route |
|---|---|---|
| Wallet | My Wallet | `/wallet` |
| BarChart3 | Dashboard | `/dashboard` |

### ORGANIZER

| Icon | Label | Route |
|---|---|---|
| LayoutDashboard | Dashboard | `/organizer` |
| Wallet | My Wallet | `/organizer/wallet` |
| Calendar | Events | `/organizer/events` |
| BarChart3 | Analytics | `/analytics` |

### ARTIST

| Icon | Label | Route |
|---|---|---|
| Wallet | My Wallet | `/wallet` |
| Calendar | Events | `/events` |
| ImageIcon | My NFTs | `/nfts` |

### PRODUCTION_HOUSE

| Icon | Label | Route |
|---|---|---|
| Wallet | My Wallet | `/wallet` |
| Calendar | Events | `/events` |

### FAN

| Icon | Label | Route |
|---|---|---|
| Search | Browse Events | `/fan` |
| Wallet | My Wallet | `/fan/wallet` |
| ImageIcon | Marketplace | `/nft-marketplace` |
| Vote | Voting | `/voting` |

---

## API Routes (backend)

| Route | File | What it does |
|---|---|---|
| `GET/POST /api/events` | `src/app/api/events/route.ts` | List / create events |
| `GET/PUT/DELETE /api/events/[id]` | `src/app/api/events/[id]/route.ts` | Get / update / delete single event |
| `GET/POST /api/nfts` | `src/app/api/nfts/route.ts` | List / mint NFTs |
| `POST /api/nfts/buy` | `src/app/api/nfts/buy/route.ts` | Purchase an NFT |
| `GET/POST /api/tickets` | `src/app/api/tickets/route.ts` | List / purchase tickets |
| `POST /api/tickets/buy` | `src/app/api/tickets/buy/route.ts` | Buy a ticket |
| `GET /api/wallet` | `src/app/api/wallet/route.ts` | Get wallet + transactions |
| `POST /api/wallet/transfer` | `src/app/api/wallet/transfer/route.ts` | Transfer coins between users |
| `GET /api/wallet/transactions` | `src/app/api/wallet/transactions/route.ts` | Get paginated transaction history |
| `POST /api/royalties` | `src/app/api/royalties/route.ts` | Create royalty entry |
| `POST /api/royalties/distribute` | `src/app/api/royalties/distribute/route.ts` | Distribute royalties |
| `POST /api/vote` | `src/app/api/vote/route.ts` | Cast a vote |
| `GET /api/vote/results` | `src/app/api/vote/results/route.ts` | Get voting results |

---

## Login Flow

1. `loginAction(email, password)` in `src/lib/auth/auth.ts`
   - Validates with Zod `loginSchema`
   - Looks up user by email
   - Verifies password with bcrypt
   - Creates JWT (HS256, `{sub, email, role}`, 7-day expiry)
   - Sets `__session` httpOnly cookie via `setSessionCookie()`

2. Client redirects by role:

| Role | Redirects To |
|---|---|
| `ADMIN` | `/dashboard` |
| `ORGANIZER` | `/organizer` |
| `ARTIST` | `/artist/nfts` |
| `FAN` | `/fan` |
| fallback | `/dashboard` |

---

## Registration Flow

1. `registerAction(name, email, password, role)` in `src/lib/auth/auth.ts`
   - Validates with Zod `registerSchema` (name >= 2 chars, valid email, password >= 8 chars with upper+lower+number)
   - Checks for duplicate email
   - Hashes password with bcrypt
   - Creates `User` + `Wallet` (0 balance) in a Prisma transaction
   - If role is `FAN`: adds 1000 MC welcome bonus + DEPOSIT transaction
   - Creates JWT, sets `__session` cookie
2. Redirects to `/dashboard`

---

## Route Protection

**Middleware:** `src/middleware.ts`

- **Public routes** (`/login`, `/register`, `/api/auth/`, `/_next/*`, `/favicon.ico`) — no auth required
- **All other routes** — require valid `__session` cookie → redirect to `/login` if missing or invalid
- **Role-level checks** exist in middleware only for paths starting with `/dashboard/*`:
  - `/dashboard/admin` → level 100 (ADMIN)
  - `/dashboard/analytics` → level 60 (ARTIST)
  - `/dashboard/nfts/create` → level 60 (ARTIST)
  - `/dashboard/events/create` → level 80 (ORGANIZER)
  - Default route level: 20 (FAN)
- **Actual app routes** (`/organizer/*`, `/fan/*`, `/artist/*`, etc.) — only auth layer from middleware; role access is enforced by:
  - Sidebar only showing links for the user's role
  - Server-side role checks in individual pages (e.g., `/dashboard` checks `session.role !== "ADMIN"`)
  - Server actions checking `session.sub` for ownership

---

## Auth Architecture

| Component | Details |
|---|---|
| **JWT Algorithm** | HS256 |
| **Token expiry** | 7 days |
| **Cookie name** | `__session` (httpOnly) |
| **Cookie options** | secure in production, sameSite lax, path `/` |
| **Client-side auth** | `AuthProvider` wraps app, calls `getProfile()` on mount to hydrate user from cookie |
| **Server-side auth** | `getSession()` reads cookie, verifies JWT, returns `TokenPayload` |
| **Logout** | Clears `__session` cookie, client redirects to `/login` |

---

## Session Types

```typescript
// src/lib/auth/session.ts
export interface TokenPayload extends JWTPayload {
  sub: string    // user ID
  email: string
  role: UserRole
}

// src/types/index.ts
enum UserRole {
  ADMIN = "ADMIN",
  ORGANIZER = "ORGANIZER",
  ARTIST = "ARTIST",
  PRODUCTION_HOUSE = "PRODUCTION_HOUSE",
  FAN = "FAN",
}
```

---

## Layout Structure

| Layout | File | Purpose |
|---|---|---|
| Root Layout | `src/app/layout.tsx` | Wraps everything in `<AuthProvider>`, sets up Geist fonts |
| Auth Layout `(auth)` | `src/app/(auth)/layout.tsx` | Centered card layout for login/register pages |
| Dashboard Layout `(dashboard)` | `src/app/(dashboard)/layout.tsx` | Renders `<Sidebar />` + main content with `lg:pl-64` padding |

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@musiccoin.festival` | `Admin@123` |
| Organizer | `organizer@musiccoin.festival` | `Organizer@123` |
| Artist | `artist@musiccoin.festival` | `Artist@123` |
| Fan | `fan@musiccoin.festival` | `Fan@123` |

Seed data also creates 10 organizers (`organizer1-10@demo.com`), 20 artists, 100 fans (all with password `demo`).

---

## Role-to-Page Access Matrix

| Page \ Role | ADMIN | ORGANIZER | ARTIST | PRODUCTION_HOUSE | FAN | Public |
|---|---|---|---|---|---|---|
| `/` | redirect | redirect | redirect | redirect | redirect | redirect |
| `/login` | — | — | — | — | — | YES |
| `/register` | — | — | — | — | — | YES |
| `/dashboard` | YES | — | — | — | — | — |
| `/wallet` | YES | — | YES | YES | — | — |
| `/nfts` | — | — | YES | — | — | — |
| `/nft-marketplace` | — | — | — | — | YES | — |
| `/events` | — | — | YES | YES | — | — |
| `/voting` | — | — | — | — | YES | — |
| `/analytics` | — | YES | — | — | — | — |
| `/fan` | — | — | — | — | YES | — |
| `/fan/wallet` | — | — | — | — | YES | — |
| `/artist/nfts` | — | — | YES | — | — | — |
| `/organizer` | — | YES | — | — | — | — |
| `/organizer/wallet` | — | YES | — | — | — | — |
| `/organizer/events` | — | YES | — | — | — | — |
| `/organizer/events/new` | — | YES | — | — | — | — |
| `/organizer/events/[id]/edit` | — | YES | — | — | — | — |

---

## Fixes Applied This Session

1. **Navigation links** — 9 occurrences of `/dashboard/organizer/...` → `/organizer/...` in 4 files (root cause: `(dashboard)` route group doesn't affect URL path)
   - `src/app/(dashboard)/organizer/page.tsx`
   - `src/app/(dashboard)/organizer/events/page.tsx`
   - `src/app/(dashboard)/organizer/events/new/page.tsx`
   - `src/app/(dashboard)/organizer/events/[id]/edit/page.tsx`

2. **Edit event restriction** — removed `event.status !== "DRAFT"` check in `EventService.updateEvent()` (`src/features/events/events.service.ts`) so published events can also be edited

3. **Analytics page** — built actual Chart.js dashboard (was placeholder `<div>Analytics Page</div>`)
   - `src/app/(dashboard)/analytics/page.tsx` — now shows Revenue chart, NFT sales, event sales, top artists
