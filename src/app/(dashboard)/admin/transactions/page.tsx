"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft, Flag, Info, ShieldAlert } from "lucide-react"

type Transaction = {
  id: string
  amount: string
  currency: string
  paymentGateway: string
  type: string
  status: string
  blockchainHash: string | null
  isFlagged: boolean
  createdAt: string
  sender: {
    user: { name: string; email: string }
  }
  receiver: {
    user: { name: string; email: string }
  }
}

export default function TransactionMonitoringPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch("/api/admin/transactions")
        if (response.ok) {
          const json = await response.json()
          if (json.success) setTransactions(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch transactions", err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "ADMIN") fetchTransactions()
  }, [user])

  const toggleFlag = async (transactionId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, isFlagged: !currentStatus }),
      })
      if (response.ok) {
        const json = await response.json()
        if (json.success) setTransactions((prev) => prev.map((t) => (t.id === transactionId ? json.data : t)))
      }
    } catch (err) {
      alert("Error flagging transaction")
    }
  }

  if (!user || user.role !== "ADMIN") return null
  if (loading) return <div className="animate-pulse">Loading global ledger...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transaction Ledger</h1>
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" /> Blockchain Sync Active
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Sender</th>
                  <th className="px-6 py-4 font-medium">Receiver</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status / Hash</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx.id} className={`hover:bg-muted/20 transition-colors ${tx.isFlagged ? "bg-red-50/50 dark:bg-red-950/20" : "bg-card"}`}>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        {tx.isFlagged && <ShieldAlert className="h-4 w-4 text-red-500" />}
                        {tx.type}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(tx.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.sender?.user?.name || "System"}
                      <div className="text-xs text-muted-foreground">{tx.sender?.user?.email || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.receiver?.user?.name || "System"}
                      <div className="text-xs text-muted-foreground">{tx.receiver?.user?.email || "-"}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      {tx.amount} {tx.currency}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit">
                          {tx.status}
                        </span>
                        {tx.blockchainHash && (
                          <span className="text-[10px] font-mono text-muted-foreground truncate w-32" title={tx.blockchainHash}>
                            {tx.blockchainHash}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant={tx.isFlagged ? "default" : "destructive"}
                        size="sm"
                        onClick={() => toggleFlag(tx.id, tx.isFlagged)}
                      >
                        <Flag className="mr-2 h-4 w-4" /> {tx.isFlagged ? "Unflag" : "Flag"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No transactions recorded.
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
