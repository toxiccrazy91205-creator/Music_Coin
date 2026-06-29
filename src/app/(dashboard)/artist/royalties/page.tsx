"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DollarSign, TrendingUp, History, FileText, ArrowUpRight, ArrowDownLeft,
  Music, CheckCircle, Clock
} from "lucide-react"

interface RoyaltyEntry {
  id: string
  amount: number
  percentage: number | null
  paidAt: string | null
  createdAt: string
  nft: { song: { title: string } }
}

interface RoyaltySummary {
  totalEarned: number
  pendingAmount: number
  paidAmount: number
  count: number
  entries: RoyaltyEntry[]
}

export default function ArtistRoyaltiesPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<RoyaltySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "reports">("overview")

  useEffect(() => {
    async function loadRoyalties() {
      try {
        const [royaltyRes, walletRes] = await Promise.all([
          fetch("/api/royalties/history").then(r => r.json()).catch(() => ({})),
          fetch("/api/wallet").then(r => r.json()).catch(() => ({})),
        ])

        if (royaltyRes.success && royaltyRes.data) {
          const entries = royaltyRes.data.royalties || []
          const totalEarned = entries.reduce((s: number, r: RoyaltyEntry) => s + Number(r.amount), 0)
          const pending = entries.filter((r: RoyaltyEntry) => !r.paidAt)
          const paid = entries.filter((r: RoyaltyEntry) => r.paidAt)

          setSummary({
            totalEarned,
            pendingAmount: pending.reduce((s: number, r: RoyaltyEntry) => s + Number(r.amount), 0),
            paidAmount: paid.reduce((s: number, r: RoyaltyEntry) => s + Number(r.amount), 0),
            count: entries.length,
            entries,
          })
        } else {
          setSummary({
            totalEarned: 0,
            pendingAmount: 0,
            paidAmount: 0,
            count: 0,
            entries: [],
          })
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    loadRoyalties()
  }, [])

  if (loading) return <p className="text-muted-foreground">Loading royalty data...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Royalties</h1>
        <p className="text-muted-foreground">Track your NFT earnings and royalty payments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-6 text-green-500" />
              <span className="text-3xl font-bold">{summary?.totalEarned?.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="size-6 text-amber-500" />
              <span className="text-3xl font-bold">{summary?.pendingAmount?.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-6 text-blue-500" />
              <span className="text-3xl font-bold">{summary?.paidAmount?.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 rounded-lg border p-1">
        <Button variant={activeTab === "overview" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("overview")}>
          <TrendingUp className="mr-1 size-4" />
          Overview
        </Button>
        <Button variant={activeTab === "history" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("history")}>
          <History className="mr-1 size-4" />
          Payment History
        </Button>
        <Button variant={activeTab === "reports" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("reports")}>
          <FileText className="mr-1 size-4" />
          Reports
        </Button>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Tracking</CardTitle>
              <CardDescription>Earnings from NFT sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">From NFT Sales</span>
                  <span className="font-medium">{summary?.totalEarned?.toFixed(2) || "0.00"} MC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Payment</span>
                  <span className="font-medium text-amber-600">{summary?.pendingAmount?.toFixed(2) || "0.00"} MC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid to Wallet</span>
                  <span className="font-medium text-green-600">{summary?.paidAmount?.toFixed(2) || "0.00"} MC</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total Royalties</span>
                  <span>{summary?.totalEarned?.toFixed(2) || "0.00"} MC</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Royalties</CardTitle>
              <CardDescription>Latest royalty earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {summary?.entries && summary.entries.length > 0 ? (
                <div className="space-y-2">
                  {summary.entries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 rounded-lg border p-2">
                      <Music className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{entry.nft.song.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.paidAt ? "Paid" : "Pending"} — {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-green-600">+{Number(entry.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DollarSign className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No royalties yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>All royalty payments received</CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.entries && summary.entries.length > 0 ? (
              <div className="space-y-2">
                {summary.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 rounded-lg border p-3">
                    {entry.paidAt ? (
                      <ArrowDownLeft className="size-4 text-green-600 shrink-0" />
                    ) : (
                      <Clock className="size-4 text-amber-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.nft.song.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.paidAt
                          ? `Paid ${new Date(entry.paidAt).toLocaleDateString()}`
                          : `Created ${new Date(entry.createdAt).toLocaleDateString()} (Pending)`}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      +{Number(entry.amount).toFixed(2)} MC
                    </span>
                    {entry.percentage && (
                      <span className="text-xs text-muted-foreground">({entry.percentage}%)</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="mx-auto mb-4 size-12 text-muted-foreground" />
                <p className="text-lg font-medium">No payment history</p>
                <p className="text-sm text-muted-foreground">Royalty payments will appear here when your NFTs are sold</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "reports" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Royalty Reports
            </CardTitle>
            <CardDescription>Download royalty reports and summaries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Royalty Summary Report</p>
                    <p className="text-xs text-muted-foreground">Complete earnings breakdown</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <FileText className="mr-2 size-4" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Tax Statement</p>
                    <p className="text-xs text-muted-foreground">Annual earnings for tax purposes</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <FileText className="mr-2 size-4" />
                    Download
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">Report generation coming soon</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
