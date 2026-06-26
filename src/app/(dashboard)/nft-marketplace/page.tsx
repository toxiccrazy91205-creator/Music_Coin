"use client"

import { useEffect, useState, useCallback } from "react"
import { getNftsAction, buyNftAction } from "@/features/nfts/nft.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Music, ShoppingCart, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface NftItem {
  id: string
  song: { title: string; description: string }
  price: number
  royaltyPercentage: number
  owner: { id: string; name: string }
}

export default function NftMarketplace() {
  const { user } = useAuth()
  const [nfts, setNfts] = useState<NftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const loadNfts = useCallback(async () => {
    try {
      const res = await getNftsAction()
      if (res.success) setNfts(res.data as unknown as NftItem[])
    } catch {
      toast.error("Failed to load NFTs")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    loadNfts().then(() => {
      if (!mounted) return
    })
    return () => { mounted = false }
  }, [loadNfts])

  async function handleBuy(nftId: string) {
    setError("")
    setBuyingId(nftId)
    const result = await buyNftAction(nftId)
    if (result.success) {
      loadNfts()
    } else {
      setError(result.error ?? "Purchase failed")
    }
    setBuyingId(null)
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  const availableNfts = user ? nfts.filter((n) => n.owner.id !== user.id) : nfts

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">NFT Marketplace</h1>
        <p className="text-muted-foreground">Discover and collect music NFTs from your favorite artists</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {availableNfts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium">No NFTs available</p>
            <p className="text-sm text-muted-foreground">Check back later for new music NFTs.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableNfts.map((nft) => (
            <Card key={nft.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Music className="size-5 text-primary" />
                  <CardTitle className="text-lg">{nft.song.title}</CardTitle>
                </div>
                <CardDescription>{nft.song.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="size-4" />
                  {nft.owner.name}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{Number(nft.price).toFixed(2)} MC</span>
                  <span className="text-xs text-muted-foreground">{nft.royaltyPercentage}% royalty</span>
                </div>
                {user && nft.owner.id !== user.id && (
                  <Button
                    className="w-full"
                    onClick={() => handleBuy(nft.id)}
                    disabled={buyingId === nft.id}
                  >
                    <ShoppingCart className="mr-2 size-4" />
                    {buyingId === nft.id ? "Buying..." : "Buy NFT"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
