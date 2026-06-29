"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, Activity, Users, BarChart3, ArrowUp, ArrowDown } from "lucide-react"

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface RevenueByContract {
  id: string
  artistName: string
  revenue: number
  share: number
}

interface AnalyticsData {
  totalRevenue: number
  revenueGrowth: number
  activeContracts: number
  totalArtists: number
  monthlyRevenue: MonthlyRevenue[]
  topContracts: RevenueByContract[]
}

export default function PHAnalyticsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/production-house/analytics")
        const json = await res.json()
        if (json.success) {
          setData({
            totalRevenue: json.data.totalRevenue || 0,
            revenueGrowth: json.data.revenueGrowth || 0,
            activeContracts: json.data.activeContracts || 0,
            totalArtists: json.data.totalArtists || 0,
            monthlyRevenue: (json.data.monthlyRevenue || []).map((m: any) => ({
              month: m.month,
              revenue: m.amount || 0
            })),
            topContracts: (json.data.revenueByContract || []).map((c: any, i: number) => ({
              id: String(i),
              artistName: c.name || "Unknown",
              revenue: c.revenue || 0,
              share: c.share || 0
            }))
          });
        }
        else setError(json.error || "Failed to load")
      } catch {} finally {
        setLoading(false)
      }
    }
    if (user?.role === "PRODUCTION_HOUSE") load()
  }, [user])

  if (!user || user.role !== "PRODUCTION_HOUSE") return null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />)}
        </div>
      </div>
    )
  }

  const maxRevenue = data?.monthlyRevenue
    ? Math.max(...data.monthlyRevenue.map((m) => m.revenue), 1)
    : 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Revenue reports and performance metrics</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          <Button variant={period === "7d" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("7d")}>7D</Button>
          <Button variant={period === "30d" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("30d")}>30D</Button>
          <Button variant={period === "90d" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("90d")}>90D</Button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-5 text-emerald-500" />
              <span className="text-2xl font-bold">{data?.totalRevenue?.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {data?.revenueGrowth && data.revenueGrowth >= 0 ? (
                <ArrowUp className="size-5 text-green-500" />
              ) : (
                <ArrowDown className="size-5 text-red-500" />
              )}
              <span className={`text-2xl font-bold ${data?.revenueGrowth && data.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                {Math.abs(data?.revenueGrowth || 0).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-blue-500" />
              <span className="text-2xl font-bold">{data?.activeContracts || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Artists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-purple-500" />
              <span className="text-2xl font-bold">{data?.totalArtists || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Monthly Revenue
            </CardTitle>
            <CardDescription>Revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
              <div className="space-y-2">
                {data.monthlyRevenue.map((item) => (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="w-10 text-xs text-muted-foreground">{item.month}</span>
                    <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded bg-primary transition-all"
                        style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 text-xs text-right text-muted-foreground">{item.revenue.toFixed(2)} MC</span>
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
              <TrendingUp className="size-5" />
              Revenue by Contract
            </CardTitle>
            <CardDescription>Top performing contracts</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.topContracts && data.topContracts.length > 0 ? (
              <div className="space-y-3">
                {data.topContracts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{c.artistName}</p>
                      <p className="text-xs text-muted-foreground">{c.share}% share</p>
                    </div>
                    <span className="text-sm font-medium">{c.revenue.toFixed(2)} MC</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No contract revenue data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
