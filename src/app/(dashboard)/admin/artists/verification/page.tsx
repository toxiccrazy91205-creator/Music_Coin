"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, Link as LinkIcon } from "lucide-react"

type Artist = {
  id: string
  stageName: string
  bio: string
  genres: string[]
  socialLinks: string[]
  portfolio: string[]
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  user: {
    name: string
    email: string
  }
}

export default function ArtistVerificationPage() {
  const { user } = useAuth()
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchArtists() {
      try {
        const response = await fetch("/api/admin/artists/verification")
        if (response.ok) {
          const json = await response.json()
          if (json.success) setArtists(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch artists", err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "ADMIN") fetchArtists()
  }, [user])

  const updateStatus = async (artistId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const response = await fetch("/api/admin/artists/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, status }),
      })
      if (response.ok) {
        const json = await response.json()
        if (json.success) setArtists((prev) => prev.map((a) => (a.id === artistId ? json.data : a)))
      }
    } catch (err) {
      alert("Error updating status")
    }
  }

  if (!user || user.role !== "ADMIN") return null
  if (loading) return <div className="animate-pulse">Loading artist verifications...</div>

  const pendingCount = artists.filter((a) => a.verificationStatus === "PENDING").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Artist Verification</h1>
        <div className="text-sm font-medium text-muted-foreground">
          {pendingCount} Pending Request{pendingCount !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="grid gap-6">
        {artists.map((artist) => (
          <Card key={artist.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">{artist.stageName}</CardTitle>
                <p className="text-sm text-muted-foreground">{artist.user.email}</p>
              </div>
              <StatusBadge status={artist.verificationStatus} />
            </CardHeader>
            <CardContent>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Biography</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                    {artist.bio || "No biography provided."}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Genres:</span> {artist.genres.join(", ")}</div>
                    <div>
                      <span className="font-medium">Socials:</span>{" "}
                      {artist.socialLinks.length > 0 ? (
                        artist.socialLinks.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline mr-2">
                            <LinkIcon className="h-3 w-3 mr-1" /> Link
                          </a>
                        ))
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {artist.verificationStatus === "PENDING" && (
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => updateStatus(artist.id, "APPROVED")} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                  </Button>
                  <Button onClick={() => updateStatus(artist.id, "REJECTED")} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {artists.length === 0 && (
          <p className="text-muted-foreground">No artists found in the system.</p>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approved</span>
  if (status === "REJECTED") return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="mr-1 h-3.5 w-3.5" /> Rejected</span>
  return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="mr-1 h-3.5 w-3.5" /> Pending</span>
}
