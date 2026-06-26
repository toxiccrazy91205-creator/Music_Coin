"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users, UserPlus, Crown, Star, Search, Music, Activity, ArrowUpRight
} from "lucide-react"

interface FanData {
  followers: number
  subscribers: number
  vipMembers: number
  recentVotes: any[]
}

export default function ArtistFansPage() {
  const { user } = useAuth()
  const [fanData, setFanData] = useState<FanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"followers" | "subscribers" | "vip">("followers")

  useEffect(() => {
    async function loadFans() {
      try {
        const [voteRes, artistRes] = await Promise.all([
          fetch("/api/vote/results").then(r => r.json()).catch(() => ({})),
          fetch("/api/artists/me").then(r => r.json()).catch(() => ({})),
        ])

        const artistData = artistRes.data || {}
        setFanData({
          followers: artistData.followersCount || 0,
          subscribers: artistData.subscribersCount || 0,
          vipMembers: artistData.vipMembersCount || 0,
          recentVotes: [],
        })
      } catch {} finally {
        setLoading(false)
      }
    }
    loadFans()
  }, [user])

  if (loading) return <p className="text-muted-foreground">Loading fan data...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fan Management</h1>
        <p className="text-muted-foreground">Manage your followers, subscribers, and VIP members</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Followers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="size-6 text-primary" />
              <span className="text-3xl font-bold">{fanData?.followers || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserPlus className="size-6 text-blue-500" />
              <span className="text-3xl font-bold">{fanData?.subscribers || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">VIP Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Crown className="size-6 text-amber-500" />
              <span className="text-3xl font-bold">{fanData?.vipMembers || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 rounded-lg border p-1">
        <Button variant={activeTab === "followers" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("followers")}>
          <Users className="mr-1 size-4" />
          Followers
        </Button>
        <Button variant={activeTab === "subscribers" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("subscribers")}>
          <Star className="mr-1 size-4" />
          Subscribers
        </Button>
        <Button variant={activeTab === "vip" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("vip")}>
          <Crown className="mr-1 size-4" />
          VIP Members
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search fans by name or email..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "followers" ? "Followers" : activeTab === "subscribers" ? "Subscribers" : "VIP Members"}
          </CardTitle>
          <CardDescription>Fan engagement metrics and management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {activeTab === "followers" && <Users className="mx-auto mb-4 size-12 text-muted-foreground" />}
            {activeTab === "subscribers" && <Star className="mx-auto mb-4 size-12 text-muted-foreground" />}
            {activeTab === "vip" && <Crown className="mx-auto mb-4 size-12 text-muted-foreground" />}
            <p className="text-lg font-medium">No {activeTab} yet</p>
            <p className="text-sm text-muted-foreground">
              {activeTab === "followers" && "Fans who follow your profile will appear here"}
              {activeTab === "subscribers" && "Premium subscribers will be listed here"}
              {activeTab === "vip" && "VIP members with exclusive access"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Engagement Overview</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Fan Base</span>
                  <span className="font-medium">{(fanData?.followers || 0) + (fanData?.subscribers || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subscriber Rate</span>
                  <span className="font-medium">
                    {fanData?.followers ? ((fanData?.subscribers || 0) / fanData.followers * 100).toFixed(1) : "0"}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VIP Rate</span>
                  <span className="font-medium">
                    {fanData?.followers ? ((fanData?.vipMembers || 0) / fanData.followers * 100).toFixed(1) : "0"}%
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Quick Actions</p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                  <UserPlus className="mr-2 size-4" />
                  Message All Fans
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                  <Crown className="mr-2 size-4" />
                  Manage VIP Benefits
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                  <Activity className="mr-2 size-4" />
                  View Engagement Report
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Fan management features coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
