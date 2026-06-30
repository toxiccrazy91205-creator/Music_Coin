"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getUserTicketsAction, transferTicketAction } from "@/features/tickets/ticket.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ticket, Calendar, MapPin, QrCode, ArrowUpRight, AlertCircle } from "lucide-react"

interface TicketItem {
  id: string
  eventId: string
  qrCode: string | null
  tier: string | null
  price: number
  seatNumber: string | null
  status: string
  nftTokenId: string | null
  purchaseDate: string
  event: {
    id: string
    title: string
    venue: string
    eventDate: string
    organizer: { id: string; name: string }
  }
}

export default function FanTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)

  // Transfer ticket state
  const [transferTicketData, setTransferTicketData] = useState<TicketItem | null>(null)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState("")

  useEffect(() => {
    getUserTicketsAction().then((res) => {
      if (res.success) setTickets(res.data as unknown as TicketItem[])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-muted-foreground">Loading tickets...</p>

  // QR verification modal
  if (selectedTicket) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <Button variant="ghost" className="gap-2" onClick={() => setSelectedTicket(null)}>
          <ArrowUpRight className="size-4 rotate-180" />
          Back to Tickets
        </Button>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Ticket QR Code</CardTitle>
            <CardDescription>Show this at the entrance for verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mx-auto flex size-48 items-center justify-center rounded-xl border-2 border-primary bg-muted">
              <QrCode className="size-32 text-primary" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-lg font-bold">{selectedTicket.event.title}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedTicket.event.eventDate).toLocaleDateString("en-US", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric"
                })}
              </p>
              <p className="text-sm text-muted-foreground">{selectedTicket.event.venue}</p>
              <div className="rounded-lg bg-muted p-2 text-xs">
                <p>Ticket ID: {selectedTicket.id.slice(0, 8)}...</p>
                <p>NFT Token: {selectedTicket.nftTokenId || "N/A"}</p>
                <p>Status: <span className="font-medium text-green-600">{selectedTicket.status}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Transfer ticket modal

  const handleTransfer = async () => {
    if (!transferTicketData || !recipientEmail) return
    setTransferring(true)
    setTransferError("")
    const res = await transferTicketAction(transferTicketData.id, recipientEmail)
    if (res.success) {
      setTickets(tickets.filter(t => t.id !== transferTicketData.id))
      setTransferTicketData(null)
      setRecipientEmail("")
      alert("Ticket transferred successfully!")
    } else {
      setTransferError(res.error || "Failed to transfer ticket")
    }
    setTransferring(false)
  }

  if (transferTicketData) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <Button variant="ghost" className="gap-2" onClick={() => {
          setTransferTicketData(null)
          setTransferError("")
          setRecipientEmail("")
        }}>
          <ArrowUpRight className="size-4 rotate-180" />
          Back to Tickets
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Transfer Ticket</CardTitle>
            <CardDescription>Transfer your ticket to another fan by email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-bold">{transferTicketData.event.title}</p>
              <p className="text-sm text-muted-foreground">{transferTicketData.tier || "General Admission"}</p>
            </div>
            {transferError && <p className="text-sm text-destructive">{transferError}</p>}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient Email</label>
              <input 
                type="email" 
                placeholder="fan@example.com"
                className="w-full rounded-md border p-2 text-sm"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleTransfer} 
              disabled={transferring || !recipientEmail}
            >
              {transferring ? "Transferring..." : "Confirm Transfer"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeTickets = tickets.filter((t) => t.status === "VALID" && new Date(t.event.eventDate) > new Date())
  const pastTickets = tickets.filter(
    (t) => t.status !== "VALID" || new Date(t.event.eventDate) <= new Date()
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Tickets</h1>
        <p className="text-muted-foreground">View and manage your NFT event tickets</p>
      </div>

      {/* Active Tickets */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Active Tickets ({activeTickets.length})</h2>
        {activeTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="mx-auto mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">No tickets yet</p>
              <p className="text-sm text-muted-foreground">Browse events and purchase your first NFT ticket!</p>
              <Link href="/fan/events">
                <Button className="mt-4">Browse Events</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeTickets.map((ticket) => (
              <Card key={ticket.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{ticket.event.title}</CardTitle>
                      <CardDescription>
                        {ticket.tier || "General"} — {Number(ticket.price).toFixed(2)} MC
                      </CardDescription>
                    </div>
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Active
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4" />
                    {new Date(ticket.event.eventDate).toLocaleDateString("en-US", {
                      weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    {ticket.event.venue}
                  </div>
                  {ticket.seatNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ticket className="size-4" />
                      Seat: {ticket.seatNumber}
                    </div>
                  )}
                  {ticket.nftTokenId && (
                    <div className="rounded-lg bg-muted p-2 text-xs text-muted-foreground break-all">
                      NFT: {ticket.nftTokenId}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <QrCode className="mr-1 size-4" />
                      Show QR
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setTransferTicketData(ticket)}
                    >
                      Transfer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Tickets */}
      {pastTickets.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Past Tickets ({pastTickets.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastTickets.map((ticket) => (
              <Card key={ticket.id} className="opacity-70">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{ticket.event.title}</CardTitle>
                      <CardDescription>{Number(ticket.price).toFixed(2)} MC</CardDescription>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Used
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4" />
                    {new Date(ticket.event.eventDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    {ticket.event.venue}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
