"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Users } from "lucide-react"

type PlatformEvent = {
  id: string
  title: string
  description: string
  venue: string
  city: string | null
  eventDate: string
  capacity: number | null
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED"
  createdAt: string
  organizer: {
    name: string
    email: string
  }
}

const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]

export default function EventModerationPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<PlatformEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/admin/events")
        if (response.ok) {
          const json = await response.json()
          if (json.success) setEvents(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch events", err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "ADMIN") fetchEvents()
  }, [user])

  const updateStatus = async (eventId: string, status: string) => {
    try {
      const response = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status }),
      })
      if (response.ok) {
        const json = await response.json()
        if (json.success) setEvents((prev) => prev.map((e) => (e.id === eventId ? json.data : e)))
      }
    } catch (err) {
      alert("Error updating status")
    }
  }

  if (!user || user.role !== "ADMIN") return null
  if (loading) return <div className="animate-pulse">Loading events...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Event Moderation</h1>
        <div className="text-sm font-medium text-muted-foreground">
          {events.length} Total Events
        </div>
      </div>

      <div className="grid gap-6">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-xl mb-1">{event.title}</CardTitle>
                <div className="text-sm text-muted-foreground font-medium">
                  Organizer: {event.organizer.name} ({event.organizer.email})
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  defaultValue={event.status}
                  onValueChange={(val) => updateStatus(event.id, val as string)}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {event.status !== "CANCELLED" && (
                  <Button variant="destructive" size="sm" onClick={() => updateStatus(event.id, "CANCELLED")}>
                    Force Cancel
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 bg-muted/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">{new Date(event.eventDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm">{event.venue}{event.city ? `, ${event.city}` : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm">{event.capacity || "Unlimited"} Capacity</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && (
          <p className="text-muted-foreground">No events found in the system.</p>
        )}
      </div>
    </div>
  )
}
