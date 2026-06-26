"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { getWalletAction } from "@/features/wallet/wallet.actions"
import { getNftsAction } from "@/features/nfts/nft.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  ImageIcon,
  TrendingUp,
  Users,
  Music,
  DollarSign,
  ArrowRight,
  Bell,
  Activity
} from "lucide-react"

interface DashboardStats {
  totalRevenue: number
  nftCount: number
  nftSales: number
  followerCount: number
  songCount: number
}

export default function ArtistDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [walletRes, nftsRes, voteRes] = await Promise.all([
          getWalletAction(),
          getNftsAction(),
          fetch("/api/vote/results").then(r => r.json()).catch(() => ({})),
        ])

        const balance = walletRes.success ? Number((walletRes.data as any)?.balance || 0) : 0
        const allNfts = nftsRes.success ? (nftsRes.data as any[]) || [] : []
        const myNfts = allNfts.filter((n: any) => n.owner?.id === user?.id)
        const nftSales = allNfts
          .filter((n: any) => n.owner?.id !== user?.id && n.owner?.id)
          .reduce((sum: number, n: any) => sum + Number(n.price), 0)

        setStats({
          totalRevenue: balance,
          nftCount: myNfts.length,
          nftSales,
          followerCount: 0,
          songCount: myNfts.length,
        })
      } catch {} finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Artist Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || "Artist"}</p>
        </div>
        <Link href="/artist/notifications">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 size-4" />
            Notifications
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-5 text-green-500" />
              <span className="text-2xl font-bold">{stats?.totalRevenue.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">NFTs Minted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ImageIcon className="size-5 text-primary" />
              <span className="text-2xl font-bold">{stats?.nftCount || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">NFT Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats?.nftSales.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Songs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Music className="size-5 text-purple-500" />
              <span className="text-2xl font-bold">{stats?.songCount || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/artist/nfts">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <ImageIcon className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">Manage NFTs</div>
              <div className="text-xs text-muted-foreground">Mint & manage collections</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>

        <Link href="/artist/royalties">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <DollarSign className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">Royalties</div>
              <div className="text-xs text-muted-foreground">Track earnings & payments</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>

        <Link href="/artist/fans">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <Users className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">Fan Base</div>
              <div className="text-xs text-muted-foreground">Followers & subscribers</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>

        <Link href="/artist/analytics">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <Activity className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">Analytics</div>
              <div className="text-xs text-muted-foreground">Performance metrics</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Quick Overview
          </CardTitle>
          <CardDescription>Your recent activity and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Revenue Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>NFT Sales</span>
                  <span className="font-medium">{stats?.nftSales.toFixed(2) || "0.00"} MC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Wallet Balance</span>
                  <span className="font-medium">{stats?.totalRevenue.toFixed(2) || "0.00"} MC</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Fan Engagement</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Followers</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Votes</span>
                  <span className="font-medium">—</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
