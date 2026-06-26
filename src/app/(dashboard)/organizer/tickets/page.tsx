"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ticket, QrCode, Search, RefreshCw, BarChart } from "lucide-react"
import { Input } from "@/components/ui/input"

interface TicketItem {
  id: string
  eventId: string
  event: { title: string }
  user: { name: string, email: string }
  seatNumber: string | null
  tier: string | null
  price: number
  status: string
  purchaseDate: string
}

interface EventOverview {
  id: string
  title: string
  capacity: number | null
}

export default function TicketManagementPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [events, setEvents] = useState<EventOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch("/api/organizer/tickets")
      const json = await res.json()
      if (json.success) {
        setTickets(json.data.tickets)
        setEvents(json.data.events)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredTickets = tickets.filter(t => 
    t.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ticket Management</h1>
          <p className="text-muted-foreground">Monitor NFT ticket sales, pricing tiers, and inventory.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-2">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all active events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid NFT Tickets</CardTitle>
            <QrCode className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {tickets.filter(t => t.status === "VALID").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready for scanning</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Velocity</CardTitle>
            <BarChart className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Stable</div>
            <p className="text-xs text-muted-foreground mt-1">Based on recent purchases</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle>Ticket Inventory Tracker</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by event, attendee, or ID..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Ticket ID</th>
                  <th className="px-6 py-4 font-medium">Event</th>
                  <th className="px-6 py-4 font-medium">Attendee</th>
                  <th className="px-6 py-4 font-medium">Tier / Price</th>
                  <th className="px-6 py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Loading inventory...
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No tickets found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">
                        {ticket.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 font-medium">{ticket.event.title}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{ticket.user.name}</p>
                        <p className="text-xs text-muted-foreground">{ticket.user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {ticket.tier || "General"}
                          </span>
                          <span className="text-muted-foreground">{Number(ticket.price).toFixed(2)} MC</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ticket.status === "VALID" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                          ticket.status === "USED" ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" :
                          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
