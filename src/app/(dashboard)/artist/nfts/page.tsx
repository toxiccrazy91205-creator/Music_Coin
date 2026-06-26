"use client"

import { useEffect, useState } from "react"
import { mintNftAction, getNftsAction } from "@/features/nfts/nft.actions"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Music, Image, Plus, FolderOpen, DollarSign, Percent, LayoutGrid, List } from "lucide-react"

interface NftItem {
  id: string
  song: { title: string; description: string }
  price: number
  royaltyPercentage: number
  nftType: string
  status: string
  owner: { id: string; name: string }
  createdAt: string
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
  const [activeTab, setActiveTab] = useState<"mint" | "collections" | "manage">("mint")
  const [nftType, setNftType] = useState("SONG")

  async function loadNfts() {
    const res = await getNftsAction()
    if (res.success) {
      const all = res.data as unknown as NftItem[]
      setNfts(all.filter((n) => n.owner.id === user?.id))
    }
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true
    loadNfts().then(() => { if (!mounted) return })
    return () => { mounted = false }
  }, [user])

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

  const listedNfts = nfts.filter(n => n.status === "LISTED" || n.status === "MINTED")
  const soldNfts = nfts.filter(n => n.status === "SOLD")
  const totalValue = nfts.reduce((sum, n) => sum + Number(n.price), 0)

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">NFT Management</h1>
        <p className="text-muted-foreground">Mint, manage, and track your NFT collections</p>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Minted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{nfts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Listed for Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{listedNfts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Collection Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{totalValue.toFixed(2)} <span className="text-sm text-muted-foreground">MC</span></p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 rounded-lg border p-1">
        <Button variant={activeTab === "mint" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("mint")}>
          <Plus className="mr-1 size-4" />
          Mint New
        </Button>
        <Button variant={activeTab === "manage" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("manage")}>
          <LayoutGrid className="mr-1 size-4" />
          My Collection
        </Button>
        <Button variant={activeTab === "collections" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("collections")}>
          <FolderOpen className="mr-1 size-4" />
          Collections
        </Button>
      </div>

      {activeTab === "mint" && (
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
              <div className="space-y-2">
                <Label>NFT Type</Label>
                <select
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
                  value={nftType}
                  onChange={(e) => setNftType(e.target.value)}
                >
                  <option value="SONG">Song</option>
                  <option value="ALBUM">Album</option>
                  <option value="CONCERT">Concert</option>
                  <option value="COLLECTIBLE">Collectible</option>
                  <option value="VIP_PASS">VIP Pass</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    <DollarSign className="mr-1 size-3 inline" />
                    Price (MC)
                  </Label>
                  <Input id="price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="50" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="royalty">
                    <Percent className="mr-1 size-3 inline" />
                    Royalty %
                  </Label>
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
      )}

      {activeTab === "manage" && (
        <div className="space-y-3">
          {nfts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Image className="mx-auto mb-4 size-12 text-muted-foreground" />
                <p className="text-lg font-medium">No NFTs yet</p>
                <p className="text-sm text-muted-foreground">Mint your first NFT to start your collection.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nfts.map((nft) => (
                <Card key={nft.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Music className="size-5 text-primary shrink-0" />
                      <CardTitle className="text-lg line-clamp-1">{nft.song.title}</CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">{nft.song.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">{Number(nft.price).toFixed(2)} MC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Royalty</span>
                      <span className="font-medium">{nft.royaltyPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">{nft.nftType || "Song"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-medium ${nft.status === "SOLD" ? "text-green-600" : "text-primary"}`}>
                        {nft.status || "Minted"}
                      </span>
                    </div>
                    {nft.status !== "SOLD" && (
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1" disabled>List</Button>
                        <Button variant="outline" size="sm" className="flex-1" disabled>Edit</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "collections" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="size-5" />
              Collections
            </CardTitle>
            <CardDescription>Organize your NFTs into collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FolderOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">No collections yet</p>
              <p className="text-sm text-muted-foreground">Group your NFTs into themed collections for easier management.</p>
            </div>
            <Button variant="outline" disabled>
              <Plus className="mr-2 size-4" />
              Create Collection
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">Collection management coming soon</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
