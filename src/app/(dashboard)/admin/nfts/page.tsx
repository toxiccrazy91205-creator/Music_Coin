"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Activity, Music, Tag } from "lucide-react"

type NFT = {
  id: string
  tokenId: string | null
  price: string
  nftType: string
  status: string
  royaltyPercentage: number
  owner: {
    name: string
    email: string
  }
  song: {
    title: string
  }
}

export default function NFTMonitoringPage() {
  const { user } = useAuth()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNfts() {
      try {
        const response = await fetch("/api/admin/nfts")
        if (response.ok) {
          const json = await response.json()
          if (json.success) setNfts(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch NFTs", err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "ADMIN") fetchNfts()
  }, [user])

  const flagFraud = async (nftId: string) => {
    try {
      const response = await fetch("/api/admin/nfts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftId, status: "FLAGGED_FRAUD" }),
      })
      if (response.ok) {
        const json = await response.json()
        if (json.success) setNfts((prev) => prev.map((n) => (n.id === nftId ? json.data : n)))
      }
    } catch (err) {
      alert("Error updating status")
    }
  }

  if (!user || user.role !== "ADMIN") return null
  if (loading) return <div className="animate-pulse">Loading NFT market data...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">NFT Market Monitoring</h1>
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" /> Real-time tracking
        </div>
      </div>

      <div className="grid gap-6">
        {nfts.map((nft) => (
          <Card key={nft.id} className={nft.status === "FLAGGED_FRAUD" ? "border-red-500 bg-red-50/50 dark:bg-red-950/10" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                  <Music className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{nft.song.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">Owned by {nft.owner.name} ({nft.owner.email})</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-bold text-lg">{nft.price} MC</div>
                  <div className="text-xs text-muted-foreground uppercase">{nft.status}</div>
                </div>
                {nft.status !== "FLAGGED_FRAUD" && (
                  <Button variant="destructive" size="sm" onClick={() => flagFraud(nft.id)}>
                    <ShieldAlert className="mr-2 h-4 w-4" /> Flag Fraud
                  </Button>
                )}
                {nft.status === "FLAGGED_FRAUD" && (
                  <div className="flex items-center text-red-600 font-bold text-sm px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-md">
                    <ShieldAlert className="mr-2 h-4 w-4" /> FLAGGED
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-4 flex flex-wrap gap-4 text-sm bg-muted/30 p-3 rounded-md">
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Type:</span> {nft.nftType}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-muted-foreground">Token ID:</span> {nft.tokenId || "Unminted"}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-muted-foreground">Royalty:</span> {nft.royaltyPercentage}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {nfts.length === 0 && (
          <p className="text-muted-foreground">No NFTs found on the platform.</p>
        )}
      </div>
    </div>
  )
}
