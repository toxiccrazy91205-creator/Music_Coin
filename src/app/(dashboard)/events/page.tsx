"use client"

import { useEffect, useState } from "react"
import { getEventsAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Ticket } from "lucide-react"

interface EventItem {
  id: string
  title: string
  description: string
  venue: string
  date: string
  ticketPrice: number
  organizer: { name: string }
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEventsAction("PUBLISHED").then((res) => {
      if (res.success) setEvents(res.data as unknown as EventItem[])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Events</h1>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium">No events available</p>
            <p className="text-sm text-muted-foreground">Check back later for upcoming festivals.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {event.venue}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Ticket className="size-4" />
                  {Number(event.ticketPrice).toFixed(2)} MC
                </div>
                <p className="text-xs text-muted-foreground">
                  Organized by {event.organizer?.name || "Unknown"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
