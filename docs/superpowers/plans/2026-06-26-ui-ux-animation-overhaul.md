# UI/UX + Animation Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add framer-motion animations, dark mode toggle, brand theming, responsive sidebar, error boundaries, and fix bugs — without changing any existing logic or data flow.

**Architecture:** Pure additive changes — new animation wrapper components, new UI components, CSS overrides, and targeted surgical bug fixes. Zero page rewrites, zero data flow changes, zero Server Component conversions.

**Tech Stack:** framer-motion, next-themes, sonner (already installed), shadcn/ui, Tailwind CSS v4

## Global Constraints

- Do NOT change any existing business logic or data fetching patterns
- Do NOT convert any "use client" pages to Server Components
- Do NOT modify any API route logic
- All new components go in `src/components/ui/`
- Error boundaries must not catch server-side errors (client boundaries only)
- Console statements removed only from client components (keep in API routes)
- All existing tests must continue passing
- TypeScript must compile with zero errors

---

## File Structure

### New files:
- `src/components/ui/fade-in.tsx` — Fade + Y offset entrance animation
- `src/components/ui/slide-up.tsx` — Card slide-up entrance
- `src/components/ui/stagger-container.tsx` — Staggered children animation
- `src/components/ui/page-transition.tsx` — Page-level fade transition
- `src/components/ui/scale-on-hover.tsx` — Hover scale + shadow effect
- `src/components/ui/theme-toggle.tsx` — Dark mode toggle button
- `src/app/error.tsx` — Root error boundary
- `src/app/(auth)/error.tsx` — Auth error boundary
- `src/app/(dashboard)/error.tsx` — Dashboard error boundary

### Modified files:
- `package.json` — add framer-motion and next-themes
- `src/app/globals.css` — brand color CSS variables, responsive table styles
- `src/app/layout.tsx` — add ThemeProvider + suppressHydrationWarning
- `src/app/(dashboard)/layout.tsx` — add PageTransition wrapper
- `src/app/(dashboard)/components/sidebar.tsx` — animations, theme toggle, responsive collapse
- `src/app/(dashboard)/admin/page.tsx` — PageTransition, toast on catch
- `src/app/(dashboard)/admin/nfts/page.tsx` — toast on catch
- `src/app/(dashboard)/admin/transactions/page.tsx` — toast on catch
- `src/app/(dashboard)/voting/page.tsx` — toast on catch
- `src/app/(dashboard)/nft-marketplace/page.tsx` — useCallback fix + toast on catch
- `src/app/(dashboard)/production-house/page.tsx` — toast on catch
- `src/app/(dashboard)/fan/dashboard/page.tsx` — console cleanup
- `src/context/AuthContext.tsx` — console cleanup
- `src/lib/auth/auth.ts` — console cleanup
- `src/lib/email/sender.ts` — console cleanup
- All dashboard pages under `(dashboard)` — wrap in PageTransition

---

### Task 1: Install dependencies + brand colors + responsive tables

**Files:**
- Modify: `package.json`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Install framer-motion and next-themes**

```bash
npm install framer-motion next-themes
```

- [ ] **Step 2: Add brand music-palette CSS variables to globals.css**

Add these after the existing `:root` block in `src/app/globals.css`:

```css
/* Music Industry Brand Palette */
:root {
  --brand-vinyl: oklch(0.12 0.03 290);
  --brand-stage-gold: oklch(0.72 0.13 85);
  --brand-amp-orange: oklch(0.58 0.19 45);
  --brand-neon-violet: oklch(0.45 0.23 280);
  --brand-studio-blue: oklch(0.25 0.06 260);
  --brand-rosewood: oklch(0.32 0.13 350);
}
```

Update the `:root` primary/accent to use brand colors:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.12 0.03 290);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.72 0.13 85);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.45 0.23 280);
  --chart-1: oklch(0.72 0.13 85);
  --chart-2: oklch(0.58 0.19 45);
  --chart-3: oklch(0.45 0.23 280);
  --chart-4: oklch(0.25 0.06 260);
  --chart-5: oklch(0.32 0.13 350);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.12 0.03 290);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}
