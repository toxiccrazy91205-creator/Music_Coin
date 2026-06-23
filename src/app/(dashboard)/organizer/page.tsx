"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getEventsAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"

interface EventSummary {
  id: string
  title: string
  status: string
  date: string
}

export default function OrganizerOverview() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEventsAction().then((res) => {
      if (res.success) setEvents(res.data as unknown as EventSummary[])
      setLoading(false)
    })
  }, [])

  const published = events.filter((e) => e.status === "PUBLISHED").length
  const drafts = events.filter((e) => e.status === "DRAFT").length

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
        <Link href="/dashboard/organizer/events/new">
          <Button>
            <Plus className="mr-1 size-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{drafts}</p>
          </CardContent>
        </Card>
      </div>

      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events.slice(0, 5).map((event) => (
                <Link
                  key={event.id}
                  href={"/dashboard/organizer/events"}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <Calendar className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.status === "PUBLISHED" ? "Published" : event.status === "DRAFT" ? "Draft" : event.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
