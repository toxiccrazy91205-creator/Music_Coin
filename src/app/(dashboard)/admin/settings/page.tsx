"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save, Percent, Coins } from "lucide-react"

type PlatformConfig = {
  ticketCommissionPercent: string
  nftMarketplaceFeePercent: string
  stakingFeePercent: string
  premiumListingFee: string
  artistVerificationFee: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch("/api/admin/settings/config")
        if (response.ok) {
          const json = await response.json()
          if (json.success) setConfig(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch config", err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "ADMIN") fetchConfig()
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (response.ok) {
        alert("Platform settings saved successfully!")
      }
    } catch (err) {
      alert("Error saving config")
    } finally {
      setSaving(false)
    }
  }

  if (!user || user.role !== "ADMIN") return null
  if (loading) return <div className="animate-pulse">Loading global settings...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Platform Configuration</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" /> Fee Percentages
            </CardTitle>
            <CardDescription>Global commission rates applied to transactions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ticket Sale Commission (%)</Label>
              <Input
                type="number"
                value={config?.ticketCommissionPercent || 0}
                onChange={(e) => setConfig((prev) => prev ? { ...prev, ticketCommissionPercent: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>NFT Marketplace Fee (%)</Label>
              <Input
                type="number"
                value={config?.nftMarketplaceFeePercent || 0}
                onChange={(e) => setConfig((prev) => prev ? { ...prev, nftMarketplaceFeePercent: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Staking Pool Fee (%)</Label>
              <Input
                type="number"
                value={config?.stakingFeePercent || 0}
                onChange={(e) => setConfig((prev) => prev ? { ...prev, stakingFeePercent: e.target.value } : null)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" /> Fixed Fees (MC)
            </CardTitle>
            <CardDescription>Flat rate fees charged in Music Coin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Premium Event Listing Fee</Label>
              <Input
                type="number"
                value={config?.premiumListingFee || 0}
                onChange={(e) => setConfig((prev) => prev ? { ...prev, premiumListingFee: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Artist Verification Fee</Label>
              <Input
                type="number"
                value={config?.artistVerificationFee || 0}
                onChange={(e) => setConfig((prev) => prev ? { ...prev, artistVerificationFee: e.target.value } : null)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
          {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Configuration</>}
        </Button>
      </div>
    </div>
  )
}