```

Update `.dark` block to use brand-appropriate dark variants:

```css
.dark {
  --background: oklch(0.10 0.02 290);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.15 0.02 290);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.15 0.02 290);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.72 0.13 85);
  --primary-foreground: oklch(0.10 0.02 290);
  --secondary: oklch(0.25 0.05 260);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.20 0.03 290);
  --muted-foreground: oklch(0.65 0.05 290);
  --accent: oklch(0.58 0.19 45);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.45 0.23 280);
  --chart-1: oklch(0.72 0.13 85);
  --chart-2: oklch(0.58 0.19 45);
  --chart-3: oklch(0.45 0.23 280);
  --chart-4: oklch(0.25 0.06 260);
  --chart-5: oklch(0.32 0.13 350);
  --sidebar: oklch(0.12 0.03 290);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.72 0.13 85);
  --sidebar-primary-foreground: oklch(0.12 0.03 290);
  --sidebar-accent: oklch(0.20 0.03 290);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}
```

- [ ] **Step 3: Add responsive table CSS to globals.css**

Add at the bottom of `globals.css`:

```css
/* Mobile responsive tables */
@layer utilities {
  .table-grid {
    @apply grid grid-cols-1 gap-3 sm:hidden;
  }
  .table-grid-item {
    @apply flex items-center justify-between rounded-lg border bg-card p-4 text-sm;
  }
  .table-grid-label {
    @apply font-medium text-muted-foreground;
  }
  .table-grid-value {
    @apply text-right font-medium;
  }
}
```

- [ ] **Step 4: Verify type check**

```bash
npx tsc --noEmit
```
Expected: zero errors

---

### Task 2: Create animation components

**Files:**
- Create: `src/components/ui/fade-in.tsx`
- Create: `src/components/ui/slide-up.tsx`
- Create: `src/components/ui/stagger-container.tsx`
- Create: `src/components/ui/page-transition.tsx`
- Create: `src/components/ui/scale-on-hover.tsx`

All follow the same pattern: "use client", import `motion` from framer-motion, wrap children, accept all standard div attributes via `HTMLAttributes<HTMLDivElement>` + framer-motion props.

- [ ] **Step 1: Create FadeIn**

```tsx
"use client"

import { motion } from "framer-motion"
import type { HTMLAttributes } from "react"

interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
  delay?: number
  duration?: number
  y?: number
}

export function FadeIn({ children, delay = 0, duration = 0.5, y = 20, className, ...props }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Create SlideUp**

```tsx
"use client"

import { motion } from "framer-motion"
import type { HTMLAttributes } from "react"

interface SlideUpProps extends HTMLAttributes<HTMLDivElement> {
  delay?: number
  duration?: number
  distance?: number
}

export function SlideUp({ children, delay = 0, duration = 0.4, distance = 40, className, ...props }: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 3: Create StaggerContainer**

```tsx
"use client"

import { motion } from "framer-motion"
import type { HTMLAttributes } from "react"

interface StaggerContainerProps extends HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number
}

export function StaggerContainer({ children, staggerDelay = 0.05, className, ...props }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: staggerDelay } } }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}
```

- [ ] **Step 4: Create PageTransition**

```tsx
"use client"

import { motion } from "framer-motion"
import type { HTMLAttributes } from "react"

interface PageTransitionProps extends HTMLAttributes<HTMLDivElement> {
  duration?: number
}

