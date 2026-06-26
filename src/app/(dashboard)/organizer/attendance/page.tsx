"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, UserCheck, Activity, Users, ScanLine } from "lucide-react"

interface TicketData {
  id: string
  status: string
  qrCode: string | null
  purchaseDate: string
  event: { title: string }
  user: { name: string; email: string }
}

interface ScanLog {
  id: string
  name: string
  time: string
  status: string
  eventName: string
}

export default function AttendancePage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [events, setEvents] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyId, setVerifyId] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null)
  const [scannedLogs, setScannedLogs] = useState<ScanLog[]>([])

  useEffect(() => {
    fetch("/api/organizer/tickets")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setTickets(json.data.tickets ?? [])
          setEvents(json.data.events ?? [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const validTickets = tickets.filter((t) => t.status === "VALID")
  const usedTickets = tickets.filter((t) => t.status === "USED")
  const totalCheckedIn = usedTickets.length
  const validationRate = tickets.length > 0 ? ((validTickets.length / tickets.length) * 100).toFixed(1) : "0"

  async function handleVerify() {
    if (!verifyId.trim()) return
    setVerifying(true)
    setVerifyResult(null)
    try {
      const res = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: verifyId.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setVerifyResult({ success: true, message: `Verified: ${json.data.purchaserName} - ${json.data.eventName}` })
        setScannedLogs([
          {
            id: json.data.ticketId,
            name: json.data.purchaserName,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "VALID",
            eventName: json.data.eventName,
          },
          ...scannedLogs,
        ])
        setTickets((prev) => prev.map((t) => (t.id === json.data.ticketId ? { ...t, status: "USED" } : t)))
      } else {
        setVerifyResult({ success: false, message: json.error ?? "Verification failed" })
        if (json.data) {
          setScannedLogs([
            {
              id: verifyId.trim(),
              name: json.data.purchaser,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "USED",
              eventName: "Already used",
            },
            ...scannedLogs,
          ])
        }
      }
    } catch {
      setVerifyResult({ success: false, message: "Network error" })
    }
    setVerifying(false)
    setVerifyId("")
  }

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading attendance data...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance & Entry</h1>
        <p className="text-muted-foreground">Monitor live event check-ins and verify tickets.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checked In</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCheckedIn}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {events.length} event(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Tickets</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{validTickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{validationRate}% validation rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gate Activity</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{scannedLogs.length > 0 ? "Active" : "Idle"}</div>
            <p className="text-xs text-muted-foreground mt-1">{scannedLogs.length} scans this session</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 p-3 rounded-xl">
              <ScanLine className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Verify Ticket</h2>
              <p className="text-sm text-muted-foreground">Enter ticket ID or scan QR code</p>
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="ticketId">Ticket ID</Label>
              <Input
                id="ticketId"
                placeholder="e.g. ticket-uuid-here"
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>
            <Button onClick={handleVerify} disabled={verifying || !verifyId.trim()} className="w-full">
              {verifying ? "Verifying..." : "Verify Ticket"}
            </Button>
          </div>

          {verifyResult && (
            <div
              className={`rounded-lg p-3 text-sm ${
                verifyResult.success
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {verifyResult.message}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-auto pt-4">
            Or use an external QR scanner and paste the ticket ID above.
          </p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>Live feed of gate entries</CardDescription>
          </CardHeader>
          <CardContent>
            {scannedLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No scans yet. Verify a ticket to see it here.
              </p>
            ) : (
              <div className="space-y-4">
                {scannedLogs.slice(0, 20).map((log, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{log.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.id.slice(0, 12)}... &bull; {log.time}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{log.eventName}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${
                        log.status === "VALID"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {log.status === "VALID" ? "Granted" : "Denied (Used)"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
