"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Bell,
  Ticket,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Music,
  Check,
  Trash2,
  AlertCircle,
  Gift,
  Wallet
} from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

export default function FanNotificationsPage() {
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
          // Demo notifications when API not available
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
        id: "demo-1",
        type: "WELCOME",
        message: "Welcome to Music Coin Festival! Your wallet has been credited with 1000 MC bonus.",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: "/fan/wallet"
      },
      {
        id: "demo-2",
        type: "TICKET",
        message: "New events are available! Check out the latest festival events.",
        isRead: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        link: "/fan/events"
      },
      {
        id: "demo-3",
        type: "NFT",
        message: "New NFTs have been listed in the marketplace. Discover unique music NFTs!",
        isRead: true,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        link: "/fan/marketplace"
      },
      {
        id: "demo-4",
        type: "REWARD",
        message: "Vote for your favorite artists and earn MC rewards!",
        isRead: true,
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        link: "/voting"
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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  async function handleMarkAllRead() {
    for (const n of notifications.filter((n) => !n.isRead)) {
      await handleMarkAsRead(n.id)
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      })
    } catch {}
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications

  const unreadCount = notifications.filter((n) => !n.isRead).length

  function getNotificationIcon(type: string) {
    switch (type) {
      case "TICKET": return <Ticket className="size-5 text-primary" />
      case "NFT": return <ShoppingCart className="size-5 text-purple-500" />
      case "REWARD": return <Gift className="size-5 text-amber-500" />
      case "WELCOME": return <Wallet className="size-5 text-green-500" />
      case "EVENT": return <Calendar className="size-5 text-blue-500" />
      default: return <Bell className="size-5 text-muted-foreground" />
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading notifications...</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-lg border p-1">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
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

      {/* Notifications List */}
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
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${!notification.isRead ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm ${!notification.isRead ? "font-medium" : ""}`}>
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {notification.link && (
                      <Link href={notification.link}>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">View Details</Button>
                      </Link>
                    )}
                    {!notification.isRead && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-destructive"
                      onClick={() => handleDelete(notification.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="flex size-2 shrink-0 rounded-full bg-primary mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
