"use client"

import { useEffect, useState } from "react"
import { getNftsAction, buyNftAction } from "@/features/nfts/nft.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Music, ShoppingCart, User, Search, Filter, TrendingUp, Clock, Gavel } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface NftItem {
  id: string
  song: { title: string; description: string }
  price: number
  royaltyPercentage: number
  nftType: string
  status: string
  auctionEndTime: string | null
  highestBid: number | null
  owner: { id: string; name: string }
  createdAt: string
}

export default function FanMarketplacePage() {
  const { user } = useAuth()
  const [nfts, setNfts] = useState<NftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState<"all" | "buy" | "auction">("all")

  async function loadNfts() {
    const res = await getNftsAction()
    if (res.success) setNfts(res.data as unknown as NftItem[])
    setLoading(false)
  }

  useEffect(() => { loadNfts() }, [])

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

  const availableNfts = user
    ? nfts
        .filter((n) => n.owner.id !== user.id)
        .filter((n) =>
          selectedTab === "buy" ? n.status === "LISTED" || n.status === "MINTED" :
          selectedTab === "auction" ? n.status === "AUCTION" : true
        )
        .filter((n) =>
          n.song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.owner.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : []

  if (loading) return <p className="text-muted-foreground">Loading marketplace...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">NFT Marketplace</h1>
        <p className="text-muted-foreground">Discover, buy, sell, and trade music NFTs</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Search & Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search NFTs by name or artist..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          <Button
            variant={selectedTab === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("all")}
          >
            All
          </Button>
          <Button
            variant={selectedTab === "buy" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("buy")}
          >
            <ShoppingCart className="mr-1 size-4" />
            Buy Now
          </Button>
          <Button
            variant={selectedTab === "auction" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("auction")}
          >
            <Gavel className="mr-1 size-4" />
            Auctions
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Listed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{availableNfts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {availableNfts.length > 0
                ? (availableNfts.reduce((s, n) => s + Number(n.price), 0) / availableNfts.length).toFixed(2)
                : "0.00"} <span className="text-sm text-muted-foreground">MC</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Auctions Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{availableNfts.filter((n) => n.status === "AUCTION").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* NFT Grid */}
      {availableNfts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium">No NFTs available</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Check back later for new music NFTs"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {availableNfts.map((nft) => (
            <Card key={nft.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Music className="size-5 text-primary shrink-0" />
                  <CardTitle className="text-base line-clamp-1">{nft.song.title}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2 text-xs">{nft.song.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="size-4 shrink-0" />
                  <span className="line-clamp-1">{nft.owner.name}</span>
                </div>

                {nft.status === "AUCTION" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Bid</span>
                      <span className="text-lg font-bold text-amber-500">
                        {nft.highestBid ? Number(nft.highestBid).toFixed(2) : Number(nft.price).toFixed(2)} MC
                      </span>
                    </div>
                    {nft.auctionEndTime && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        Ends {new Date(nft.auctionEndTime).toLocaleDateString()}
                      </div>
                    )}
                    <Button variant="outline" className="w-full" disabled>
                      <Gavel className="mr-2 size-4" />
                      Place Bid
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Coming soon</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">{Number(nft.price).toFixed(2)} MC</span>
                      <span className="text-xs text-muted-foreground">{nft.royaltyPercentage}% royalty</span>
                    </div>
                    <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {nft.nftType || "SONG"}
                    </span>
                    <Button
                      className="w-full"
                      onClick={() => handleBuy(nft.id)}
                      disabled={buyingId === nft.id}
                    >
                      <ShoppingCart className="mr-2 size-4" />
                      {buyingId === nft.id ? "Buying..." : "Buy NFT"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sell Section Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Sell Your NFTs
          </CardTitle>
          <CardDescription>List your owned NFTs for sale or auction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              NFT selling and auction listing coming soon. You'll be able to list your collection for fixed price or auction.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
