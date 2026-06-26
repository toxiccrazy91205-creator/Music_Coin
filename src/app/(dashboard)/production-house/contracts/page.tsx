"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Edit, Plus } from "lucide-react"

type Contract = {
  id: string
  artist: { name: string; email: string }
  revenueSplit: number
  royaltySplit: number
  createdAt: string
}

export default function ProductionContractsPage() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [artistId, setArtistId] = useState("")
  const [revenueSplit, setRevenueSplit] = useState(50)
  const [royaltySplit, setRoyaltySplit] = useState(50)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  useEffect(() => {
    async function fetchContracts() {
      try {
        const response = await fetch("/api/production-house/contracts")
        if (!response.ok) throw new Error("Failed to fetch contracts")
        const json = await response.json()
        if (json.success) setContracts(json.data)
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "PRODUCTION_HOUSE") fetchContracts()
  }, [user])

  const createContract = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    try {
      const response = await fetch("/api/production-house/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, revenueSplit: Number(revenueSplit), royaltySplit: Number(royaltySplit) }),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error || "Failed to create contract")
      window.location.reload()
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      setIsSubmitting(false)
    }
  }

  if (!user || user.role !== "PRODUCTION_HOUSE") return <div>Unauthorized</div>
  if (loading) return <div>Loading contracts...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Artist Contracts</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-4" />
                Create New Contract
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-2 rounded">{error}</div>}
              <form onSubmit={createContract} className="space-y-4">
                <div className="space-y-2">
                  <Label>Artist ID</Label>
                  <Input
                    type="text"
                    required
                    value={artistId}
                    onChange={(e) => setArtistId(e.target.value)}
                    placeholder="Enter artist UUID..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revenue Split (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={revenueSplit}
                    onChange={(e) => setRevenueSplit(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Royalty Split (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={royaltySplit}
                    onChange={(e) => setRoyaltySplit(Number(e.target.value))}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Creating..." : "Save Contract"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {selectedContract && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-4" />
                  Rights Holder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Artist</span>
                  <span className="font-medium">{selectedContract.artist.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span>{selectedContract.artist.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenue Split</span>
                  <span className="font-medium">{selectedContract.revenueSplit}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Royalty Split</span>
                  <span className="font-medium">{selectedContract.royaltySplit}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Signed Date</span>
                  <span>{new Date(selectedContract.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Contracts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">Artist</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Revenue Split</th>
                      <th className="px-4 py-3 font-medium">Royalty Split</th>
                      <th className="px-4 py-3 font-medium">Signed Date</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {contracts.map((contract) => (
                      <tr
                        key={contract.id}
                        className={`hover:bg-muted/50 cursor-pointer ${selectedContract?.id === contract.id ? "bg-muted/30" : ""}`}
                        onClick={() => setSelectedContract(contract)}
                      >
                        <td className="px-4 py-3 font-medium">{contract.artist.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{contract.artist.email}</td>
                        <td className="px-4 py-3">{contract.revenueSplit}%</td>
                        <td className="px-4 py-3">{contract.royaltySplit}%</td>
                        <td className="px-4 py-3">{new Date(contract.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" disabled>
                            <Edit className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {contracts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                          No contracts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
