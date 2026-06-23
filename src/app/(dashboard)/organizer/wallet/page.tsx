"use client"

import { useEffect, useState } from "react"
import { getWalletAction, getTransactionHistoryAction, transferCoinsAction } from "@/features/wallet/wallet.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react"

interface Transaction {
  id: string
  senderId: string
  receiverId: string
  amount: number
  type: string
  createdAt: string
}

interface WalletData {
  id: string
  balance: number
  sentTransactions: Transaction[]
  receivedTransactions: Transaction[]
}

export default function OrganizerWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [receiverEmail, setReceiverEmail] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferError, setTransferError] = useState("")
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    Promise.all([
      getWalletAction(),
      getTransactionHistoryAction(1, 50),
    ]).then(([walletRes, txRes]) => {
      if (walletRes.success) setWallet(walletRes.data as unknown as WalletData)
      if (txRes.success) setTransactions((txRes.data as unknown as { data: Transaction[] }).data)
      setLoading(false)
    })
  }, [])

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setTransferError("")
    setTransferring(true)
    const result = await transferCoinsAction(receiverEmail, Number(transferAmount))
    if (result.success) {
      setReceiverEmail("")
      setTransferAmount("")
      const walletRes = await getWalletAction()
      if (walletRes.success) setWallet(walletRes.data as unknown as WalletData)
    } else {
      setTransferError(result.error ?? "Transfer failed")
    }
    setTransferring(false)
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  const allTxs = [
    ...(wallet?.sentTransactions || []).map((t) => ({ ...t, direction: "sent" as const })),
    ...(wallet?.receivedTransactions || []).map((t) => ({ ...t, direction: "received" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            {wallet ? Number(wallet.balance).toFixed(2) : "0.00"} <span className="text-lg text-muted-foreground">MC</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Coins</CardTitle>
          <CardDescription>Send Music Coins to another user</CardDescription>
        </CardHeader>
        <form onSubmit={handleTransfer}>
          <CardContent className="space-y-4">
            {transferError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{transferError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="receiver">Recipient Email</Label>
              <Input id="receiver" type="email" placeholder="user@example.com" value={receiverEmail} onChange={(e) => setReceiverEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (MC)</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" placeholder="10.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={transferring}>
              {transferring ? "Sending..." : "Send Transfer"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {allTxs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {allTxs.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-lg border p-3">
                  {tx.direction === "sent" ? (
                    <ArrowUpRight className="size-4 text-destructive" />
                  ) : (
                    <ArrowDownLeft className="size-4 text-green-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {tx.type === "DEPOSIT" ? "Deposit" : tx.type === "TRANSFER" ? (tx.direction === "sent" ? "Sent" : "Received") : tx.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${tx.direction === "sent" ? "text-destructive" : "text-green-600"}`}>
                    {tx.direction === "sent" ? "-" : "+"}{Number(tx.amount).toFixed(2)} MC
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