export function PageTransition({ children, duration = 0.3, className, ...props }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, ease: "easeInOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 5: Create ScaleOnHover**

```tsx
"use client"

import { motion } from "framer-motion"
import type { HTMLAttributes, ElementType } from "react"

interface ScaleOnHoverProps extends HTMLAttributes<HTMLDivElement> {
  scale?: number
  as?: ElementType
}

export function ScaleOnHover({ children, scale = 1.02, className, as: Component = "div", ...props }: ScaleOnHoverProps) {
  const MotionComponent = motion.create(Component as any)

  return (
    <MotionComponent
      whileHover={{ scale, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  )
}
```

- [ ] **Step 6: Verify type check**

```bash
npx tsc --noEmit
```
Expected: zero errors

---

### Task 3: Add error boundaries

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/(auth)/error.tsx`
- Create: `src/app/(dashboard)/error.tsx`

- [ ] **Step 1: Create root error.tsx**

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">An unexpected error occurred. Please try again.</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = "/"}>Go Home</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create auth error.tsx**

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Authentication Error</h1>
        <p className="text-muted-foreground">Something went wrong during authentication.</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = "/login"}>Back to Login</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create dashboard error.tsx**

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Dashboard Error</h1>
        <p className="text-muted-foreground">Something went wrong loading this page.</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = "/login"}>Go Home</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify type check**

```bash
npx tsc --noEmit
```
Expected: zero errors

---

### Task 4: Add dark mode support (ThemeProvider + ThemeToggle)

**Files:**
- Modify: `src/app/layout.tsx` — add ThemeProvider + suppressHydrationWarning
- Create: `src/components/ui/theme-toggle.tsx`

- [ ] **Step 1: Add ThemeProvider to root layout**

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create ThemeToggle component**

```tsx
"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-9 w-9" />

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
```

- [ ] **Step 3: Verify type check**

```bash
npx tsc --noEmit
```
Expected: zero errors

---

### Task 5: Sidebar animations + theme toggle + responsive collapse

**Files:**
- Modify: `src/app/(dashboard)/components/sidebar.tsx`

- [ ] **Step 1: Update sidebar imports and add animation + theme toggle**

Replace the sidebar content with animated version. Add theme toggle in the header bar. Add ScaleOnHover to nav items. Add FadeIn to sidebar itself. Add responsive icon-only collapse for tablet.

Updated `src/app/(dashboard)/components/sidebar.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/useAuth"
import { ROLE_LABELS } from "@/types"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Wallet,
  Calendar,
  BarChart3,
  ImageIcon,
  Vote,
  LogOut,
  Menu,
  X,
  Music,
  Search,
  Users,
  UserCheck,
  ShieldAlert,
  Activity,
  ListOrdered,
  DollarSign,
  Shield,
  PieChart,
  Server,
  Bot,
  Settings,
  Ticket,
  QrCode,
  Mic2,
  Bell,
  PlusCircle,
  MessageCircle,
  FileText,
  ChevronLeft,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import type { UserRole } from "@/types"
import { FadeIn } from "@/components/ui/fade-in"
import { ScaleOnHover } from "@/components/ui/scale-on-hover"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const roleNav: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/artists/verification", label: "Verification", icon: UserCheck },
    { href: "/admin/events/moderation", label: "Event Moderation", icon: ShieldAlert },
    { href: "/admin/nfts", label: "NFT Monitoring", icon: Activity },
    { href: "/admin/transactions", label: "Transactions", icon: ListOrdered },
    { href: "/admin/revenue", label: "Revenue Reports", icon: DollarSign },
    { href: "/admin/security", label: "Security", icon: Shield },
    { href: "/admin/analytics", label: "Analytics", icon: PieChart },
    { href: "/admin/system/health", label: "System Health", icon: Server },
    { href: "/admin/ai", label: "AI Dashboard", icon: Bot },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/wallet", label: "My Wallet", icon: Wallet },
  ],
  ORGANIZER: [
    { href: "/organizer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/organizer/events", label: "Event Management", icon: Calendar },
    { href: "/organizer/events/new", label: "Create Event", icon: PlusCircle },
    { href: "/organizer/tickets", label: "Ticket Management", icon: Ticket },
    { href: "/organizer/attendance", label: "Attendance", icon: QrCode },
    { href: "/organizer/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/organizer/payments", label: "Payments", icon: DollarSign },
    { href: "/organizer/artists", label: "Artist Management", icon: Mic2 },
    { href: "/organizer/notifications", label: "Notifications", icon: Bell },
    { href: "/organizer/wallet", label: "Wallet", icon: Wallet },
  ],
  ARTIST: [
    { href: "/artist/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/artist/profile", label: "My Profile", icon: UserCheck },
    { href: "/artist/verification", label: "Verification", icon: ShieldAlert },
    { href: "/artist/nfts", label: "NFT Management", icon: ImageIcon },
    { href: "/artist/royalties", label: "Royalties", icon: DollarSign },
    { href: "/artist/fans", label: "Fan Management", icon: Users },
    { href: "/artist/community", label: "Community", icon: MessageCircle },
    { href: "/artist/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/artist/wallet", label: "Wallet", icon: Wallet },
    { href: "/artist/notifications", label: "Notifications", icon: Bell },
  ],
  PRODUCTION_HOUSE: [
    { href: "/production-house", label: "Dashboard", icon: LayoutDashboard },
    { href: "/production-house/contracts", label: "Rights Management", icon: FileText },
    { href: "/production-house/royalties", label: "Royalty Management", icon: DollarSign },
    { href: "/production-house/stakeholders", label: "Stakeholders", icon: Users },
    { href: "/production-house/transactions", label: "Transactions", icon: ListOrdered },
    { href: "/production-house/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/production-house/profile", label: "Profile Settings", icon: Settings },
    { href: "/wallet", label: "My Wallet", icon: Wallet },
  ],
  FAN: [
    { href: "/fan/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/fan/profile", label: "My Profile", icon: UserCheck },
    { href: "/fan/events", label: "Browse Events", icon: Search },
    { href: "/fan/tickets", label: "My Tickets", icon: Ticket },
    { href: "/fan/marketplace", label: "NFT Marketplace", icon: ImageIcon },
    { href: "/fan/wallet", label: "Wallet", icon: Wallet },
    { href: "/fan/token", label: "MusicCoin Token", icon: Music },
    { href: "/fan/community", label: "Community", icon: Users },
    { href: "/fan/notifications", label: "Notifications", icon: Bell },
    { href: "/voting", label: "Voting", icon: Vote },
  ],
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = user ? roleNav[user.role] || [] : []

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <FadeIn>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card transition-all duration-300",
            collapsed ? "w-16" : "w-64",
            open ? "translate-x-0" : "-translate-x-full",
            "lg:translate-x-0",
          )}
        >
          <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center px-2" : "gap-2 px-6")}>
            <Music className="h-6 w-6 text-primary shrink-0" />
            {!collapsed && (
              <>
                <span className="text-lg font-bold truncate">Music Coin Festival</span>
                <div className="ml-auto">
                  <ThemeToggle />
                </div>
              </>
            )}
            {collapsed && (
              <div className="absolute -right-3 top-4">
                <ThemeToggle />
              </div>
            )}
          </div>

          {user && !collapsed && (
            <div className="border-b px-6 py-4">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          )}

          <nav className="flex-1 space-y-1 px-3 py-4">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <ScaleOnHover key={item.href} scale={1.03}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-2",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </ScaleOnHover>
              )
            })}
          </nav>

          <Separator />

          <div className={cn("p-4", collapsed && "px-2")}>
            <Button
              variant="outline"
              className={cn("gap-2", collapsed ? "w-12 justify-center px-0" : "w-full justify-start")}
              onClick={async () => {
                await logout()
                setOpen(false)
                router.replace("/login")
              }}
              title={collapsed ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && "Logout"}
            </Button>
          </div>

          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground hover:text-foreground transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
          </button>
        </aside>
      </FadeIn>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify type check**

