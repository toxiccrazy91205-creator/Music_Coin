"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Users, DollarSign, Activity, ArrowRight, Bell, TrendingUp, Wallet, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts"

interface DashboardData {
  totalContracts: number
  activeContracts: number
  totalRevenue: number
  pendingRoyalties: number
  stakeholders: number
  recentContracts: { id: string; artist: { name: string; email: string }; revenueSplit: number; royaltySplit: number; createdAt: string }[]
}

export default function PHDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/production-house/dashboard")
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch { toast.error("Failed to load dashboard") } finally {
        setLoading(false)
      }
    }
    if (user?.role === "PRODUCTION_HOUSE") load()
  }, [user])

  if (!user || user.role !== "PRODUCTION_HOUSE") return null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
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
          <h1 className="text-3xl font-bold">Production Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
        <Link href="/production-house/notifications">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 size-4" /> Notifications
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <span className="text-2xl font-bold">{data?.totalContracts || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-green-500" />
              <span className="text-2xl font-bold">{data?.activeContracts || 0}</span>
            </div>
          </CardContent>
        </Card>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Stakeholders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-blue-500" />
              <span className="text-2xl font-bold">{data?.stakeholders || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/production-house/contracts">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <FileText className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">Rights Management</div>
              <div className="text-xs text-muted-foreground">Manage contracts & music rights</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>
        <Link href="/production-house/royalties">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <DollarSign className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">Royalty Management</div>
              <div className="text-xs text-muted-foreground">Track & distribute royalties</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>
        <Link href="/production-house/stakeholders">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <Users className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">Stakeholder Management</div>
              <div className="text-xs text-muted-foreground">Manage shares & stakeholders</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>

      </div>

      {data && data.recentContracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentContracts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="size-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.artist.name}</p>
                    <p className="text-xs text-muted-foreground">{c.artist.email}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{c.revenueSplit}% Rev</p>
                    <p className="text-xs text-muted-foreground">{c.royaltySplit}% Royalty</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Embedded Analytics Component */}
      <div className="pt-6">
        <ProductionHouseAnalytics />
      </div>
    </div>
  )
}

function ProductionHouseAnalytics() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/production-house/analytics")
        const json = await res.json()
        if (json.success) {
          setData({
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
      } catch {} finally {
        setLoading(false)
      }
    }
    if (user?.role === "PRODUCTION_HOUSE") load()
  }, [user])

  if (!data) return null
  const maxRevenue = data.monthlyRevenue ? Math.max(...data.monthlyRevenue.map((m:any) => m.revenue), 1) : 1

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics</h2>
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
            {data.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
              <div className="space-y-2">
                {data.monthlyRevenue.map((item: any) => (
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
            {data.topContracts && data.topContracts.length > 0 ? (
              <div className="space-y-3">
                {data.topContracts.map((c: any) => (
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
