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
  FileText
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import type { UserRole } from "@/types"

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
            onClick={async () => {
              await logout()
              setOpen(false)
              router.replace("/login")
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
