"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Ticket, DollarSign, Activity } from "lucide-react"
import { getEventsAction } from "@/features/events/events.actions"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts"

interface DashboardData {
  totalEvents: number
  published: number
  drafts: number
  ticketsSold: number
  totalRevenue: number
  recentEvents: {
    id: string
    title: string
    status: string
    eventDate: string
  }[]
}

export default function OrganizerOverview() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/organizer/dashboard")
        if (response.ok) {
          const json = await response.json()
          if (json.success) setData(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch dashboard", err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "ORGANIZER") fetchDashboard()
  }, [user])

  if (!user || user.role !== "ORGANIZER") return null
  if (loading) return <div className="animate-pulse">Loading dashboard...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your events, track sales, and monitor revenue.</p>
        </div>
        <Link href="/organizer/events/new">
          <Button className="bg-primary hover:bg-primary/90 shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{data?.totalRevenue.toLocaleString()} MC</div>
            <p className="text-xs text-muted-foreground mt-1">From ticket sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.ticketsSold}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{data?.published}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{data?.drafts}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending publication</p>
          </CardContent>
        </Card>
      </div>

      {data && data.recentEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Event Name</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-muted/20 transition-colors bg-card">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          {event.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(event.eventDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          event.status === "PUBLISHED" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                          event.status === "CANCELLED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href="/organizer/events">
                          <Button variant="outline" size="sm">Manage</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Embedded Analytics Component */}
      <div className="pt-6">
        <OrganizerAnalytics />
      </div>
    </div>
  )
}

interface EventAnalytics {
  totalTicketsSold: number
  attendance: number
  capacity: number | null
  totalRevenue: number
}

function OrganizerAnalytics() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<{ id: string; title: string; eventDate: string }[]>([])
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, EventAnalytics>>({})

  useEffect(() => {
    setMounted(true)
    async function load() {
      const res = await getEventsAction(undefined, true)
      if (!res.success) {
        setLoading(false)
        return
      }
      const eventsData = res.data as unknown as { id: string; title: string; eventDate: string }[]
      setEvents(eventsData)

      const map: Record<string, EventAnalytics> = {}
      await Promise.all(
        eventsData.map(async (ev) => {
          try {
            const r = await fetch(`/api/events/${ev.id}/analytics`)
            const json = await r.json()
            if (json.success) map[ev.id] = json.data
          } catch {
            // skip failed
          }
        }),
      )
      setAnalyticsMap(map)
      setLoading(false)
    }
    load()
  }, [])

  if (!mounted) return null

  const chartData = events
    .filter((ev) => analyticsMap[ev.id])
    .map((ev) => ({
      name: ev.title.length > 18 ? ev.title.slice(0, 16) + "..." : ev.title,
      tickets: analyticsMap[ev.id].totalTicketsSold,
      attendance: analyticsMap[ev.id].attendance,
      revenue: analyticsMap[ev.id].totalRevenue,
    }))

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading analytics...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics</h2>
        <p className="text-muted-foreground">Deep dive into your event performance, attendance, and revenue trends.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Tickets per Event</CardTitle>
            <CardDescription>Breakdown of all your events</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No analytics data available yet.</p>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue (MC)" />
                    <Bar yAxisId="right" dataKey="tickets" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Tickets Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets vs Check-ins</CardTitle>
            <CardDescription>Sold vs attended tickets per event</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No analytics data available yet.</p>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="tickets" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 4 }} name="Sold" />
                    <Line type="monotone" dataKey="attendance" stroke="hsl(var(--chart-3))" strokeWidth={3} dot={{ r: 4 }} name="Checked In" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
