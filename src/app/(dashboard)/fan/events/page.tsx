"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { getEventsAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, MapPin, Ticket, Search, Filter, Music } from "lucide-react"

interface EventItem {
  id: string
  title: string
  description: string
  venue: string
  city: string | null
  country: string | null
  eventDate: string
  capacity: number | null
  ticketPrice: number
  organizer: { id: string; name: string }
  artists?: { id: string; name: string }[]
  schedule?: string
  status: string
}

export default function FanEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string>("all")

  const loadEvents = useCallback(async () => {
    const res = await getEventsAction("PUBLISHED")
    if (res.success) {
      const data = res.data as unknown as EventItem[]
      setEvents(data.map((e: any) => ({ ...e, eventDate: e.eventDate || e.date })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const upcomingEvents = filteredEvents.filter(
    (e) => new Date(e.eventDate) > new Date()
  ).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())

  const pastEvents = filteredEvents.filter(
    (e) => new Date(e.eventDate) <= new Date()
  ).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())

  if (loading) return <p className="text-muted-foreground">Loading events...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-muted-foreground">Discover and browse upcoming music events</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events by name, venue, or organizer..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="size-4" />
          Filters
        </Button>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Upcoming Events ({upcomingEvents.length})
        </h2>
        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">No upcoming events found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Check back later for new events"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => {
              const isSoldOut = event.capacity !== null && event.capacity <= 0
              return (
                <Card key={event.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4 shrink-0" />
                      {new Date(event.eventDate).toLocaleDateString("en-US", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4 shrink-0" />
                      <span className="line-clamp-1">{event.venue}{event.city ? `, ${event.city}` : ""}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Ticket className="size-4 shrink-0" />
                      From {Number(event.ticketPrice).toFixed(2)} MC
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Music className="size-3 shrink-0" />
                      Organized by {event.organizer?.name || "Unknown"}
                    </div>
                    {event.artists && event.artists.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.artists.map((a) => (
                          <span key={a.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">{a.name}</span>
                        ))}
                      </div>
                    )}
                    <Link href={`/fan/events/${event.id}`}>
                      <Button className="w-full mt-2" disabled={isSoldOut}>
                        {isSoldOut ? "Sold Out" : "Get Tickets"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Past Events ({pastEvents.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map((event) => (
              <Card key={event.id} className="opacity-75">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4" />
                    {new Date(event.eventDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    {event.venue}
                  </div>
                  <p className="text-xs text-muted-foreground">Event has concluded</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
