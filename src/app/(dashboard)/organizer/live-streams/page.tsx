"use client"

import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Users, PlayCircle, Settings } from "lucide-react"

export default function OrganizerLiveStreamsPage() {
  const { user } = useAuth()

  if (!user || user.role !== "ORGANIZER") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Streams & Virtual Events</h1>
          <p className="text-muted-foreground mt-1">Configure and monitor virtual hybrid events to reach global audiences.</p>
        </div>
        <Button>
          <Video className="mr-2 h-4 w-4" />
          Schedule Stream
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streams</CardTitle>
            <PlayCircle className="h-4 w-4 text-destructive animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1">Live right now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Viewers (Live)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,450</div>
            <p className="text-xs text-muted-foreground mt-1">Across all active streams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Events</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground mt-1">Upcoming this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-destructive shadow-sm shadow-destructive/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Summer Beats Festival (Main Stage)</CardTitle>
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <span className="mr-1 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span> LIVE
              </span>
            </div>
            <CardDescription>Streaming to global ticket holders.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center relative overflow-hidden group">
              {/* Placeholder for video player */}
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center">
                <Video className="h-12 w-12 text-white/50 mb-4" />
                <p className="font-semibold">Stream Output Preview</p>
                <p className="text-sm text-white/60">Bitrate: 6000 kbps • 1080p60</p>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm">
                <span className="font-semibold">{Number(12450).toLocaleString()}</span> Viewers
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Stream Settings</Button>
                <Button variant="destructive" size="sm">End Stream</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Streams</CardTitle>
            <CardDescription>Manage scheduled broadcasts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "DJ Eclipse - Studio Session", date: "Tomorrow, 8:00 PM EST", type: "Exclusive (VIP Only)" },
                { title: "Neon Nights Tour - Paris", date: "Oct 15, 9:00 PM CET", type: "Hybrid Event" }
              ].map((stream, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg border bg-card">
                  <div>
                    <h4 className="font-semibold text-sm">{stream.title}</h4>
                    <p className="text-xs text-muted-foreground">{stream.date}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase bg-secondary px-2 py-0.5 rounded text-secondary-foreground font-medium">
                      {stream.type}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">Manage</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
