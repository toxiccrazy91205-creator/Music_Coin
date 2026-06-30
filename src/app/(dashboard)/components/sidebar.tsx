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
  Heart,
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
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/artists/verification", label: "Artist Verification", icon: UserCheck },
    { href: "/admin/events/moderation", label: "Event Management", icon: Calendar },
    { href: "/admin/production-houses", label: "Production House Management", icon: Users },
    { href: "/admin/nfts", label: "NFT Management", icon: ImageIcon },
    { href: "/admin/royalties", label: "Royalty Management", icon: DollarSign },
    { href: "/admin/tokens", label: "Token Management", icon: Music },
    { href: "/admin/revenue", label: "Reports", icon: FileText },

    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/wallet", label: "My Wallet", icon: Wallet },
  ],
  ORGANIZER: [
    { href: "/organizer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/organizer/events", label: "Event Management", icon: Calendar },
    { href: "/organizer/events/new", label: "Create Event", icon: PlusCircle },
    { href: "/organizer/tickets", label: "Ticket Management", icon: Ticket },
    { href: "/organizer/attendance", label: "Attendance", icon: QrCode },
    { href: "/organizer/crowdfunding", label: "Crowdfunding", icon: DollarSign },
    { href: "/organizer/live-streams", label: "Live Streams", icon: Activity },

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
    { href: "/artist/support", label: "Support Hub", icon: Heart },

    { href: "/artist/wallet", label: "Wallet", icon: Wallet },
    { href: "/artist/notifications", label: "Notifications", icon: Bell },
  ],
  PRODUCTION_HOUSE: [
    { href: "/production-house", label: "Dashboard", icon: LayoutDashboard },
    { href: "/production-house/contracts", label: "Rights Management", icon: FileText },
    { href: "/production-house/royalties", label: "Royalty Management", icon: DollarSign },
    { href: "/production-house/stakeholders", label: "Stakeholders", icon: Users },
    { href: "/production-house/transactions", label: "Transactions", icon: ListOrdered },

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
    { href: "/fan/subscriptions", label: "Subscriptions", icon: Heart },
    { href: "/fan/notifications", label: "Notifications", icon: Bell },
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
            {(() => {
              const activeItem = [...visibleItems]
                .sort((a, b) => b.href.length - a.href.length)
                .find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))

              return visibleItems.map((item) => {
                const Icon = item.icon
                const isActive = activeItem ? activeItem.href === item.href : pathname === item.href
                return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })})()}
          </nav>

          <Separator />

          <div className={cn("p-4", collapsed && "px-2")}>
            <Button
              variant="outline"
              className={cn(
                "group gap-2 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive",
                collapsed ? "w-12 justify-center px-0" : "w-full justify-start"
              )}
              onClick={async () => {
                await logout()
                setOpen(false)
                router.replace("/login")
              }}
              title={collapsed ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {!collapsed && "Logout"}
            </Button>
          </div>

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
