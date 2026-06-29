"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign, TrendingUp, Clock, Send, FileText } from "lucide-react"

interface RevenueSplit {
  id: string
  artistName: string
  percentage: number
  totalEarned: number
}

interface PaymentTransaction {
  id: string
  amount: number
  recipient: string
  splitName: string
  status: string
  createdAt: string
}

interface RoyaltiesData {
  totalRoyalties: number
  pendingDistributions: number
  lastDistribution: string | null
  revenueSplits: RevenueSplit[]
  paymentHistory: PaymentTransaction[]
}

export default function PHRoyaltiesPage() {
  const { user } = useAuth()
  const [data, setData] = useState<RoyaltiesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [splitId, setSplitId] = useState("")
  const [amount, setAmount] = useState("")
  const [distributing, setDistributing] = useState(false)
  const [success, setSuccess] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/production-house/royalties")
        const json = await res.json()
        if (json.success) setData(json.data)
        else setError(json.error || "Failed to load")
      } catch {} finally {
        setLoading(false)
      }
    }
    if (user?.role === "PRODUCTION_HOUSE") load()
  }, [user])

  async function handleDistribute(e: React.FormEvent) {
    e.preventDefault()
    setDistributing(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/production-house/royalties/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ splitId, amount: Number(amount) }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(`Distributed ${amount} MC successfully!`)
        setSplitId("")
        setAmount("")
        const reload = await fetch("/api/production-house/royalties")
        const reloadJson = await reload.json()
        if (reloadJson.success) setData(reloadJson.data)
      } else {
        setError(json.error || "Distribution failed")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setDistributing(false)
    }
  }

  if (!user || user.role !== "PRODUCTION_HOUSE") return null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Royalty Management</h1>
        <p className="text-muted-foreground">Track and distribute royalty payments</p>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 dark:bg-green-950/50 p-3 text-sm text-green-700 dark:text-green-400">{success}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Royalties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-6 text-emerald-500" />
              <span className="text-3xl font-bold">{data?.totalRoyalties?.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Distributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="size-6 text-amber-500" />
              <span className="text-3xl font-bold">{data?.pendingDistributions?.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-6 text-blue-500" />
              <span className="text-lg font-bold">
                {data?.lastDistribution ? new Date(data.lastDistribution).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Revenue Splits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.revenueSplits && data.revenueSplits.length > 0 ? (
              <div className="space-y-3">
                {data.revenueSplits.map((split) => (
                  <div key={split.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{split.artistName}</p>
                      <p className="text-xs text-muted-foreground">{split.percentage}% share</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{split.totalEarned.toFixed(2)} MC</p>
                      <p className="text-xs text-muted-foreground">earned</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No revenue splits configured</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="size-5" />
              Distribute Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDistribute} className="space-y-4">
              <div className="space-y-2">
                <Label>Revenue Split</Label>
                <select
                  value={splitId}
                  onChange={(e) => setSplitId(e.target.value)}
                  required
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  <option value="">Select a split...</option>
                  {data?.revenueSplits.map((split) => (
                    <option key={split.id} value={split.id}>
                      {split.artistName} ({split.percentage}%)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Amount (MC)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <Button type="submit" disabled={distributing || !splitId || !amount} className="w-full">
                <Send className="mr-2 size-4" />
                {distributing ? "Distributing..." : "Distribute"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.paymentHistory && data.paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {data.paymentHistory.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <DollarSign className="size-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tx.splitName}</p>
                    <p className="text-xs text-muted-foreground">To: {tx.recipient}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{tx.amount.toFixed(2)} MC</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    tx.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400" :
                    tx.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No payment history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
