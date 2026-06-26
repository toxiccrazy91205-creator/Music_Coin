"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users,
  MessageCircle,
  Trophy,
  Lock,
  Music,
  Star,
  ThumbsUp,
  Send,
  Plus,
  Vote
} from "lucide-react"

interface CommunityData {
  fanClubs: FanClub[]
  discussions: Discussion[]
  polls: Poll[]
  exclusiveContent: ExclusiveContent[]
}

interface FanClub {
  id: string
  artistName: string
  memberCount: number
  isMember: boolean
  description: string
}

interface Discussion {
  id: string
  artistName: string
  message: string
  fanName: string
  createdAt: string
}

interface Poll {
  id: string
  question: string
  artistName: string
  options: PollOption[]
  totalVotes: number
}

interface PollOption {
  id: string
  text: string
  votes: number
}

interface ExclusiveContent {
  id: string
  artistName: string
  title: string
  contentType: string
  isPremiumOnly: boolean
}

export default function FanCommunityPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"clubs" | "discussions" | "polls" | "exclusive">("clubs")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [message, setMessage] = useState("")
  const [votingPoll, setVotingPoll] = useState<string | null>(null)

  // Mock community data - all real features are coming soon
  const communityData: CommunityData = {
    fanClubs: [
      { id: "1", artistName: "Demo Artist", memberCount: 42, isMember: false, description: "Official fan club" },
      { id: "2", artistName: "Electric Sound", memberCount: 28, isMember: true, description: "Electronic music lovers" },
      { id: "3", artistName: "Jazz Collective", memberCount: 15, isMember: false, description: "Smooth jazz community" },
    ],
    discussions: [],
    polls: [],
    exclusiveContent: []
  }

  useEffect(() => {
    // Try to load real data from API
    async function loadCommunity() {
      try {
        const [pollRes, contentRes] = await Promise.all([
          fetch("/api/vote/results").then(r => r.json()).catch(() => ({})),
          fetch("/api/fanclub/content").then(r => r.json()).catch(() => ({}))
        ])
      } catch {}
      setLoading(false)
    }
    loadCommunity()
  }, [])

  if (loading) return <p className="text-muted-foreground">Loading community...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fan Community</h1>
        <p className="text-muted-foreground">Join fan clubs, vote in polls, and access exclusive content</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800">{successMsg}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border p-1 flex-wrap">
        <Button
          variant={activeTab === "clubs" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("clubs")}
        >
          <Users className="mr-1 size-4" />
          Fan Clubs
        </Button>
        <Button
          variant={activeTab === "discussions" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("discussions")}
        >
          <MessageCircle className="mr-1 size-4" />
          Discussions
        </Button>
        <Button
          variant={activeTab === "polls" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("polls")}
        >
          <Trophy className="mr-1 size-4" />
          Polls
        </Button>
        <Button
          variant={activeTab === "exclusive" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("exclusive")}
        >
          <Lock className="mr-1 size-4" />
          Exclusive Content
        </Button>
      </div>

      {/* Fan Clubs Tab */}
      {activeTab === "clubs" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="size-5 text-amber-500" />
                Artist Fan Clubs
              </CardTitle>
              <CardDescription>Join fan clubs to connect with other music lovers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {communityData.fanClubs.map((club) => (
                  <Card key={club.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                          <Music className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{club.artistName}</p>
                          <p className="text-xs text-muted-foreground">{club.memberCount} members</p>
                          <p className="text-xs text-muted-foreground">{club.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={club.isMember ? "default" : "outline"}
                        disabled
                      >
                        {club.isMember ? "Joined" : "Join"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Fan club creation and membership management coming soon
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-5" />
                Create a Fan Club
              </CardTitle>
              <CardDescription>Start your own fan community for your favorite artist</CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled>
                <Plus className="mr-2 size-4" />
                Create Fan Club
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Discussions Tab */}
      {activeTab === "discussions" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="size-5" />
              Discussions
            </CardTitle>
            <CardDescription>Join the conversation with other fans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <MessageCircle className="mx-auto mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">No discussions yet</p>
              <p className="text-sm text-muted-foreground">Discussion threads coming soon</p>
            </div>
            {/* Discussion Input - placeholder */}
            <div className="flex gap-2">
              <Input placeholder="Write a message... (coming soon)" disabled />
              <Button size="icon" disabled>
                <Send className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Polls Tab */}
      {activeTab === "polls" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="size-5" />
              Artist Polls
            </CardTitle>
            <CardDescription>Vote in polls and make your voice heard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Trophy className="mx-auto mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">No active polls</p>
              <p className="text-sm text-muted-foreground">Artist polls coming soon. Check the voting page to cast your votes!</p>
            </div>
            <Link href="/voting">
              <Button variant="outline" className="w-full">
                <Vote className="mr-2 size-4" />
                Go to Voting Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Exclusive Content Tab */}
      {activeTab === "exclusive" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5" />
              Exclusive Content
            </CardTitle>
            <CardDescription>Access premium content from your favorite artists</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="py-6 text-center">
                  <Music className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Exclusive Tracks</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-6 text-center">
                  <Lock className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Behind the Scenes</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-6 text-center">
                  <Star className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Meet & Greet</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-6 text-center">
                  <ThumbsUp className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">VIP Perks</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
