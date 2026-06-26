"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/features/notifications/notifications.actions"
import { Bell, Ticket, Calendar, AlertTriangle, CheckCircle2, Info } from "lucide-react"

interface NotificationItem {
  id: string
  message: string
  isRead: boolean
  createdAt: string
}

function getIcon(_message: string) {
  const msg = _message.toLowerCase()
  if (msg.includes("ticket") || msg.includes("sold")) return <Ticket className="h-5 w-5 text-indigo-500" />
  if (msg.includes("event") || msg.includes("approve")) return <Calendar className="h-5 w-5 text-green-500" />
  if (msg.includes("warning") || msg.includes("capacity")) return <AlertTriangle className="h-5 w-5 text-amber-500" />
  if (msg.includes("payout") || msg.includes("withdrawal")) return <Info className="h-5 w-5 text-blue-500" />
  return <Bell className="h-5 w-5 text-muted-foreground" />
}

function getTitle(message: string) {
  if (message.length > 60) return message.slice(0, 60) + "..."
  return message
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? "s" : ""} ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await getNotificationsAction()
    if (res.success) setNotifications(res.data as unknown as NotificationItem[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleMarkAllRead() {
    await markAllNotificationsReadAction()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  async function handleMarkRead(id: string) {
    await markNotificationReadAction(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading notifications...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "Stay updated on your events"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="shrink-0" onClick={handleMarkAllRead}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Your notification history</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Bell className="mx-auto mb-3 size-10 opacity-40" />
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex gap-4 p-6 transition-colors hover:bg-muted/30 ${!notif.isRead ? "bg-primary/5" : ""}`}
                >
                  <div
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      !notif.isRead ? "bg-background shadow-sm" : "bg-muted"
                    }`}
                  >
                    {getIcon(notif.message)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-base font-semibold ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {getTitle(notif.message)}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {getTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    {!notif.isRead && (
                      <div className="mt-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary"
                          onClick={() => handleMarkRead(notif.id)}
                        >
                          Mark as read
                        </Button>
                      </div>
                    )}
                  </div>
                  {!notif.isRead && (
                    <div className="flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
