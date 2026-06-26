"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users, MessageCircle, Lock, Music, Plus, Send, Globe, Settings,
  Star, ThumbsUp, Image
} from "lucide-react"

interface CommunityData {
  discussionCount: number
  pollCount: number
  contentCount: number
}

export default function ArtistCommunityPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"clubs" | "content" | "discussions">("clubs")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [data, setData] = useState<CommunityData>({ discussionCount: 0, pollCount: 0, contentCount: 0 })

  useEffect(() => {
    async function load() {
      try {
        const [discRes, pollRes] = await Promise.all([
          fetch("/api/fanclub/content").then(r => r.json()).catch(() => ({})),
          fetch("/api/vote/results").then(r => r.json()).catch(() => ({}))
        ])
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-muted-foreground">Loading community...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community Management</h1>
        <p className="text-muted-foreground">Connect with fans, share exclusive content, and manage discussions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Discussions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Exclusive Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 rounded-lg border p-1">
        <Button variant={activeTab === "clubs" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("clubs")}>
          <Globe className="mr-1 size-4" />
          Fan Club
        </Button>
        <Button variant={activeTab === "content" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("content")}>
          <Lock className="mr-1 size-4" />
          Exclusive Content
        </Button>
        <Button variant={activeTab === "discussions" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("discussions")}>
          <MessageCircle className="mr-1 size-4" />
          Discussions
        </Button>
      </div>

      {activeTab === "clubs" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Create Fan Club
              </CardTitle>
              <CardDescription>Start a community for your fans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fan Club Name</Label>
                <Input placeholder="e.g. The Official Fan Club" disabled />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  className="flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Welcome fans! This is our community space..."
                  disabled
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled>
                  <Plus className="mr-2 size-4" />
                  Create Fan Club
                </Button>
                <Button variant="outline" disabled>
                  <Settings className="mr-2 size-4" />
                  Manage Members
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Fan club creation coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Poll</CardTitle>
              <CardDescription>Engage your fans with polls and voting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input placeholder="What song should I release next?" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    <Input placeholder="Option 1" disabled />
                    <Input placeholder="Option 2" disabled />
                  </div>
                  <Button variant="ghost" size="sm" disabled>
                    <Plus className="mr-2 size-3" />
                    Add Option
                  </Button>
                </div>
                <Button disabled>
                  <Plus className="mr-2 size-4" />
                  Create Poll
                </Button>
                <p className="text-xs text-muted-foreground">Poll creation coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "content" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5" />
              Exclusive Content
            </CardTitle>
            <CardDescription>Share premium content with your fans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-dashed p-4 text-center">
                <Music className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">Exclusive Track</p>
                <p className="text-xs text-muted-foreground">Share unreleased music</p>
                <Button variant="outline" size="sm" className="mt-2" disabled>
                  <Plus className="mr-1 size-3" />
                  Upload
                </Button>
              </div>
              <div className="rounded-lg border border-dashed p-4 text-center">
                <Image className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">Behind the Scenes</p>
                <p className="text-xs text-muted-foreground">Share photos & videos</p>
                <Button variant="outline" size="sm" className="mt-2" disabled>
                  <Plus className="mr-1 size-3" />
                  Upload
                </Button>
              </div>
              <div className="rounded-lg border border-dashed p-4 text-center">
                <Star className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">Meet & Greet</p>
                <p className="text-xs text-muted-foreground">VIP fan experiences</p>
                <Button variant="outline" size="sm" className="mt-2" disabled>
                  <Plus className="mr-1 size-3" />
                  Create
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">Content management coming soon</p>
          </CardContent>
        </Card>
      )}

      {activeTab === "discussions" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="size-5" />
              Fan Discussions
            </CardTitle>
            <CardDescription>Engage in conversations with your fans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Share an update with your fans..." disabled />
                <Button size="icon" disabled>
                  <Send className="size-4" />
                </Button>
              </div>
              <div className="text-center py-8">
                <MessageCircle className="mx-auto mb-4 size-12 text-muted-foreground" />
                <p className="text-lg font-medium">No discussions yet</p>
                <p className="text-sm text-muted-foreground">Fan discussions will appear here once you create a fan club</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
