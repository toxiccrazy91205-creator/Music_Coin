"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getWalletAction, getTransactionHistoryAction, transferCoinsAction } from "@/features/wallet/wallet.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Wallet, ArrowUpRight, ArrowDownLeft, DollarSign, Download,
  History, TrendingUp, Copy
} from "lucide-react"

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

export default function ArtistWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "withdraw" | "history">("overview")
  const [receiverEmail, setReceiverEmail] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferError, setTransferError] = useState("")
  const [transferSuccess, setTransferSuccess] = useState("")
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    Promise.all([
      getWalletAction(),
      getTransactionHistoryAction(1, 50),
    ]).then(([walletRes]) => {
      if (walletRes.success) setWallet(walletRes.data as unknown as WalletData)
      setLoading(false)
    })
  }, [])

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setTransferError("")
    setTransferSuccess("")
    setTransferring(true)
    const result = await transferCoinsAction(receiverEmail, Number(transferAmount))
    if (result.success) {
      setTransferSuccess(`Successfully sent ${transferAmount} MC!`)
      setReceiverEmail("")
      setTransferAmount("")
      const walletRes = await getWalletAction()
      if (walletRes.success) setWallet(walletRes.data as unknown as WalletData)
    } else {
      setTransferError(result.error ?? "Transfer failed")
    }
    setTransferring(false)
  }

  if (loading) return <p className="text-muted-foreground">Loading wallet...</p>

  const allTxs = [
    ...(wallet?.sentTransactions || []).map((t) => ({ ...t, direction: "sent" as const })),
    ...(wallet?.receivedTransactions || []).map((t) => ({ ...t, direction: "received" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Receive payments, manage tokens, and withdraw revenue</p>
      </div>

      <div className="flex gap-1 rounded-lg border p-1">
        <Button variant={activeTab === "overview" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("overview")}>
          <Wallet className="mr-1 size-4" />
          Overview
        </Button>
        <Button variant={activeTab === "withdraw" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("withdraw")}>
          <Download className="mr-1 size-4" />
          Send / Withdraw
        </Button>
        <Button variant={activeTab === "history" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("history")}>
          <History className="mr-1 size-4" />
          History
        </Button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="size-6 text-primary" />
                  <span className="text-4xl font-bold">{wallet ? Number(wallet.balance).toFixed(2) : "0.00"}</span>
                  <span className="text-lg text-muted-foreground">MC</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-3 text-xs font-mono break-all">
                  {wallet?.id || "No wallet"}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Share this address to receive payments
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receive Payments</CardTitle>
                <CardDescription>Methods to receive MC tokens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">From NFT Sales</p>
                  <p className="text-xs text-muted-foreground">Automatic when users buy your NFTs</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Royalty Payments</p>
                  <p className="text-xs text-muted-foreground">Distributed from secondary sales</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Direct Transfer</p>
                  <p className="text-xs text-muted-foreground">Receive from other users via email</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Token Summary</CardTitle>
                <CardDescription>Your MC token activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wallet Balance</span>
                  <span className="font-medium">{wallet ? Number(wallet.balance).toFixed(2) : "0.00"} MC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Received</span>
                  <span className="font-medium">
                    {wallet?.receivedTransactions
                      ? wallet.receivedTransactions.reduce((s, t) => s + Number(t.amount), 0).toFixed(2)
                      : "0.00"} MC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sent</span>
                  <span className="font-medium">
                    {wallet?.sentTransactions
                      ? wallet.sentTransactions.reduce((s, t) => s + Number(t.amount), 0).toFixed(2)
                      : "0.00"} MC
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "withdraw" && (
        <Card>
          <CardHeader>
            <CardTitle>Send Tokens</CardTitle>
            <CardDescription>Transfer MC tokens or withdraw revenue</CardDescription>
          </CardHeader>
          <form onSubmit={handleTransfer}>
            <CardContent className="space-y-4">
              {transferSuccess && (
                <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800">{transferSuccess}</div>
              )}
              {transferError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{transferError}</div>
              )}
              <div className="space-y-2">
                <Label>Recipient Email</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (MC)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="10.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available: {wallet ? Number(wallet.balance).toFixed(2) : "0.00"} MC
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={transferring}>
                {transferring ? "Sending..." : "Send Transfer"}
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Download className="mr-2 size-4" />
                Withdraw to External Wallet
              </Button>
              <p className="text-xs text-muted-foreground">External withdrawals coming soon</p>
            </CardFooter>
          </form>
        </Card>
      )}

      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All your wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            {allTxs.length === 0 ? (
              <div className="text-center py-8">
                <History className="mx-auto mb-4 size-12 text-muted-foreground" />
                <p className="text-lg font-medium">No transactions yet</p>
                <p className="text-sm text-muted-foreground">Your payment history will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allTxs.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 rounded-lg border p-3">
                    {tx.direction === "sent" ? (
                      <ArrowUpRight className="size-4 text-destructive shrink-0" />
                    ) : (
                      <ArrowDownLeft className="size-4 text-green-600 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tx.type === "DEPOSIT" ? (tx.direction === "sent" ? "Deposit" : "Payment Received") :
                         tx.type === "TRANSFER" ? (tx.direction === "sent" ? "Sent" : "Received") :
                         tx.type === "ROYALTY_PAYMENT" ? "Royalty Payment" :
                         tx.type === "TICKET_PURCHASE" ? "Ticket Revenue" :
                         tx.type}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`text-sm font-medium shrink-0 ${tx.direction === "sent" ? "text-destructive" : "text-green-600"}`}>
                      {tx.direction === "sent" ? "-" : "+"}{Number(tx.amount).toFixed(2)} MC
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
