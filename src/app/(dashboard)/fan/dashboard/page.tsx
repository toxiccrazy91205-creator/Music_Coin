"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getWalletAction } from "@/features/wallet/wallet.actions"
import { getNftsAction } from "@/features/nfts/nft.actions"
import { getUserTicketsAction } from "@/features/tickets/ticket.actions"
import {
  Wallet,
  Ticket,
  ImageIcon,
  TrendingUp,
  Calendar,
  ArrowRight,
  Music,
  Award,
  Bell,
  Activity
} from "lucide-react"

interface DashboardStats {
  balance: number
  ticketCount: number
  nftCount: number
  recentActivity: ActivityItem[]
}

interface ActivityItem {
  id: string
  type: "TICKET_PURCHASE" | "NFT_PURCHASE" | "TRANSFER" | "VOTE" | "DEPOSIT"
  description: string
  amount?: number
  createdAt: string
}

export default function FanDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [walletRes, nftsRes, ticketsRes] = await Promise.all([
          getWalletAction(),
          getNftsAction(),
          getUserTicketsAction()
        ])

        const balance = walletRes.success ? Number((walletRes.data as any)?.balance || 0) : 0
        const ticketCount = ticketsRes.success ? (ticketsRes.data as any[])?.length || 0 : 0
        const nftCount = nftsRes.success ? (nftsRes.data as any[])?.length || 0 : 0

        // Build recent activity from available data
        const recentActivity: ActivityItem[] = []
        
        if (walletRes.success && (walletRes.data as any)?.sentTransactions) {
          const txs = (walletRes.data as any).sentTransactions.slice(0, 3)
          txs.forEach((tx: any) => {
            recentActivity.push({ id: tx.id,
              type: tx.type,
              description: `${tx.type === "TRANSFER" ? "Sent" : "Spent"} ${Number(tx.amount).toFixed(2)} MC`,
              amount: Number(tx.amount),
              createdAt: tx.createdAt
            })
          })
        }

        setStats({
          balance,
          ticketCount,
          nftCount,
          recentActivity
        })
      } catch (error) {
        console.error("Dashboard load error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name || "Fan"}!</h1>
          <p className="text-muted-foreground">Here's your dashboard overview</p>
        </div>
        <Link href="/fan/notifications">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 size-4" />
            Notifications
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Token Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-primary" />
              <span className="text-2xl font-bold">{stats?.balance.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ticket className="size-5 text-primary" />
              <span className="text-2xl font-bold">{stats?.ticketCount || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">NFT Collection</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Rewards Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="size-5 text-amber-500" />
              <span className="text-2xl font-bold">+1000</span>
              <span className="text-sm text-muted-foreground">MC Welcome</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/fan/events" className="block">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <Calendar className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">Browse Events</div>
              <div className="text-xs text-muted-foreground">Find upcoming concerts</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>

        <Link href="/fan/marketplace" className="block">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <Music className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">NFT Marketplace</div>
              <div className="text-xs text-muted-foreground">Buy & collect NFTs</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>

        <Link href="/fan/wallet" className="block">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <Wallet className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">My Wallet</div>
              <div className="text-xs text-muted-foreground">Manage your tokens</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>

        <Link href="/fan/community" className="block">
          <Button variant="outline" className="h-auto py-4 w-full justify-start">
            <TrendingUp className="mr-2 size-5" />
            <div className="text-left">
              <div className="font-medium">Fan Community</div>
              <div className="text-xs text-muted-foreground">Join clubs & vote</div>
            </div>
            <ArrowRight className="ml-auto size-4" />
          </Button>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    {activity.type === "TICKET_PURCHASE" ? <Ticket className="size-4" /> :
                     activity.type === "NFT_PURCHASE" ? <ImageIcon className="size-4" /> :
                     activity.type === "VOTE" ? <TrendingUp className="size-4" /> :
                     <Wallet className="size-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="mx-auto mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">No recent activity</p>
              <p className="text-sm text-muted-foreground">Start exploring events and collecting NFTs!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
