# Music Coin Festival Auth & RBAC — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement secure JWT-based authentication with HttpOnly cookies, 5-role RBAC, route protection middleware, auth UI (login/register), and wallet auto-creation on registration.

**Architecture:** Server Actions for auth operations, `jose` for JWT in edge-compatible middleware, `bcryptjs` for password hashing, Zod for input validation, React context for client-side auth state.

**Tech Stack:** Next.js 16, jose ^6, bcryptjs ^2.4, Zod ^4, React Hook Form ^7, TypeScript ^5

## Global Constraints

- JWT secret via `JWT_SECRET` env var (min 32 characters)
- Cookie name: `__session`, HttpOnly, Secure (prod), SameSite=Lax, Path=/, maxAge 7 days
- Password hashing: bcryptjs, 12 salt rounds
- All auth Server Actions return `AuthResult<T>` type: `{ success: true; data: T } | { success: false; error: string }`
- 5 roles: ADMIN (level 100), ORGANIZER (80), ARTIST (60), PRODUCTION_HOUSE (40), FAN (20)
- Wallet auto-creation via Prisma transaction on registration
- UserRole enum must be expanded from 3 to 5 values
- All passwords must clear in error messages (no "invalid email" vs "invalid password" distinction)

---
### Task 1: Install Dependencies and Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma` (UserRole enum)
- Modify: `prisma/seed.ts` (update for 5 roles)
- Modify: `src/types/index.ts` (update enums)

- [ ] **Step 1: Install jose and bcryptjs**

```bash
npm install jose bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Update UserRole enum in Prisma schema**

In `prisma/schema.prisma`, change the UserRole enum:
```prisma
enum UserRole {
  ADMIN
  ARTIST
  FAN
  ORGANIZER
  PRODUCTION_HOUSE
}
```

- [ ] **Step 3: Update TypeScript enums in `src/types/index.ts`**

```typescript
export enum UserRole {
  ADMIN = "ADMIN",
  ARTIST = "ARTIST",
  FAN = "FAN",
  ORGANIZER = "ORGANIZER",
  PRODUCTION_HOUSE = "PRODUCTION_HOUSE",
}
```

Also update the `ROLE_LEVELS` constant (add after enums):
```typescript
export const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.ORGANIZER]: 80,
  [UserRole.ARTIST]: 60,
  [UserRole.PRODUCTION_HOUSE]: 40,
  [UserRole.FAN]: 20,
}
```

- [ ] **Step 4: Run Prisma validate and generate**

```bash
npx prisma validate
npx prisma generate
```

Expected: Both succeed.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma src/types/index.ts
git commit -m "feat: add jose, bcryptjs deps; expand UserRole to 5 roles"
```

---
### Task 2: Create Auth Utility Libraries

**Files:**
- Create: `src/lib/auth/password.ts`
- Create: `src/lib/auth/session.ts`
- Create: `src/lib/auth/validation.ts`
- Create: `src/lib/auth/roles.ts`

**Interfaces:**
- Consumes: `IUser`, `UserRole` from `src/types/index.ts`
- Produces: 
  - `hashPassword(password: string): Promise<string>`
  - `verifyPassword(password: string, hash: string): Promise<boolean>`
  - `signToken(payload: TokenPayload): Promise<string>`
  - `verifyToken(token: string): Promise<TokenPayload>`
  - `getSession(): Promise<TokenPayload | null>`
  - `loginSchema`, `registerSchema` (Zod schemas)
  - `ROLE_LEVELS`, `ROLE_LABELS`, `hasPermission(userRole: UserRole, requiredLevel: number): boolean`
  - `AuthResult<T>` type

- [ ] **Step 1: Create `src/lib/auth/password.ts`**

```typescript
import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

- [ ] **Step 2: Create `src/lib/auth/session.ts`**

```typescript
import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"
import { UserRole } from "@/types"

