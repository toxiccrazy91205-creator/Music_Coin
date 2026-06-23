# Music Coin Festival Auth & RBAC — Phase 2 Design

## Architecture

```
src/lib/auth/
├── auth.ts          — Server Actions (register, login, logout, getProfile)
├── session.ts       — JWT sign/verify, cookie management
├── password.ts      — bcrypt hash/compare
├── roles.ts         — RoleGuard, role hierarchy, permission checks
└── validation.ts    — Zod schemas for auth forms

src/context/
└── AuthContext.tsx   — React context for client-side auth state

src/app/(auth)/
├── login/page.tsx   — Login form (React Hook Form + Zod)
├── register/page.tsx— Register form + role selection
└── layout.tsx       — Auth layout (centered card)

src/middleware.ts     — Next.js edge middleware for route protection
```

## Role System

| Role | Identifier | Access |
|------|-----------|--------|
| Admin | `ADMIN` | Full access — all routes, all features, user management |
| Fan | `FAN` | Profile, wallet, tickets (own), voting |
| Artist | `ARTIST` | Dashboard, events (own), songs, NFTs, royalties |
| Organizer | `ORGANIZER` | Dashboard, events (own), ticket management |
| Production House | `PRODUCTION_HOUSE` | Dashboard, event production view, logistics |

Route protection uses a hierarchical permission model. Each role has a numeric level; a user can access any route whose required level is ≤ their role level.

| Role | Level |
|------|-------|
| ADMIN | 100 |
| ORGANIZER | 80 |
| ARTIST | 60 |
| PRODUCTION_HOUSE | 40 |
| FAN | 20 |

## Auth Flow

### Registration
1. Client submits `POST /register` (Server Action) with name, email, password, role
2. Zod validates input (email format, password min 8 chars with complexity, role in enum)
3. bcrypt hashes password (12 salt rounds)
4. Prisma transaction creates User + Wallet atomically
5. JWT signed with user id, email, role; set as HttpOnly cookie
6. Return success with user profile (no password)

### Login
1. Client submits `POST /login` with email, password
2. Zod validates input
3. Find user by email; bcrypt compare password
4. JWT signed; set as HttpOnly cookie
5. Return user profile

### Logout
1. Client submits `POST /logout`
2. Clear session cookie (set empty, maxAge 0)

### Session Verification (getProfile)
1. Read JWT from HttpOnly cookie
2. Verify signature using `jose`
3. Look up user in database, return profile (no password)

## JWT Configuration

| Setting | Value |
|---------|-------|
| Algorithm | HS256 |
| Secret | `JWT_SECRET` env var (min 32 chars) |
| Expiry | 7 days |
| Cookie name | `__session` |
| Cookie flags | HttpOnly, Secure (prod), SameSite=Lax, Path=/ |

## Route Protection (Middleware)

Next.js middleware runs on every request. It:
1. Skips public routes: `/login`, `/register`, `/_next/*`, `/favicon.ico`, `/public/*`
2. Reads `__session` cookie
3. Verifies JWT signature using `jose`
4. Decodes payload: `{ sub: userId, email, role, iat, exp }`
5. Checks route permissions against user role
6. Redirects unauthorized to `/login` or `/dashboard`

### Protected Routes

| Route Pattern | Required Roles |
|--------------|----------------|
| `/dashboard/admin/*` | ADMIN |
| `/dashboard/analytics` | ADMIN, ARTIST |
| `/dashboard/events/create` | ADMIN, ARTIST, ORGANIZER |
| `/dashboard/events/*` | Any authenticated |
| `/dashboard/wallet/*` | Any authenticated |
| `/dashboard/nfts/*` | ADMIN, ARTIST |
| `/dashboard/voting/*` | Any authenticated |
| `/api/admin/*` | ADMIN |

## Database Changes

### UserRole Enum (expanded)
```prisma
enum UserRole {
  ADMIN
  ARTIST
  FAN
  ORGANIZER
  PRODUCTION_HOUSE
}
```

No new models — auth reuses the existing User model. Wallet auto-creation happens in the registration Server Action via a Prisma transaction.

## UI Components

### Login Page (`/login`)
- Email input with validation
- Password input with validation
- Submit button with loading state
- Error alert (invalid credentials, server error)
- Link to register page
- Centered card layout with logo

### Register Page (`/register`)
- Name input
- Email input
- Password input with strength indicator
- Role selector (dropdown with descriptions for each role)
- Submit button with loading state
- Success redirect to dashboard with welcome toast
- Error states for each field
- Centered card layout

### AuthContext
- `user: IUser | null` — current user profile
- `isLoading: boolean` — initial auth check in progress
- `isAuthenticated: boolean` — computed from user
- `login(email, password): Promise<Result>` — calls login Server Action
- `logout(): Promise<void>` — calls logout Server Action
- `refreshProfile(): Promise<void>` — calls getProfile Server Action

## Zod Validation Schemas

### Login Schema
```typescript
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})
```

### Register Schema
```typescript
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.nativeEnum(UserRole),
})
```

## Error Handling

- Server Actions return `{ success: true, data?: T } | { success: false, error: string }`
- Invalid credentials → generic "Invalid email or password" (no user enumeration)
- Duplicate email → "An account with this email already exists"
- Validation errors → per-field error messages from Zod
- Server errors → "Something went wrong. Please try again."
- All errors are sanitized — no raw database or stack trace exposure

## Testing

- Register one test user per role (5 total)
- Test login/logout flow for each
- Test role guard: Fan tries to access Admin dashboard → redirect/403
- Test duplicate email rejection
- Test invalid password rejection
- Test expired JWT handling
