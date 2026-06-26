"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getWalletAction } from "@/features/wallet/wallet.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Coins,
  Lock,
  Unlock,
  Gift,
  ArrowRight
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
  stakedBalance: number
  sentTransactions: Transaction[]
  receivedTransactions: Transaction[]
}

export default function FanTokenPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stakeAmount, setStakeAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [stakeError, setStakeError] = useState("")
  const [stakeSuccess, setStakeSuccess] = useState("")
  const [stakeLoading, setStakeLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "stake" | "history">("overview")

  useEffect(() => {
    getWalletAction().then((res) => {
      if (res.success) setWallet(res.data as unknown as WalletData)
      setLoading(false)
    })
  }, [])

  async function handleStake(e: React.FormEvent) {
    e.preventDefault()
    setStakeError("")
    setStakeSuccess("")
    setStakeLoading(true)
    try {
      const res = await fetch("/api/wallet/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stake", amount: Number(stakeAmount) })
      })
      const data = await res.json()
      if (data.success) {
        setStakeSuccess(`Successfully staked ${stakeAmount} MC!`)
        setStakeAmount("")
        const walletRes = await getWalletAction()
        if (walletRes.success) setWallet(walletRes.data as unknown as WalletData)
      } else {
        setStakeError(data.error || "Staking failed")
      }
    } catch {
      setStakeError("Something went wrong")
    } finally {
      setStakeLoading(false)
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setStakeError("")
    setStakeSuccess("")
    setStakeLoading(true)
    try {
      const res = await fetch("/api/wallet/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdrawStake", amount: Number(withdrawAmount) })
      })
      const data = await res.json()
      if (data.success) {
        setStakeSuccess(`Successfully withdrew ${withdrawAmount} MC!`)
        setWithdrawAmount("")
        const walletRes = await getWalletAction()
        if (walletRes.success) setWallet(walletRes.data as unknown as WalletData)
      } else {
        setStakeError(data.error || "Withdrawal failed")
      }
    } catch {
      setStakeError("Something went wrong")
    } finally {
      setStakeLoading(false)
    }
  }

  const allTxs = [
    ...(wallet?.sentTransactions || []).map((t) => ({ ...t, direction: "sent" as const })),
    ...(wallet?.receivedTransactions || []).map((t) => ({ ...t, direction: "received" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (loading) return <p className="text-muted-foreground">Loading token data...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MusicCoin Token</h1>
        <p className="text-muted-foreground">Manage your MC tokens, stake, and earn rewards</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border p-1">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
        >
          <Coins className="mr-1 size-4" />
          Overview
        </Button>
        <Button
          variant={activeTab === "stake" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("stake")}
        >
          <Lock className="mr-1 size-4" />
          Stake
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("history")}
        >
          <History className="mr-1 size-4" />
          History
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Token Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Coins className="size-6 text-primary" />
                  <span className="text-3xl font-bold">{wallet ? Number(wallet.balance).toFixed(2) : "0.00"}</span>
                  <span className="text-sm text-muted-foreground">MC</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Staked Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Lock className="size-6 text-amber-500" />
                  <span className="text-3xl font-bold">{wallet ? Number(wallet.stakedBalance || 0).toFixed(2) : "0.00"}</span>
                  <span className="text-sm text-muted-foreground">MC</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-6 text-green-500" />
                  <span className="text-3xl font-bold">
                    {wallet ? Number(wallet.balance + (wallet.stakedBalance || 0)).toFixed(2) : "0.00"}
                  </span>
                  <span className="text-sm text-muted-foreground">MC</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="size-5 text-amber-500" />
                  Staking Rewards
                </CardTitle>
                <CardDescription>Earn passive income by staking your MC tokens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">APY</span>
                    <span className="font-medium text-green-600">5.0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min Lock Period</span>
                    <span className="font-medium">14 days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reward Distribution</span>
                    <span className="font-medium">Daily</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setActiveTab("stake")}>
                  <Lock className="mr-2 size-4" />
                  Start Staking
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="size-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Manage your MC tokens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/fan/wallet">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowUpRight className="mr-2 size-4" />
                    Send Tokens
                  </Button>
                </Link>
                <Link href="/fan/wallet">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowDownLeft className="mr-2 size-4" />
                    Receive Tokens
                  </Button>
                </Link>
                <Link href="/fan/marketplace">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-2 size-4" />
                    Trade NFTs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Stake Tab */}
      {activeTab === "stake" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="size-5" />
                Stake Tokens
              </CardTitle>
              <CardDescription>Lock your MC tokens to earn rewards</CardDescription>
            </CardHeader>
            <form onSubmit={handleStake}>
              <CardContent className="space-y-4">
                {stakeSuccess && (
                  <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800">{stakeSuccess}</div>
                )}
                {stakeError && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{stakeError}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="stakeAmount">Amount to Stake (MC)</Label>
                  <Input
                    id="stakeAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={wallet ? Number(wallet.balance) : 0}
                    placeholder="10.00"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {wallet ? Number(wallet.balance).toFixed(2) : "0.00"} MC
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={stakeLoading || !stakeAmount}>
                  {stakeLoading ? "Staking..." : "Stake Tokens"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Unlock className="size-5" />
                Withdraw Tokens
              </CardTitle>
              <CardDescription>Unstake your locked tokens</CardDescription>
            </CardHeader>
            <form onSubmit={handleWithdraw}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount">Amount to Withdraw (MC)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={wallet ? Number(wallet.stakedBalance || 0) : 0}
                    placeholder="10.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Staked: {wallet ? Number(wallet.stakedBalance || 0).toFixed(2) : "0.00"} MC
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" variant="outline" disabled={stakeLoading || !withdrawAmount}>
                  {stakeLoading ? "Withdrawing..." : "Withdraw Tokens"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Transaction History Tab */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allTxs.length === 0 ? (
              <div className="text-center py-8">
                <History className="mx-auto mb-4 size-12 text-muted-foreground" />
                <p className="text-lg font-medium">No transactions yet</p>
                <p className="text-sm text-muted-foreground">Start using your MC tokens to see history</p>
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
                        {tx.type === "DEPOSIT" ? "Deposit" :
                         tx.type === "STAKE" ? "Staked" :
                         tx.type === "UNSTAKE" ? "Unstaked" :
                         tx.type === "TRANSFER" ? (tx.direction === "sent" ? "Sent" : "Received") :
                         tx.type === "TICKET_PURCHASE" ? "Ticket Purchase" :
                         tx.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
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
