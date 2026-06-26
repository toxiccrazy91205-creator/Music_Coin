"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

type RevenueTransaction = {
  id: string
  amount: string
  currency: string
  type: string
  createdAt: string
}

type RevenueData = {
  totalRevenue: number
  transactions: RevenueTransaction[]
}

export default function RevenueReportsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const response = await fetch("/api/admin/revenue")
        if (response.ok) {
          const json = await response.json()
          if (json.success) setData(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch revenue", err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "ADMIN") fetchRevenue()
  }, [user])

  if (!user || user.role !== "ADMIN") return null
  if (loading) return <div className="animate-pulse">Loading revenue data...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Revenue Reports</h1>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-primary-foreground">Total Platform Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data?.totalRevenue?.toLocaleString()} MC</div>
            <p className="text-xs text-primary-foreground/70 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission & Fee Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Revenue Type</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium text-right">Currency</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/20 transition-colors bg-card">
                    <td className="px-6 py-4 text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium">{tx.type.replace(/_/g, " ")}</td>
                    <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">+{tx.amount}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{tx.currency}</td>
                  </tr>
                ))}
                {data?.transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No revenue transactions recorded yet.
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
