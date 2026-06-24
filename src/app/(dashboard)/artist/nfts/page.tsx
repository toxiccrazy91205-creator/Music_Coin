"use client"

import { useEffect, useState, useCallback } from "react"
import { mintNftAction, getNftsAction } from "@/features/nfts/nft.actions"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ImageIcon, Music } from "lucide-react"

interface NftItem {
  id: string
  song: { title: string; description: string }
  price: number
  royaltyPercentage: number
  owner: { id: string; name: string }
}

export default function ArtistNfts() {
  const { user } = useAuth()
  const [nfts, setNfts] = useState<NftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [royaltyPct, setRoyaltyPct] = useState("")
  const [minting, setMinting] = useState(false)
  const [error, setError] = useState("")

  const loadNfts = useCallback(async () => {
    const res = await getNftsAction()
    if (res.success) {
      const all = res.data as unknown as NftItem[]
      setNfts(all.filter((n) => n.owner.id === user?.id))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { loadNfts() }, [loadNfts])

  async function handleMint(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMinting(true)
    const result = await mintNftAction({
      title,
      description,
      price: Number(price),
      royaltyPercentage: Number(royaltyPct),
    })
    if (result.success) {
      setTitle("")
      setDescription("")
      setPrice("")
      setRoyaltyPct("")
      loadNfts()
    } else {
      setError(result.error ?? "Something went wrong")
    }
    setMinting(false)
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My NFTs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Mint New NFT</CardTitle>
          <CardDescription>Upload song metadata and create an NFT</CardDescription>
        </CardHeader>
        <form onSubmit={handleMint}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Song Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer Vibes" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A catchy summer track" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (MC)</Label>
                <Input id="price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="50" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="royalty">Royalty %</Label>
                <Input id="royalty" type="number" min="0" max="100" value={royaltyPct} onChange={(e) => setRoyaltyPct(e.target.value)} placeholder="10" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={minting}>
              {minting ? "Minting..." : "Mint NFT"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Your NFTs</h2>
        {nfts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">No NFTs yet</p>
              <p className="text-sm text-muted-foreground">Mint your first NFT above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nfts.map((nft) => (
              <Card key={nft.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Music className="size-5 text-primary" />
                    <CardTitle className="text-lg">{nft.song.title}</CardTitle>
                  </div>
                  <CardDescription>{nft.song.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Price:</span> {Number(nft.price).toFixed(2)} MC</p>
                  <p><span className="text-muted-foreground">Royalty:</span> {nft.royaltyPercentage}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
