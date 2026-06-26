"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { buyTicketAction } from "@/features/tickets/ticket.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Ticket, Music, Clock, Users, ArrowLeft, Check, QrCode } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"

interface EventDetail {
  id: string
  title: string
  description: string
  venue: string
  city: string | null
  country: string | null
  eventDate: string
  capacity: number | null
  ticketPrice: number
  status: string
  schedule?: string
  organizer: { id: string; name: string }
  artists?: { id: string; name: string }[]
  ticketCount?: number
}

interface TicketResult {
  ticket: {
    id: string
    qrCode: string
    tier: string
    price: number
    seatNumber: string | null
    eventId: string
  }
  transaction: {
    id: string
    amount: number
  }
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState("")
  const [purchasedTicket, setPurchasedTicket] = useState<TicketResult | null>(null)

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/events/${params.id}`)
        const data = await res.json()
        if (data.success && data.data) {
          setEvent({ ...data.data, eventDate: data.data.eventDate || data.data.date })
        }
      } catch {}
      setLoading(false)
    }
    loadEvent()
  }, [params.id])

  async function handleBuyTicket() {
    if (!event) return
    setError("")
    setBuying(true)
    const result = await buyTicketAction(event.id)
    if (result.success) {
      setPurchasedTicket(result.data as unknown as TicketResult)
    } else {
      setError(result.error ?? "Purchase failed")
    }
    setBuying(false)
  }

  if (loading) return <p className="text-muted-foreground">Loading event details...</p>
  if (!event) return <p className="text-muted-foreground">Event not found</p>

  const isSoldOut = event.capacity !== null && (event.ticketCount || 0) >= event.capacity
  const isPast = new Date(event.eventDate) < new Date()

  // Ticket purchase success view
  if (purchasedTicket) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <Card className="border-green-500/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-green-100">
              <Check className="size-8 text-green-600" />
            </div>
            <CardTitle>Purchase Successful!</CardTitle>
            <CardDescription>Your NFT ticket has been minted and stored in your wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Your QR Code</p>
              <div className="mx-auto flex size-40 items-center justify-center rounded-lg bg-muted">
                <QrCode className="size-24 text-primary" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground break-all">{purchasedTicket.ticket.qrCode}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Event</span>
                <span className="font-medium">{event.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ticket Type</span>
                <span className="font-medium">{purchasedTicket.ticket.tier || "General"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Paid</span>
                <span className="font-medium">{Number(purchasedTicket.ticket.price).toFixed(2)} MC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">NFT Token ID</span>
                <span className="font-medium text-xs">{purchasedTicket.ticket.qrCode}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => router.push("/fan/tickets")}>
                View My Tickets
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push("/fan/events")}>
                Browse More Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/fan/events">
        <Button variant="ghost" className="gap-2 -ml-2">
          <ArrowLeft className="size-4" />
          Back to Events
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{event.title}</CardTitle>
          <CardDescription className="text-base">{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Calendar className="size-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="text-sm font-medium">
                  {new Date(event.eventDate).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <MapPin className="size-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Venue</p>
                <p className="text-sm font-medium">{event.venue}{event.city ? `, ${event.city}` : ""}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Ticket className="size-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Ticket Price</p>
                <p className="text-sm font-medium">From {Number(event.ticketPrice).toFixed(2)} MC</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Users className="size-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="text-sm font-medium">
                  {event.capacity ? `${event.capacity - (event.ticketCount || 0)} remaining` : "Unlimited"}
                </p>
              </div>
            </div>
          </div>

          {/* Artists */}
          {event.artists && event.artists.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium flex items-center gap-2">
                <Music className="size-4" />
                Featured Artists
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.artists.map((a) => (
                  <span key={a.id} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          {event.schedule && (
            <div>
              <h3 className="mb-2 text-sm font-medium flex items-center gap-2">
                <Clock className="size-4" />
                Schedule
              </h3>
              <p className="text-sm text-muted-foreground">{event.schedule}</p>
            </div>
          )}

          {/* Organizer */}
          <div className="text-sm text-muted-foreground">
            Organized by <span className="font-medium text-foreground">{event.organizer?.name || "Unknown"}</span>
          </div>

          {/* Buy Ticket Button */}
          {isPast ? (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">This event has already taken place</p>
            </div>
          ) : isSoldOut ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <p className="text-sm font-medium text-destructive">Sold Out</p>
              <p className="text-xs text-muted-foreground">No tickets available for this event</p>
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              <Button
                size="lg"
                className="w-full"
                onClick={handleBuyTicket}
                disabled={buying}
              >
                {buying ? "Processing..." : `Buy NFT Ticket — ${Number(event.ticketPrice).toFixed(2)} MC`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Ticket will be minted as an NFT and stored in your wallet. Dynamic pricing may apply.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