```bash
npx tsc --noEmit
```
Expected: zero errors

---

### Task 6: Apply PageTransition to all dashboard pages

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: All dashboard page.tsx files (wrap content in PageTransition)

- [ ] **Step 1: Wrap dashboard layout content in PageTransition**

Update `src/app/(dashboard)/layout.tsx`:

```tsx
import { Sidebar } from "./components/sidebar"
import { PageTransition } from "@/components/ui/page-transition"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Wrap admin pages content**

For each admin page, wrap the outer div's content in `<PageTransition>`. Pages to modify:
- `src/app/(dashboard)/admin/page.tsx` — wrap existing return content in PageTransition
- `src/app/(dashboard)/admin/users/page.tsx`
- `src/app/(dashboard)/admin/artists/verification/page.tsx`
- `src/app/(dashboard)/admin/events/moderation/page.tsx`
- `src/app/(dashboard)/admin/nfts/page.tsx`
- `src/app/(dashboard)/admin/transactions/page.tsx`
- `src/app/(dashboard)/admin/revenue/page.tsx`
- `src/app/(dashboard)/admin/security/page.tsx`
- `src/app/(dashboard)/admin/analytics/page.tsx`
- `src/app/(dashboard)/admin/system/health/page.tsx`
- `src/app/(dashboard)/admin/ai/page.tsx`
- `src/app/(dashboard)/admin/settings/page.tsx`

Pattern for each: replace `<div className="space-y-6">` with `<PageTransition><div className="space-y-6">` and close `</PageTransition>` before the end.

Skip admin pages that don't exist or have unusual structures.

- [ ] **Step 3: Wrap organizer pages**

Same pattern for:
- `src/app/(dashboard)/organizer/page.tsx`
- `src/app/(dashboard)/organizer/events/page.tsx`
- `src/app/(dashboard)/organizer/events/new/page.tsx`
- `src/app/(dashboard)/organizer/events/[id]/edit/page.tsx`
- `src/app/(dashboard)/organizer/tickets/page.tsx`
- `src/app/(dashboard)/organizer/attendance/page.tsx`
- `src/app/(dashboard)/organizer/analytics/page.tsx`
- `src/app/(dashboard)/organizer/payments/page.tsx`
- `src/app/(dashboard)/organizer/artists/page.tsx`
- `src/app/(dashboard)/organizer/notifications/page.tsx`
- `src/app/(dashboard)/organizer/wallet/page.tsx`

- [ ] **Step 4: Wrap artist pages**

- `src/app/(dashboard)/artist/dashboard/page.tsx`
- `src/app/(dashboard)/artist/profile/page.tsx`
- `src/app/(dashboard)/artist/verification/page.tsx`
- `src/app/(dashboard)/artist/nfts/page.tsx`
- `src/app/(dashboard)/artist/royalties/page.tsx`
- `src/app/(dashboard)/artist/fans/page.tsx`
- `src/app/(dashboard)/artist/community/page.tsx`
- `src/app/(dashboard)/artist/analytics/page.tsx`
- `src/app/(dashboard)/artist/notifications/page.tsx`
- `src/app/(dashboard)/artist/wallet/page.tsx`

- [ ] **Step 5: Wrap fan pages**

- `src/app/(dashboard)/fan/page.tsx`
- `src/app/(dashboard)/fan/dashboard/page.tsx`
- `src/app/(dashboard)/fan/profile/page.tsx`
- `src/app/(dashboard)/fan/events/page.tsx`
- `src/app/(dashboard)/fan/events/[id]/page.tsx`
- `src/app/(dashboard)/fan/tickets/page.tsx`
- `src/app/(dashboard)/fan/marketplace/page.tsx`
- `src/app/(dashboard)/fan/wallet/page.tsx`
- `src/app/(dashboard)/fan/token/page.tsx`
- `src/app/(dashboard)/fan/community/page.tsx`
- `src/app/(dashboard)/fan/notifications/page.tsx`

- [ ] **Step 6: Wrap production house pages**

- `src/app/(dashboard)/production-house/page.tsx`
- `src/app/(dashboard)/production-house/contracts/page.tsx`
- `src/app/(dashboard)/production-house/royalties/page.tsx`
- `src/app/(dashboard)/production-house/stakeholders/page.tsx`
- `src/app/(dashboard)/production-house/transactions/page.tsx`
- `src/app/(dashboard)/production-house/analytics/page.tsx`
- `src/app/(dashboard)/production-house/profile/page.tsx`
- `src/app/(dashboard)/production-house/notifications/page.tsx`

- [ ] **Step 7: Wrap shared dashboard pages**

- `src/app/(dashboard)/wallet/page.tsx`
- `src/app/(dashboard)/voting/page.tsx`
- `src/app/(dashboard)/nft-marketplace/page.tsx`
- `src/app/(dashboard)/events/page.tsx`
- `src/app/(dashboard)/nfts/page.tsx`

- [ ] **Step 8: Verify type check**

```bash
npx tsc --noEmit
```
Expected: zero errors

---

### Task 7: Fix bugs — silent catches → toast, loadNfts loop, console cleanup

**Files:**
- Modify: `src/app/(dashboard)/voting/page.tsx`
- Modify: `src/app/(dashboard)/nft-marketplace/page.tsx`
- Modify: `src/app/(dashboard)/production-house/page.tsx`
- Modify: `src/app/(dashboard)/admin/page.tsx`
- Modify: `src/app/(dashboard)/admin/transactions/page.tsx`
- Modify: `src/app/(dashboard)/admin/nfts/page.tsx`
- Modify: `src/app/(dashboard)/fan/dashboard/page.tsx`
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/lib/auth/auth.ts`
- Modify: `src/lib/email/sender.ts`

