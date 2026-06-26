"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Calendar, Ticket, ImageIcon, Banknote, ShieldAlert, BarChart3, Database } from "lucide-react"

interface AnalyticsData {
  totalRegisteredUsers: number
  verifiedArtists: number
  eventsCreated: number
  ticketsSold: number
  nftVolume: string
  royaltyPaymentsProcessed: number
  activeFanCommunities: number
  monthlyRevenue: number
  stakingTVL: number
  userRetention: string
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-1/2 rounded bg-muted"></div>
                <div className="h-4 w-4 rounded bg-muted"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-1/3 rounded bg-muted"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Users" value={data.totalRegisteredUsers} icon={Users} />
          <MetricCard title="Verified Artists" value={data.verifiedArtists} icon={UserCheck} />
          <MetricCard title="Events Created" value={data.eventsCreated} icon={Calendar} />
          <MetricCard title="Tickets Sold" value={data.ticketsSold} icon={Ticket} />
          <MetricCard title="NFT Volume" value={data.nftVolume} icon={ImageIcon} />
          <MetricCard title="Royalty Payments" value={data.royaltyPaymentsProcessed} icon={Banknote} />
          <MetricCard title="Active Communities" value={data.activeFanCommunities} icon={Users} />
          <MetricCard title="Monthly Revenue" value={`${data.monthlyRevenue} MC`} icon={BarChart3} />
          <MetricCard title="Staking TVL" value={`${data.stakingTVL} MC`} icon={Database} />
          <MetricCard title="User Retention" value={data.userRetention} icon={ShieldAlert} />
        </div>
      ) : (
        <p className="text-muted-foreground">Failed to load platform analytics.</p>
      )}
    </div>
  )
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
