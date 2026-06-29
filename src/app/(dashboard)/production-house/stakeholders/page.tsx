"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, DollarSign, Plus, Save, X, Edit2 } from "lucide-react"

interface Stakeholder {
  id: string
  contractName: string
  artistId: string
  artistName: string
  revenueShare: number
  royaltyShare: number
  totalEarned: number
}

interface StakeholdersData {
  totalStakeholders: number
  totalRevenueLocked: number
  stakeholders: Stakeholder[]
}

export default function PHStakeholdersPage() {
  const { user } = useAuth()
  const [data, setData] = useState<StakeholdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [contractName, setContractName] = useState("")
  const [artistId, setArtistId] = useState("")
  const [revenueShare, setRevenueShare] = useState(0)
  const [royaltyShare, setRoyaltyShare] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRevenue, setEditRevenue] = useState(0)
  const [editRoyalty, setEditRoyalty] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/production-house/stakeholders")
        const json = await res.json()
        if (json.success) {
          const splits = json.data || [];
          setData({
            totalStakeholders: splits.length,
            totalRevenueLocked: splits.reduce((sum: number, s: any) => sum + Number(s.totalRevenue || 0), 0),
            stakeholders: splits.map((s: any) => ({
              id: s.id,
              contractName: s.contractName || "Unnamed Contract",
              artistId: s.artistId,
              artistName: s.artist?.name || "Unknown Artist",
              revenueShare: s.productionHousePercentage || 0,
              royaltyShare: s.artistPercentage || 0,
              totalEarned: Number(s.totalRevenue || 0)
            }))
          });
        }
        else setError(json.error || "Failed to load")
      } catch {} finally {
        setLoading(false)
      }
    }
    if (user?.role === "PRODUCTION_HOUSE") load()
  }, [user])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/production-house/stakeholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractName, artistId, revenueShare: Number(revenueShare), royaltyShare: Number(royaltyShare) }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccess("Stakeholder added!")
        setContractName("")
        setArtistId("")
        setRevenueShare(0)
        setRoyaltyShare(0)
        const reload = await fetch("/api/production-house/stakeholders")
        const reloadJson = await reload.json()
        if (reloadJson.success) {
          const splits = reloadJson.data || [];
          setData({
            totalStakeholders: splits.length,
            totalRevenueLocked: splits.reduce((sum: number, s: any) => sum + Number(s.totalRevenue || 0), 0),
            stakeholders: splits.map((s: any) => ({
              id: s.id,
              contractName: s.contractName || "Unnamed Contract",
              artistId: s.artistId,
              artistName: s.artist?.name || "Unknown Artist",
              revenueShare: s.productionHousePercentage || 0,
              royaltyShare: s.artistPercentage || 0,
              totalEarned: Number(s.totalRevenue || 0)
            }))
          });
        }
      } else {
        setError(json.error || "Failed to add")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEdit(stakeholder: Stakeholder) {
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/production-house/stakeholders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: stakeholder.id,
          revenueShare: Number(editRevenue),
          royaltyShare: Number(editRoyalty),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccess("Shares updated!")
        setEditingId(null)
        const reload = await fetch("/api/production-house/stakeholders")
        const reloadJson = await reload.json()
        if (reloadJson.success) {
          const splits = reloadJson.data || [];
          setData({
            totalStakeholders: splits.length,
            totalRevenueLocked: splits.reduce((sum: number, s: any) => sum + Number(s.totalRevenue || 0), 0),
            stakeholders: splits.map((s: any) => ({
              id: s.id,
              contractName: s.contractName || "Unnamed Contract",
              artistId: s.artistId,
              artistName: s.artist?.name || "Unknown Artist",
              revenueShare: s.productionHousePercentage || 0,
              royaltyShare: s.artistPercentage || 0,
              totalEarned: Number(s.totalRevenue || 0)
            }))
          });
        }
      } else {
        setError(json.error || "Update failed")
      }
    } catch {
      setError("Something went wrong")
    }
  }

  if (!user || user.role !== "PRODUCTION_HOUSE") return null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stakeholder Management</h1>
        <p className="text-muted-foreground">Manage stakeholder shares and revenue distribution</p>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 dark:bg-green-950/50 p-3 text-sm text-green-700 dark:text-green-400">{success}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stakeholders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="size-6 text-blue-500" />
              <span className="text-3xl font-bold">{data?.totalStakeholders || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-6 text-emerald-500" />
              <span className="text-3xl font-bold">{data?.totalRevenueLocked?.toFixed(2) || "0.00"}</span>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-4" />
                Add Stakeholder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Contract Name</Label>
                  <Input
                    type="text"
                    required
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    placeholder="e.g. Album A Royalty Split"
                  />
                </div>
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
                  <Label>Revenue Share (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={revenueShare}
                    onChange={(e) => setRevenueShare(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Royalty Share (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={royaltyShare}
                    onChange={(e) => setRoyaltyShare(Number(e.target.value))}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Adding..." : "Add Stakeholder"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Stakeholders</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.stakeholders && data.stakeholders.length > 0 ? (
                <div className="space-y-3">
                  {data.stakeholders.map((s) => (
                    <div key={s.id} className="rounded-lg border p-4">
                      {editingId === s.id ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">{s.artistName}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Revenue Share (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editRevenue}
                                onChange={(e) => setEditRevenue(Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Royalty Share (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editRoyalty}
                                onChange={(e) => setEditRoyalty(Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleEdit(s)}>
                              <Save className="mr-1 size-3" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              <X className="mr-1 size-3" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{s.artistName}</p>
                            <p className="text-xs text-muted-foreground">{s.contractName}</p>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>Revenue: {s.revenueShare}%</span>
                              <span>Royalty: {s.royaltyShare}%</span>
                              <span>Earned: {s.totalEarned.toFixed(2)} MC</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(s.id)
                              setEditRevenue(s.revenueShare)
                              setEditRoyalty(s.royaltyShare)
                            }}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto mb-3 size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No stakeholders added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
