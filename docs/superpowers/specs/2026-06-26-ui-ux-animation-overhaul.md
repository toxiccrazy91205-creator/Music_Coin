# UI/UX + Animation Overhaul

**Date:** 2026-06-26
**Project:** Music Coin Demo
**Goal:** Fix lag, add smooth animations, improve UI/UX, fix bugs — without changing any existing logic or architecture.

---

## 1. Animations (framer-motion)

Install `framer-motion` and create 5 reusable wrapper components in `src/components/ui/`:

| Component | Effect | Applied To |
|---|---|---|
| `FadeIn` | Fade + slight Y offset on mount | Dashboard stat cards, page headers |
| `SlideUp` | Cards slide up into view | Event/NFT cards, list items |
| `StaggerContainer` | Children stagger in sequence | Table rows, grid layouts |
| `PageTransition` | Page-level fade transition | Each dashboard page wrapper |
| `ScaleOnHover` | Card lifts & shadows on hover | All cards, sidebar items |

All wrap existing JSX. Pure `<motion.div>` on top of existing content — zero logic changes.

### File: `src/components/ui/fade-in.tsx`
```tsx
"use client"
import { motion } from "framer-motion"
export function FadeIn({ children, ...props }) { ... }
```
### File: `src/components/ui/slide-up.tsx`
### File: `src/components/ui/stagger-container.tsx`
### File: `src/components/ui/page-transition.tsx`
### File: `src/components/ui/scale-on-hover.tsx`

### Apply to pages:
- **Sidebar** — ScaleOnHover on nav items, FadeIn on the sidebar itself
- **Dashboard pages** — PageTransition wrapper
- **Stat cards** (all dashboards) — FadeIn + ScaleOnHover
- **Tables** — StaggerContainer + SlideUp on rows
- **Event/NFT cards** — SlideUp
- **Buttons** — ScaleOnHover press effect
- **Loading skeletons** — animate-pulse (existing, enhance with fade-in)

---

## 2. UI/UX Improvements

### 2a. Dark Mode Toggle
- Install `next-themes`
- Add `<ThemeProvider>` in root layout
- Create `<ThemeToggle>` component (sun/moon icon button)
- Place in sidebar header next to the logo
- Dark mode CSS variables already defined in globals.css

### 2b. Responsive Sidebar
- On `< lg` screens: sidebar collapses to icon-only (w-16) with tooltips
- Smooth expand/collapse via framer-motion `animate={{ width }}`
- Toggle button visible on mobile
- Current behavior (full width on lg+) unchanged

### 2c. Brand Colors (Music Industry Palette)
Real music-industry inspired colors — not generic, not "AI-made":

- **Vinyl Black**: `#1a1a2e` (deep midnight)
- **Stage Gold**: `#d4a853` (warm spotlight gold)
- **Amplifier Orange**: `#e8590c` (punchy accent)
- **Neon Violet**: `#7c3aed` (festival lighting)
- **Studio Blue**: `#1e3a5f` (recording studio mood)
- **Rosewood**: `#8b2252` (vintage richness)

Applied as CSS variable overrides in `globals.css` — `--color-primary`, `--color-accent`, etc. alongside the existing neutral palette. Music mood without looking synthetic.

### 2d. Mobile-Responsive Tables
- On `sm` screens: table rows → stacked card layout
- Desktop: unchanged table
- Pure CSS using responsive utility classes (`hidden sm:table-cell`, `block sm:hidden`)

---

## 3. Bug Fixes

### 3a. Error Boundaries
- Add `error.tsx` to each route segment:
  - `app/(auth)/error.tsx`
  - `app/(dashboard)/error.tsx` (catch-all for dashboard)
  - `app/error.tsx` (root catch-all)
- Each shows: friendly message, retry button, optional "Go Home" link

### 3b. `loadNfts` Re-render Loop
- File: `src/app/(dashboard)/nft-marketplace/page.tsx`
- `loadNfts` defined outside component + used as `useEffect` dependency
- Fix: wrap in `useCallback` and move inside component

### 3c. Silent Catch Blocks
Files with empty/blank catch blocks:
- `src/app/(dashboard)/voting/page.tsx` (lines 33, 42)
- `src/app/(dashboard)/production-house/page.tsx` (line 30)
- `src/app/(dashboard)/admin/page.tsx` (line 31)
- `src/app/(dashboard)/nft-marketplace/page.tsx`
- `src/app/(dashboard)/admin/transactions/page.tsx`
- `src/app/(dashboard)/admin/nfts/page.tsx`

Fix: add `import { toast } from "sonner"` and `toast.error("Failed to load data")`.

### 3d. Console Statement Cleanup
- Remove `console.log` and `console.error` from client components
- Keep in API routes (server-side logging is fine)
- Key files: AuthContext.tsx, all dashboard pages, lib/email/sender.ts, lib/auth/auth.ts

---

## Files Changed

### New files:
- `src/components/ui/fade-in.tsx`
- `src/components/ui/slide-up.tsx`
- `src/components/ui/stagger-container.tsx`
- `src/components/ui/page-transition.tsx`
- `src/components/ui/scale-on-hover.tsx`
- `src/components/ui/theme-toggle.tsx`
- `src/app/(auth)/error.tsx`
- `src/app/(dashboard)/error.tsx`
- `src/app/error.tsx`

### Modified files:
- `src/app/globals.css` — brand colors, table responsive styles
- `src/app/layout.tsx` — ThemeProvider
- `src/app/(dashboard)/layout.tsx` — PageTransition
- `src/app/(dashboard)/components/sidebar.tsx` — animations, theme toggle, responsive collapse
- `src/app/(dashboard)/voting/page.tsx` — toast on catch
- `src/app/(dashboard)/nft-marketplace/page.tsx` — useCallback fix + toast
- `src/app/(dashboard)/production-house/page.tsx` — toast on catch
- `src/app/(dashboard)/admin/page.tsx` — toast on catch
- `src/app/(dashboard)/admin/transactions/page.tsx` — toast on catch
- `src/app/(dashboard)/admin/nfts/page.tsx` — toast on catch
- `src/app/(dashboard)/fan/dashboard/page.tsx` — console removal
- `src/context/AuthContext.tsx` — console removal
- `src/lib/auth/auth.ts` — console removal
- `src/lib/email/sender.ts` — console removal
- All dashboard pages — wrap in PageTransition
- `package.json` — add framer-motion + next-themes

---

## Non-Goals
- No Server Component conversion
- No data fetching pattern changes
- No logic rewrites
- No schema changes
- No new pages
