"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DollarSign, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  sender: string
  receiver: string
  status: string
  createdAt: string
}

interface TransactionsData {
  totalTransactions: number
  totalVolume: number
  transactions: Transaction[]
}

export default function PHTransactionsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<TransactionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/production-house/transactions")
        const json = await res.json()
        if (json.success) setData(json.data)
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
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction Page</h1>
        <p className="text-muted-foreground">View all production house transactions</p>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <RefreshCw className="size-6 text-blue-500" />
              <span className="text-3xl font-bold">{data?.totalTransactions || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-6 text-emerald-500" />
              <span className="text-3xl font-bold">{data?.totalVolume.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Sender</th>
                  <th className="px-4 py-3 font-medium">Receiver</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.transactions && data.transactions.length > 0 ? (
                  data.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs">{tx.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          {tx.type === "CREDIT" || tx.type === "INCOMING" ? (
                            <ArrowDownLeft className="size-3.5 text-green-500" />
                          ) : (
                            <ArrowUpRight className="size-3.5 text-red-500" />
                          )}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{tx.amount.toFixed(2)} MC</td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.sender}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.receiver}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          tx.status === "COMPLETED" || tx.status === "SUCCESS"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                            : tx.status === "PENDING"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                            : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto mb-2 size-8 text-muted-foreground" />
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
