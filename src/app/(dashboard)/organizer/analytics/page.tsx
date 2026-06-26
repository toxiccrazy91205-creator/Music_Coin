"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getEventsAction } from "@/features/events/events.actions"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts"

interface EventAnalytics {
  totalTicketsSold: number
  attendance: number
  capacity: number | null
  totalRevenue: number
}

export default function AnalyticsPage() {
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

  const totals = Object.values(analyticsMap).reduce(
    (acc, a) => ({
      revenue: acc.revenue + a.totalRevenue,
      tickets: acc.tickets + a.totalTicketsSold,
      attendance: acc.attendance + a.attendance,
    }),
    { revenue: 0, tickets: 0, attendance: 0 },
  )

  const conversionRate =
    events.length > 0
      ? ((totals.tickets / (totals.tickets + events.length * 100)) * 100).toFixed(1)
      : "0"

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading analytics...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Deep dive into your event performance, attendance, and revenue trends.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totals.revenue.toLocaleString()} MC</div>
            <p className="text-xs text-blue-600/80 mt-1">Across {events.length} event(s)</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Tickets Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{totals.tickets}</div>
            <p className="text-xs text-emerald-600/80 mt-1">{totals.attendance} checked in</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-400">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-700 dark:text-violet-300">
              {totals.tickets > 0 ? ((totals.attendance / totals.tickets) * 100).toFixed(1) : "0"}%
            </div>
            <p className="text-xs text-violet-600/80 mt-1">Of total tickets sold</p>
          </CardContent>
        </Card>
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