- [ ] **Step 1: Fix voting page silent catches**

In `src/app/(dashboard)/voting/page.tsx`, replace empty catch blocks:

Line 33: `catch {}` → `catch { toast.error("Failed to load results") }`
Line 42: `catch {}` → `catch { toast.error("Failed to load artists") }`

Add import: `import { toast } from "sonner"` at top.

- [ ] **Step 2: Fix nft-marketplace loadNfts re-render loop**

In `src/app/(dashboard)/nft-marketplace/page.tsx`:
1. Move `loadNfts` inside the component function
2. Wrap it in `useCallback` with empty deps
3. Add `import { useCallback } from "react"` to the react import
4. Add catch with toast error

```tsx
import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
```

Change `loadNfts` to:

```tsx
const loadNfts = useCallback(async () => {
  try {
    const res = await getNftsAction()
    if (res.success) setNfts(res.data as unknown as NftItem[])
  } catch {
    toast.error("Failed to load NFTs")
  }
  setLoading(false)
}, [])
```

Keep existing `useEffect` unchanged (now `[loadNfts]` is a stable reference via useCallback).

- [ ] **Step 3: Fix production-house page silent catch**

In `src/app/(dashboard)/production-house/page.tsx`, find `.catch(() => ...)` or `catch {}` and add `import { toast } from "sonner"` + `toast.error(...)`.

