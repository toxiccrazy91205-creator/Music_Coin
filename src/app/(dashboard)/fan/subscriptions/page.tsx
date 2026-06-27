"use client"

import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Music, CheckCircle2, SlidersHorizontal, Gift } from "lucide-react"

export default function FanSubscriptionsPage() {
  const { user } = useAuth()

  if (!user || user.role !== "FAN") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Subscriptions & Pledges</h1>
          <p className="text-muted-foreground mt-1">Manage your active memberships and "Pay-What-You-Want" pledges to support artists directly.</p>
        </div>
        <Button>
          <Heart className="mr-2 h-4 w-4" />
          Discover Artists
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-t-4 border-t-purple-500 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-md">
                <Music className="h-5 w-5" />
              </div>
              <CardTitle>Active Subscriptions</CardTitle>
            </div>
            <CardDescription>
              Your VIP access and monthly support for your favorite creators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { artist: "DJ Eclipse", tier: "VIP Backer", amount: "$15.00/mo", perks: ["Exclusive Stems", "Backstage Passes"] },
              { artist: "Neon Sound Studios", tier: "Supporter", amount: "$5.00/mo", perks: ["Early Access"] }
            ].map((sub, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{sub.artist}</h4>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{sub.tier}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{sub.amount}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {sub.perks.map((perk, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500" /> {perk}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="w-full">Manage</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-500 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-md">
                <Gift className="h-5 w-5" />
              </div>
              <CardTitle>Pay-What-You-Want Releases</CardTitle>
            </div>
            <CardDescription>
              Albums and EPs you've supported through flexible pricing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-amber-200 dark:border-amber-900/30 text-center space-y-3">
              <SlidersHorizontal className="h-8 w-8 text-amber-400 mx-auto" />
              <h4 className="font-medium text-sm">Empower Independent Music</h4>
              <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
                When you buy "Pay-What-You-Want" content, funds go directly to the artist's smart contract instantly. No middlemen.
              </p>
              <Button size="sm" variant="secondary" className="w-full mt-2 text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-400">
                Browse PWYW Catalog
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold mt-4">Your Library</h4>
              {[
                { title: "Midnight Echoes EP", artist: "Luna Vox", paid: "$12.00", min: "$0.00" },
                { title: "Raw Acoustic Sessions", artist: "The Strangers", paid: "$5.00", min: "$2.00" }
              ].map((album, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-md border bg-card">
                  <div>
                    <h4 className="text-sm font-medium">{album.title}</h4>
                    <p className="text-xs text-muted-foreground">{album.artist}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">Paid {album.paid}</p>
                    <p className="text-[10px] text-muted-foreground">Min price was {album.min}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
