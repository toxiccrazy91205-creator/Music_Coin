"use client"

import { useEffect, useState } from "react"
import { getWalletAction, getTransactionHistoryAction, transferCoinsAction } from "@/features/wallet/wallet.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowUpRight, ArrowDownLeft, Wallet, ImageIcon } from "lucide-react"
import Link from "next/link"

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

export default function FanWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "send" | "receive" | "nfts">("overview")
  const [receiverEmail, setReceiverEmail] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferError, setTransferError] = useState("")
  const [transferSuccess, setTransferSuccess] = useState("")
  const [transferring, setTransferring] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getWalletAction(),
      getTransactionHistoryAction(1, 50),
    ]).then(([walletRes]) => {
      if (walletRes.success) {
        const data = walletRes.data as unknown as WalletData
        setWallet(data)
        setWalletAddress(("0x" + Math.random().toString(36).substring(2, 42)) as string)
      }
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
      setTransferSuccess(`Successfully sent ${transferAmount} MC to ${receiverEmail}!`)
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
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Manage your MC tokens, connect wallet, and store NFTs</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg border p-1 flex-wrap">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
        >
          <Wallet className="mr-1 size-4" />
          Overview
        </Button>
        <Button
          variant={activeTab === "send" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("send")}
        >
          <ArrowUpRight className="mr-1 size-4" />
          Send
        </Button>
        <Button
          variant={activeTab === "receive" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("receive")}
        >
          <ArrowDownLeft className="mr-1 size-4" />
          Receive
        </Button>
        <Button
          variant={activeTab === "nfts" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("nfts")}
        >
          <ImageIcon className="mr-1 size-4" />
          NFTs
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Balance & Wallet Connect */}
          <div className="grid gap-4 md:grid-cols-2">
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
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="size-5 text-muted-foreground" />
                  Wallet Connection
                </CardTitle>
              </CardHeader>
              <CardContent>
                {walletAddress ? (
                  <div className="space-y-2">
                    <div className="rounded-lg bg-muted p-2 text-xs break-all">
                      <p className="font-mono">{walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>Disconnect</Button>
                      <Button variant="outline" size="sm" disabled>View on Chain</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">External blockchain connection coming soon</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button variant="outline" disabled>
                      <Wallet className="mr-2 size-4" />
                      Connect Wallet
                    </Button>
                    <p className="text-xs text-muted-foreground">Connect MetaMask or WalletConnect (coming soon)</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your tokens and NFTs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button variant="outline" className="h-auto py-4" onClick={() => setActiveTab("send")}>
                  <ArrowUpRight className="mr-2 size-5" />
                  <div className="text-left">
                    <div className="font-medium">Send</div>
                    <div className="text-xs text-muted-foreground">Transfer MC tokens</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4" onClick={() => setActiveTab("receive")}>
                  <ArrowDownLeft className="mr-2 size-5" />
                  <div className="text-left">
                    <div className="font-medium">Receive</div>
                    <div className="text-xs text-muted-foreground">Get MC tokens</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4" onClick={() => setActiveTab("nfts")}>
                  <ImageIcon className="mr-2 size-5" />
                  <div className="text-left">
                    <div className="font-medium">NFTs</div>
                    <div className="text-xs text-muted-foreground">Store & view NFTs</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
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
                          {tx.type === "DEPOSIT" ? "Welcome Bonus" : tx.type === "TRANSFER" ? (tx.direction === "sent" ? "Sent" : "Received") : tx.type}
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
      )}

      {/* Send Tab */}
      {activeTab === "send" && (
        <Card>
          <CardHeader>
            <CardTitle>Send Tokens</CardTitle>
            <CardDescription>Transfer MC tokens to another user</CardDescription>
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
                <Label htmlFor="receiver">Recipient Email</Label>
                <Input id="receiver" type="email" placeholder="user@example.com" value={receiverEmail} onChange={(e) => setReceiverEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (MC)</Label>
                <Input id="amount" type="number" step="0.01" min="0.01" placeholder="10.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} required />
                <p className="text-xs text-muted-foreground">
                  Available: {wallet ? Number(wallet.balance).toFixed(2) : "0.00"} MC
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={transferring} className="w-full">
                {transferring ? "Sending..." : "Send Transfer"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Receive Tab */}
      {activeTab === "receive" && (
        <Card>
          <CardHeader>
            <CardTitle>Receive Tokens</CardTitle>
            <CardDescription>Share your wallet address to receive MC tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 text-center">
              <Wallet className="mx-auto mb-3 size-12 text-muted-foreground" />
              <p className="text-sm font-medium">Your Wallet Address</p>
              <div className="mt-2 rounded-lg bg-muted p-3">
                <p className="text-xs font-mono break-all">
                  {wallet?.id || "mc_wallet_" + (wallet?.id?.slice(0, 8) || "xxxx")}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Share this address to receive MC tokens from other users
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">How to receive tokens:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Copy your wallet address above</li>
                <li>Share it with the sender (your email is also usable)</li>
                <li>Once sent, the tokens will appear in your balance</li>
                <li>Check transaction history to confirm receipt</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NFTs Tab */}
      {activeTab === "nfts" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-5" />
              My NFT Collection
            </CardTitle>
            <CardDescription>View and manage your stored NFTs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <ImageIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">No NFTs stored in wallet</p>
              <p className="text-sm text-muted-foreground">Purchase NFTs from the marketplace to see them here</p>
              <Link href="/fan/marketplace">
                <Button className="mt-4">Browse Marketplace</Button>
              </Link>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-xs text-muted-foreground">
                NFT storage and management within the wallet is coming soon. Your purchased NFTs will be viewable here along with their metadata, blockchain details, and transfer capabilities.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
