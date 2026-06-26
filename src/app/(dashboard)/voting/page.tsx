"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Vote, Trophy, Star, Music } from "lucide-react"
import { toast } from "sonner"

interface VoteResult {
  artistId: string
  artistName: string
  voteCount: number
  rank: number
}

interface Artist {
  id: string
  name: string
}

export default function VotingPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [results, setResults] = useState<VoteResult[]>([])
  const [loading, setLoading] = useState(true)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  async function loadResults() {
    try {
      const res = await fetch("/api/vote/results")
      const json = await res.json()
      if (json.success) setResults(json.data)
    } catch { toast.error("Failed to load results") }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/artists")
        const json = await res.json()
        if (json.success) setArtists(json.data || [])
      } catch { toast.error("Failed to load artists") }
      await loadResults()
      setLoading(false)
    }
    loadData()
  }, [])

  async function handleVote(artistId: string) {
    setError("")
    setSuccessMsg("")
    setVotingId(artistId)
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg(`Vote cast! You earned ${json.data.reward || 0} MC!`)
        loadResults()
      } else {
        setError(json.error || "Vote failed")
      }
    } catch {
      setError("Something went wrong")
    }
    setVotingId(null)
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Artist Voting</h1>
        <p className="text-muted-foreground">Vote for your favorite artists and earn MC rewards</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400">{successMsg}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            Current Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No votes yet. Be the first to vote!</p>
          ) : (
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.artistId} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                    r.rank === 1 ? "bg-amber-100 text-amber-700" :
                    r.rank === 2 ? "bg-gray-100 text-gray-600" :
                    r.rank === 3 ? "bg-orange-100 text-orange-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {r.rank}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.artistName}</p>
                    <p className="text-xs text-muted-foreground">{r.voteCount} vote{r.voteCount !== 1 ? "s" : ""}</p>
                  </div>
                  <Button size="sm" onClick={() => handleVote(r.artistId)} disabled={votingId === r.artistId}>
                    <Vote className="mr-1 size-4" />
                    {votingId === r.artistId ? "Voting..." : "Vote"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="size-5 text-primary" />
            All Artists
          </CardTitle>
          <CardDescription>Cast your vote and support your favorite artists</CardDescription>
        </CardHeader>
        <CardContent>
          {artists.length === 0 ? (
            <p className="text-sm text-muted-foreground">No artists registered yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {artists.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-2">
                      <Music className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{a.name}</span>
                    </div>
                    <Button size="sm" onClick={() => handleVote(a.id)} disabled={votingId === a.id}>
                      <Vote className="mr-1 size-4" />
                      {votingId === a.id ? "..." : "Vote"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
