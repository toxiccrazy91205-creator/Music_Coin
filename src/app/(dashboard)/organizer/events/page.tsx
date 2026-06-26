"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { getEventsAction, publishEventAction, deleteEventAction } from "@/features/events/events.actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Send, Calendar, Users, Briefcase } from "lucide-react"

interface EventItem {
  id: string
  title: string
  status: string
  venue: string
  eventDate: string
  ticketPrice: number
}

export default function OrganizerEvents() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    const res = await getEventsAction(undefined, true)
    if (res.success) setEvents(res.data as unknown as EventItem[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  async function handlePublish(id: string) {
    const res = await publishEventAction(id)
    if (res.success) loadEvents()
  }

  async function handleDelete(id: string) {
    if (!confirm("Cancel this event? This action cannot be fully undone.")) return
    const res = await deleteEventAction(id)
    if (res.success) loadEvents()
  }

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading your events...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">Manage your festivals, lineups, and sponsors.</p>
        </div>
        <Link href="/organizer/events/new">
          <Button className="bg-primary hover:bg-primary/90 shadow-md">
            <Plus className="mr-2 size-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-4 size-12 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-medium">No events yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">You haven't created any events. Start by setting up a new festival.</p>
            <Link href="/organizer/events/new">
              <Button>Create First Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Event Details</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Lineup & Sponsors</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-base">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{event.venue}</span>
                      </div>
                      <div className="mt-1 font-medium text-primary">
                        {Number(event.ticketPrice).toFixed(2)} MC
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          event.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : event.status === "DRAFT"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <Link href={`/organizer/artists?event=${event.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start">
                            <Users className="mr-2 size-3" /> Manage Artists
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start" onClick={() => alert("Manage Sponsors modal opening...")}>
                          <Briefcase className="mr-2 size-3" /> Manage Sponsors
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
                        {event.status === "DRAFT" && (
                          <Button variant="ghost" size="sm" onClick={() => handlePublish(event.id)} title="Publish Event">
                            <Send className="size-4" />
                          </Button>
                        )}
                        <Link href={`/organizer/events/${event.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit Event Details">
                            <Edit className="size-4" />
                          </Button>
                        </Link>
                        {event.status !== "CANCELLED" && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)} title="Cancel Event">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