export interface TokenPayload extends JWTPayload {
  sub: string
  email: string
  role: UserRole
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long")
  }
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: Omit<TokenPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] })
  return payload as unknown as TokenPayload
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("__session")?.value
  if (!token) return null
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("__session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}
```

- [ ] **Step 3: Create `src/lib/auth/validation.ts`**

```typescript
import { z } from "zod"
import { UserRole } from "@/types"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.nativeEnum(UserRole),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
```

- [ ] **Step 4: Create `src/lib/auth/roles.ts`**

```typescript
import { UserRole, ROLE_LEVELS } from "@/types"

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function hasPermission(userRole: UserRole, requiredLevel: number): boolean {
  const userLevel = ROLE_LEVELS[userRole]
  return userLevel >= requiredLevel
}

export function canAccessRoute(userRole: UserRole, routeLevel: number): boolean {
  return hasPermission(userRole, routeLevel)
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrator",
  [UserRole.ARTIST]: "Artist",
  [UserRole.FAN]: "Fan",
  [UserRole.ORGANIZER]: "Event Organizer",
  [UserRole.PRODUCTION_HOUSE]: "Production House",
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Full platform access and user management",
  [UserRole.ARTIST]: "Create events, upload songs, mint NFTs",
  [UserRole.FAN]: "Buy tickets, collect NFTs, vote for artists",
  [UserRole.ORGANIZER]: "Create and manage events, sell tickets",
  [UserRole.PRODUCTION_HOUSE]: "Manage event production and logistics",
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/
git commit -m "feat: add auth utility libraries (password, session, validation, roles)"
```

---
### Task 3: Create Auth Server Actions

**Files:**
- Create: `src/lib/auth/auth.ts`
- Modify: `src/app/(auth)/login/page.tsx` (placeholder)
- Modify: `src/app/(auth)/register/page.tsx` (placeholder)

**Interfaces:**
- Consumes: `hashPassword`, `verifyPassword`, `signToken`, `setSessionCookie`, `clearSessionCookie`, `getSession`, `loginSchema`, `registerSchema`, `AuthResult`
- Produces: `register(input: RegisterInput): Promise<AuthResult<IUser>>`, `login(input: LoginInput): Promise<AuthResult<IUser>>`, `logout(): Promise<AuthResult<null>>`, `getProfile(): Promise<AuthResult<IUser>>`

- [ ] **Step 1: Create `src/lib/auth/auth.ts`**

```typescript
"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { signToken, setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth/session"
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/auth/validation"
import type { AuthResult } from "@/lib/auth/roles"
import type { IUser } from "@/types"
import { Prisma } from "@prisma/client"

function sanitizeUser(user: { password: string; ...rest: Record<string, unknown> }): IUser {
  const { password: _, ...safe } = user as unknown as Record<string, unknown>
  return safe as unknown as IUser
}

export async function register(input: RegisterInput): Promise<AuthResult<IUser>> {
  try {
    const parsed = registerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const { name, email, password, role } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { success: false, error: "An account with this email already exists" }
    }

    const hashed = await hashPassword(password)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, password: hashed, role },
      })

      await tx.wallet.create({
        data: { userId: newUser.id, balance: new Prisma.Decimal(0) },
      })

      return newUser
    })

    const token = await signToken({ sub: user.id, email: user.email, role: user.role })
    await setSessionCookie(token)

    return { success: true, data: sanitizeUser(user) }
  } catch (error) {
    console.error("Register error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export async function login(input: LoginInput): Promise<AuthResult<IUser>> {
  try {
    const parsed = loginSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return { success: false, error: "Invalid email or password" }
    }

    const token = await signToken({ sub: user.id, email: user.email, role: user.role })
    await setSessionCookie(token)

    return { success: true, data: sanitizeUser(user) }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export async function logout(): Promise<AuthResult<null>> {
  try {
    await clearSessionCookie()
    return { success: true, data: null }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export async function getProfile(): Promise<AuthResult<IUser>> {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    })

    if (!user) {
      await clearSessionCookie()
      return { success: false, error: "User not found" }
    }

    return { success: true, data: user as unknown as IUser }
  } catch (error) {
    console.error("GetProfile error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/auth.ts
git commit -m "feat: implement auth Server Actions (register, login, logout, getProfile)"
```

---
### Task 4: Create Next.js Middleware for Route Protection

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create `src/middleware.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { UserRole, ROLE_LEVELS } from "@/types"

const PUBLIC_ROUTES = ["/login", "/register", "/_next/static/", "/_next/image/", "/favicon.ico", "/api/auth/"]

const ROUTE_LEVELS: Record<string, number> = {
  "/dashboard/admin": ROLE_LEVELS[UserRole.ADMIN],
  "/dashboard/analytics": ROLE_LEVELS[UserRole.ARTIST],
  "/dashboard/nfts/create": ROLE_LEVELS[UserRole.ARTIST],
  "/dashboard/events/create": ROLE_LEVELS[UserRole.ORGANIZER],
}

const DEFAULT_ROUTE_LEVEL = ROLE_LEVELS[UserRole.FAN]

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not set")
  return new TextEncoder().encode(secret)
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] })
    return payload as unknown as { sub: string; email: string; role: UserRole }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  if (isPublicRoute) return NextResponse.next()

  const token = request.cookies.get("__session")?.value
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.set("__session", "", { maxAge: 0 })
    return response
  }

  if (pathname.startsWith("/dashboard")) {
    const requiredRole = Object.entries(ROUTE_LEVELS).find(([route]) =>
      pathname.startsWith(route)
    )
    const requiredLevel = requiredRole ? requiredRole[1] : DEFAULT_ROUTE_LEVEL
    const userLevel = ROLE_LEVELS[payload.role]

    if (userLevel < requiredLevel) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add route protection middleware with role-based access control"
```

---
### Task 5: Create AuthContext Provider

**Files:**
- Create: `src/context/AuthContext.tsx`
- Create: `src/context/index.ts`
- Modify: `src/app/layout.tsx` (wrap with AuthProvider)

**Interfaces:**
- Consumes: `IUser` from `@/types`, `login`, `logout`, `getProfile`, `register` from `@/lib/auth/auth`
- Produces: `AuthContextType` with `user`, `isLoading`, `isAuthenticated`, `login`, `logout`, `register`, `refreshProfile`

- [ ] **Step 1: Create `src/context/AuthContext.tsx`**

```typescript
"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { login as loginAction, logout as logoutAction, getProfile as getProfileAction, register as registerAction } from "@/lib/auth/auth"
import type { IUser, UserRole } from "@/types"

interface AuthContextType {
  user: IUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    try {
      const result = await getProfileAction()
      if (result.success) {
        setUser(result.data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAction({ email, password })
    if (result.success) {
      setUser(result.data)
      return { success: true }
    }
    return { success: false, error: result.error }
  }, [])

  const logout = useCallback(async () => {
    await logoutAction()
    setUser(null)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole) => {
    const result = await registerAction({ name, email, password, role })
    if (result.success) {
      setUser(result.data)
      return { success: true }
    }
    return { success: false, error: result.error }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
```

- [ ] **Step 2: Create `src/context/index.ts`**

```typescript
export { AuthProvider, useAuth } from "./AuthContext"
```

- [ ] **Step 3: Modify `src/app/layout.tsx` to wrap with AuthProvider**

Read the current `src/app/layout.tsx` and wrap the `<body>` content with `<AuthProvider>`.

Add import:
```typescript
import { AuthProvider } from "@/context"
```

Wrap:
```tsx
<html>
  <body className="...">
    <AuthProvider>{children}</AuthProvider>
  </body>
</html>
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/context/ src/app/layout.tsx
git commit -m "feat: add AuthContext provider with login/register/logout/refresh"
```

---
### Task 6: Build Auth UI Components (Login, Register, Auth Layout)

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Create `src/app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Update `src/app/(auth)/login/page.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context"
import { loginSchema, type LoginInput } from "@/lib/auth/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setIsSubmitting(true)
    setServerError(null)
    const result = await login(data.email, data.password)
    if (result.success) {
      router.push("/dashboard")
    } else {
      setServerError(result.error ?? "Something went wrong")
    }
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>Sign in to your Music Coin account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
```

- [ ] **Step 3: Update `src/app/(auth)/register/page.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context"
import { registerSchema, type RegisterInput } from "@/lib/auth/validation"
import { UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    setIsSubmitting(true)
    setServerError(null)
    const result = await registerUser(data.name, data.email, data.password, data.role)
    if (result.success) {
      router.push("/dashboard")
    } else {
      setServerError(result.error ?? "Something went wrong")
    }
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>Join the Music Coin Festival platform</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Your name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">I want to join as</Label>
            <Select
              onValueChange={(value) => setValue("role", value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(UserRole).map((role) => (
                  <SelectItem key={role} value={role}>
                    <span className="font-medium">{ROLE_LABELS[role]}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {ROLE_DESCRIPTIONS[role]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("role")} />
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat: add auth UI (login page, register page with role selector, auth layout)"
```

---
### Task 7: Update Seed Script for 5 Roles

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Create updated seed that registers all 5 roles**

Update `prisma/seed.ts` to create one user per role (or skip if DB not available):
- Admin: admin@musiccoin.festival / Admin@123
- Artist: artist@musiccoin.festival / Artist@123
- Fan: fan@musiccoin.festival / Fan@123
- Organizer: organizer@musiccoin.festival / Organizer@123
- Production House: production@musiccoin.festival / Production@123

Use the same pattern: upsert, check wallet, create if missing.

- [ ] **Step 2: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: update seed to register all 5 roles with wallets"
```

---
### Task 8: Write Auth and RBAC Test Script

**Files:**
- Create: `tests/auth.test.ts` or `scripts/test-auth.ts`

- [ ] **Step 1: Install vitest for testing**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create `tests/auth.test.ts`**

This test script will:
1. Test login validation (invalid email, missing password)
2. Test duplicate email registration
3. Test role guard via the `hasPermission` utility for all 5 roles
4. Test that FAN cannot access ADMIN-level routes
5. Test getProfile returns proper user data

```typescript
import { describe, it, expect } from "vitest"
import { hasPermission, canAccessRoute, ROLE_LABELS } from "../src/lib/auth/roles"
import { loginSchema, registerSchema } from "../src/lib/auth/validation"
import { UserRole, ROLE_LEVELS } from "../src/types"

describe("Role Permission System", () => {
  it("should allow ADMIN to access level 100 routes", () => {
    expect(hasPermission(UserRole.ADMIN, 100)).toBe(true)
  })

  it("should deny FAN access to level 100 routes", () => {
    expect(hasPermission(UserRole.FAN, 100)).toBe(false)
  })

  it("should allow ARTIST to access level 60 routes", () => {
    expect(hasPermission(UserRole.ARTIST, 60)).toBe(true)
  })

  it("should deny FAN access to level 60 routes", () => {
    expect(hasPermission(UserRole.FAN, 60)).toBe(false)
  })

  it("should allow ORGANIZER to access level 80 routes", () => {
    expect(hasPermission(UserRole.ORGANIZER, 80)).toBe(true)
  })

  it("should allow PRODUCTION_HOUSE to access level 40 routes", () => {
    expect(hasPermission(UserRole.PRODUCTION_HOUSE, 40)).toBe(true)
  })

  it("should deny ORGANIZER access to level 100 routes", () => {
    expect(hasPermission(UserRole.ORGANIZER, 100)).toBe(false)
  })

  it("should have correct role hierarchy", () => {
    expect(ROLE_LEVELS[UserRole.ADMIN]).toBeGreaterThan(ROLE_LEVELS[UserRole.ORGANIZER])
    expect(ROLE_LEVELS[UserRole.ORGANIZER]).toBeGreaterThan(ROLE_LEVELS[UserRole.ARTIST])
    expect(ROLE_LEVELS[UserRole.ARTIST]).toBeGreaterThan(ROLE_LEVELS[UserRole.PRODUCTION_HOUSE])
    expect(ROLE_LEVELS[UserRole.PRODUCTION_HOUSE]).toBeGreaterThan(ROLE_LEVELS[UserRole.FAN])
  })
})

describe("Validation Schemas", () => {
  describe("Login Schema", () => {
    it("should accept valid login input", () => {
      const result = loginSchema.safeParse({ email: "test@example.com", password: "password123" })
      expect(result.success).toBe(true)
    })

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({ email: "invalid", password: "password123" })
      expect(result.success).toBe(false)
    })

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({ email: "test@example.com", password: "" })
      expect(result.success).toBe(false)
    })
  })

  describe("Register Schema", () => {
    it("should accept valid registration", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "Password1",
        role: UserRole.ARTIST,
      })
      expect(result.success).toBe(true)
    })

    it("should reject short name", () => {
      const result = registerSchema.safeParse({
        name: "A",
        email: "test@example.com",
        password: "Password1",
        role: UserRole.FAN,
      })
      expect(result.success).toBe(false)
    })

    it("should reject weak password (no uppercase)", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "password1",
        role: UserRole.FAN,
      })
      expect(result.success).toBe(false)
    })

    it("should reject weak password (no number)", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "Password",
        role: UserRole.FAN,
      })
      expect(result.success).toBe(false)
    })

    it("should reject invalid role", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "Password1",
        role: "INVALID_ROLE",
      })
      expect(result.success).toBe(false)
    })
  })
})
```

- [ ] **Step 3: Add vitest config and test script to package.json**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/ package.json vitest.config.ts
git commit -m "test: add auth and RBAC unit tests for validation and role permissions"
```
