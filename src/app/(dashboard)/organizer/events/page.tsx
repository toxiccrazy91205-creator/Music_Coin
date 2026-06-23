"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { getEventsAction, publishEventAction, deleteEventAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Send, Calendar } from "lucide-react"

interface EventItem {
  id: string
  title: string
  status: string
  venue: string
  date: string
  ticketPrice: number
}

export default function OrganizerEvents() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    const res = await getEventsAction()
    if (res.success) setEvents(res.data as unknown as EventItem[])
    setLoading(false)
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  async function handlePublish(id: string) {
    const res = await publishEventAction(id)
    if (res.success) loadEvents()
  }

  async function handleDelete(id: string) {
    if (!confirm("Cancel this event?")) return
    const res = await deleteEventAction(id)
    if (res.success) loadEvents()
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Events</h1>
        <Link href="/dashboard/organizer/events/new">
          <Button>
            <Plus className="mr-1 size-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium">No events yet</p>
            <p className="text-sm text-muted-foreground">Create your first festival event to get started.</p>
            <Link href="/dashboard/organizer/events/new" className="mt-4 inline-block">
              <Button>Create Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.venue} &middot; {new Date(event.date).toLocaleDateString()} &middot; {Number(event.ticketPrice).toFixed(2)} MC
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    event.status === "PUBLISHED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : event.status === "DRAFT"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}
                >
                  {event.status}
                </span>
                <div className="flex items-center gap-1">
                  {event.status === "DRAFT" && (
                    <Button variant="ghost" size="sm" onClick={() => handlePublish(event.id)} title="Publish">
                      <Send className="size-4" />
                    </Button>
                  )}
                  <Link href={`/dashboard/organizer/events/${event.id}/edit`}>
                    <Button variant="ghost" size="sm" title="Edit">
                      <Edit className="size-4" />
                    </Button>
                  </Link>
                  {event.status !== "CANCELLED" && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)} title="Cancel">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
