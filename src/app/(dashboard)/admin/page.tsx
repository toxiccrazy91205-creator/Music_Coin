"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Calendar, Ticket, ImageIcon, Banknote, ShieldAlert, BarChart3, Database } from "lucide-react"
import { FadeIn } from "@/components/ui/fade-in"
import { ScaleOnHover } from "@/components/ui/scale-on-hover"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts"

const mockRevenueData = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 2000 },
  { name: "Apr", revenue: 2780 },
  { name: "May", revenue: 1890 },
  { name: "Jun", revenue: 2390 },
  { name: "Jul", revenue: 3490 },
]

const mockUserGrowth = [
  { name: "Jan", users: 100 },
  { name: "Feb", users: 250 },
  { name: "Mar", users: 400 },
  { name: "Apr", users: 500 },
  { name: "May", users: 800 },
  { name: "Jun", users: 1200 },
  { name: "Jul", users: 1500 },
]

const mockEventSales = [
  { name: "EDM Fest", tickets: 400 },
  { name: "Jazz Night", tickets: 300 },
  { name: "Rock Arena", tickets: 300 },
  { name: "Indie Pop", tickets: 200 },
]

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
      .catch(() => { setLoading(false); toast.error("Failed to load analytics") })
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
        <FadeIn>
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
        </FadeIn>
      ) : (
        <p className="text-muted-foreground">Failed to load platform analytics.</p>
      )}

      {/* Embedded Advanced Analytics */}
      <div className="pt-6">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Advanced Analytics</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Platform Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockRevenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockUserGrowth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Top Performing Events (Ticket Sales)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockEventSales} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <RechartsTooltip />
                    <Bar dataKey="tickets" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
  return (
    <ScaleOnHover>
      <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
    </ScaleOnHover>
  )
}