- [ ] **Step 4: Fix admin dashboard silent catch**

In `src/app/(dashboard)/admin/page.tsx`:
- `.catch(() => setLoading(false))` → `.catch(() => { setLoading(false); toast.error("Failed to load analytics") })`
- Add `import { toast } from "sonner"`

- [ ] **Step 5: Fix admin transactions and NFTs silent catches**

Check `src/app/(dashboard)/admin/transactions/page.tsx` and `src/app/(dashboard)/admin/nfts/page.tsx` — add toast on any empty catch.

- [ ] **Step 6: Console cleanup — AuthContext.tsx**

In `src/context/AuthContext.tsx`:
- Line 77: remove `console.error(e)` from catch block (or replace with empty catch)

- [ ] **Step 7: Console cleanup — lib/auth/auth.ts**

In `src/lib/auth/auth.ts`:
- Remove `console.error` calls (keep as empty catch or remove the log lines)
- These are server actions — logs are less harmful but still clutter

- [ ] **Step 8: Console cleanup — lib/email/sender.ts**

In `src/lib/email/sender.ts`:
- Lines 3-5: remove `console.log` statements (email simulation)

- [ ] **Step 9: Console cleanup — fan/dashboard/page.tsx**

In `src/app/(dashboard)/fan/dashboard/page.tsx`:
- Remove `console.error("Dashboard load error:", error)`

- [ ] **Step 10: Verify type check**

```bash
npx tsc --noEmit
```
Expected: zero errors

---

### Task 8: Final verification

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: zero errors

- [ ] **Step 2: Run tests**

```bash
npx vitest run
```
Expected: all 50 tests passing

- [ ] **Step 3: Build**

```bash
npx next build
```
Expected: clean build with zero errors
