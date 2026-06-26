"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Users, DollarSign, Activity, ArrowRight, Bell, TrendingUp, Wallet } from "lucide-react"
import { toast } from "sonner"

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
              <span className="text-2xl font-bold">{data?.totalRevenue.toFixed(2) || "0.00"}</span>
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
        <Link href="/production-house/analytics">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <TrendingUp className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">Analytics</div>
              <div className="text-xs text-muted-foreground">Revenue reports & performance</div>
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
    </div>
  )
}
