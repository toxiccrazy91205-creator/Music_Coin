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
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { UserRole } from "@/types"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const roleNav: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { href: "/wallet", label: "My Wallet", icon: Wallet },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  ],
  ORGANIZER: [
    { href: "/organizer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/organizer/wallet", label: "My Wallet", icon: Wallet },
    { href: "/organizer/events", label: "Events", icon: Calendar },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ],
  ARTIST: [
    { href: "/wallet", label: "My Wallet", icon: Wallet },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/nfts", label: "My NFTs", icon: ImageIcon },
  ],
  PRODUCTION_HOUSE: [
    { href: "/wallet", label: "My Wallet", icon: Wallet },
    { href: "/events", label: "Events", icon: Calendar },
  ],
  FAN: [
    { href: "/fan", label: "Browse Events", icon: Search },
    { href: "/fan/wallet", label: "My Wallet", icon: Wallet },
    { href: "/nft-marketplace", label: "Marketplace", icon: ImageIcon },
    { href: "/voting", label: "Voting", icon: Vote },
  ],
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

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

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Music className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Music Coin Festival</span>
        </div>

        {user && (
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
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator />

        <div className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => {
              logout()
              setOpen(false)
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
