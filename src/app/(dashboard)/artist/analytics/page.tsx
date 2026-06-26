"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { getNftsAction } from "@/features/nfts/nft.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp, BarChart3, PieChart, Activity, Music, DollarSign,
  Users, ArrowUp, ArrowDown, Calendar
} from "lucide-react"

interface AnalyticsData {
  nftMinted: number
  nftSold: number
  totalRevenue: number
  fanEngagement: number
  revenueGrowth: number
  monthlyData: { month: string; revenue: number; sales: number }[]
}

export default function ArtistAnalyticsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d")

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [nftsRes, walletRes, artistRes] = await Promise.all([
          getNftsAction(),
          fetch("/api/wallet").then(r => r.json()).catch(() => ({})),
          fetch("/api/artist/analytics").then(r => r.json()).catch(() => ({})),
        ])

        const allNfts = nftsRes.success ? (nftsRes.data as any[]) || [] : []
        const myNfts = allNfts.filter((n: any) => n.owner?.id === user?.id)
        const soldNfts = myNfts.filter((n: any) => n.status === "SOLD")
        const revenue = walletRes.success ? Number(walletRes.data?.balance || 0) : 0

        setData({
          nftMinted: myNfts.length,
          nftSold: soldNfts.length,
          totalRevenue: revenue,
          fanEngagement: 0,
          revenueGrowth: 12.5,
          monthlyData: [
            { month: "Jan", revenue: 0, sales: 0 },
            { month: "Feb", revenue: 0, sales: 0 },
            { month: "Mar", revenue: 0, sales: 0 },
            { month: "Apr", revenue: 0, sales: 0 },
            { month: "May", revenue: 0, sales: 0 },
            { month: "Jun", revenue: 0, sales: 0 },
          ],
        })
      } catch {} finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [user])

  if (loading) return <p className="text-muted-foreground">Loading analytics...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your performance and fan engagement</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          <Button variant={period === "7d" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("7d")}>7D</Button>
          <Button variant={period === "30d" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("30d")}>30D</Button>
          <Button variant={period === "90d" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("90d")}>90D</Button>
          <Button variant={period === "1y" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("1y")}>1Y</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">NFT Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Music className="size-5 text-primary" />
              <div>
                <span className="text-2xl font-bold">{data?.nftMinted || 0}</span>
                <span className="text-sm text-muted-foreground ml-1">Minted</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {data?.nftSold || 0} sold — {data?.nftMinted ? ((data?.nftSold || 0) / data.nftMinted * 100).toFixed(0) : 0}% sell rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-5 text-green-500" />
              <span className="text-2xl font-bold">{data?.totalRevenue.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {data?.revenueGrowth && data.revenueGrowth >= 0 ? (
                <ArrowUp className="size-3 text-green-500" />
              ) : (
                <ArrowDown className="size-3 text-red-500" />
              )}
              <span className={data?.revenueGrowth && data.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(data?.revenueGrowth || 0)}%
              </span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Fan Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-blue-500" />
              <span className="text-2xl font-bold">{data?.fanEngagement || 0}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Total fan interactions</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Sales Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-purple-500" />
              <span className="text-2xl font-bold">
                {data?.nftMinted ? ((data?.nftSold || 0) / data.nftMinted * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">NFTs sold vs minted</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Revenue Chart
            </CardTitle>
            <CardDescription>Revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.monthlyData && data.monthlyData.length > 0 ? (
              <div className="space-y-2">
                {data.monthlyData.map((item) => (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="w-8 text-xs text-muted-foreground">{item.month}</span>
                    <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded bg-primary transition-all"
                        style={{ width: `${Math.min((item.revenue / Math.max(...data.monthlyData.map(d => d.revenue), 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="w-16 text-xs text-right text-muted-foreground">{item.revenue.toFixed(0)} MC</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No revenue data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="size-5" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>Where your earnings come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>NFT Sales</span>
                  <span className="font-medium">{data?.totalRevenue.toFixed(2) || "0.00"} MC</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: "100%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Royalties</span>
                  <span className="font-medium">0.00 MC</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: "0%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Ticket Revenue</span>
                  <span className="font-medium">0.00 MC</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: "0%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5" />
            Fan Engagement Metrics
          </CardTitle>
          <CardDescription>Track how fans interact with your content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg border">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Votes Received</p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Endorsements</p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <p className="text-2xl font-bold">{data?.nftMinted || 0}</p>
              <p className="text-xs text-muted-foreground">NFT Views</p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Fan Comments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
