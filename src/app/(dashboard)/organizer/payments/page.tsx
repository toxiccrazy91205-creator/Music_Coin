"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getWalletAction, getTransactionHistoryAction } from "@/features/wallet/wallet.actions"
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet, History, ArrowLeftRight } from "lucide-react"

interface Transaction {
  id: string
  senderId: string
  receiverId: string
  amount: number
  type: string
  currency: string
  status: string
  createdAt: string
}

interface WalletData {
  id: string
  balance: number
  userId: string
  sentTransactions: Transaction[]
  receivedTransactions: Transaction[]
}

export default function PaymentsPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const walletRes = await getWalletAction()
      if (walletRes.success) {
        const w = walletRes.data as unknown as WalletData
        setWallet(w)

        const txRes = await getTransactionHistoryAction(1, 50)
        if (txRes.success) {
          const txData = txRes.data as unknown as { data: Transaction[]; total: number }
          setAllTransactions(txData.data ?? [])
        } else {
          const combined = [
            ...(w.sentTransactions || []).map((t) => ({ ...t, direction: "sent" })),
            ...(w.receivedTransactions || []).map((t) => ({ ...t, direction: "received" })),
          ]
          setAllTransactions(combined as unknown as Transaction[])
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const incomeTransactions = allTransactions.filter(
    (t) => t.type === "TICKET_PURCHASE" || t.type === "TRANSFER" || t.type === "DEPOSIT",
  )
  const totalLifetimeEarnings = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const pendingTransactions = allTransactions.filter((t) => t.status === "PENDING")
  const pendingTotal = pendingTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading payment data...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payments & Revenue</h1>
          <p className="text-muted-foreground">Manage your event earnings, wallet balance, and payouts.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 shadow-md" disabled>
          <ArrowUpRight className="mr-2 size-4" />
          Request Withdrawal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{wallet ? Number(wallet.balance).toLocaleString() : "0"} MC</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for withdrawal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Clearing</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingTotal.toLocaleString()} MC</div>
            <p className="text-xs text-muted-foreground mt-1">{pendingTransactions.length} pending transaction(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lifetime Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLifetimeEarnings.toLocaleString()} MC</div>
            <p className="text-xs text-muted-foreground mt-1">Across all events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{allTransactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent income from ticket sales and transfers</CardDescription>
        </CardHeader>
        <CardContent>
          {allTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">ID</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allTransactions.slice(0, 50).map((trx) => {
                    const isIncome = trx.type === "TICKET_PURCHASE" || trx.type === "DEPOSIT"
                    return (
                      <tr key={trx.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">{trx.id.slice(0, 12)}...</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(trx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize">{trx.type.replace(/_/g, " ").toLowerCase()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              trx.status === "COMPLETED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : trx.status === "PENDING"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {trx.status}
                          </span>
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-bold ${
                            isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {Number(trx.amount).toLocaleString()} MC
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
