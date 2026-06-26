"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Bell, Check, Shield, DollarSign, Users, Music, TrendingUp,
  AlertCircle, Gift
} from "lucide-react"

interface Notification {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

export default function ArtistNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications")
        const data = await res.json()
        if (data.success) {
          setNotifications(data.data || [])
        } else {
          setNotifications(getDemoNotifications())
        }
      } catch {
        setNotifications(getDemoNotifications())
      } finally {
        setLoading(false)
      }
    }
    loadNotifications()
  }, [])

  function getDemoNotifications(): Notification[] {
    return [
      {
        id: "art-demo-1",
        type: "VERIFICATION",
        message: "Complete your artist verification to unlock all features including event creation and NFT minting.",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: "/artist/verification"
      },
      {
        id: "art-demo-2",
        type: "PAYMENT",
        message: "Your wallet has been credited with the welcome bonus. Start minting NFTs!",
        isRead: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        link: "/artist/wallet"
      },
      {
        id: "art-demo-3",
        type: "FAN",
        message: "Fans can vote for you! Check the voting page to see your rankings.",
        isRead: true,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        link: "/voting"
      },
      {
        id: "art-demo-4",
        type: "NFT",
        message: "New NFTs are trending in the marketplace. Consider minting new music NFTs!",
        isRead: true,
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        link: "/artist/nfts"
      },
    ]
  }

  async function handleMarkAsRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, isRead: true })
      })
    } catch {}
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  async function handleMarkAllRead() {
    for (const n of notifications.filter((n) => !n.isRead)) {
      await handleMarkAsRead(n.id)
    }
  }

  const filteredNotifications = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length

  function getNotificationIcon(type: string) {
    switch (type) {
      case "VERIFICATION": return <Shield className="size-5 text-primary" />
      case "PAYMENT": return <DollarSign className="size-5 text-green-500" />
      case "FAN": return <Users className="size-5 text-blue-500" />
      case "NFT": return <Music className="size-5 text-purple-500" />
      case "ROYALTY": return <TrendingUp className="size-5 text-amber-500" />
      default: return <Bell className="size-5 text-muted-foreground" />
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading notifications...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-lg border p-1">
            <Button variant={filter === "all" ? "default" : "ghost"} size="sm" onClick={() => setFilter("all")}>All</Button>
            <Button variant={filter === "unread" ? "default" : "ghost"} size="sm" onClick={() => setFilter("unread")}>
              Unread ({unreadCount})
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <Check className="mr-1 size-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm text-muted-foreground">
              {filter === "unread" ? "All notifications are read" : "You have no notifications yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((n) => (
            <Card key={n.id} className={!n.isRead ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted shrink-0">
                  {getNotificationIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? "font-medium" : ""}`}>{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {n.link && (
                      <Link href={n.link}>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">View Details</Button>
                      </Link>
                    )}
                    {!n.isRead && (
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => handleMarkAsRead(n.id)}>
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
                {!n.isRead && <div className="flex size-2 shrink-0 rounded-full bg-primary mt-2" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
