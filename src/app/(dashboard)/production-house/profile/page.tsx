"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Shield, Wallet, Save } from "lucide-react"

interface ProfileData {
  companyName: string
  email: string
  role: string
  walletId: string
  balance: number
}

export default function PHProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [profile, setProfile] = useState<ProfileData>({
    companyName: "",
    email: "",
    role: "PRODUCTION_HOUSE",
    walletId: "",
    balance: 0,
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/production-house/profile")
        const json = await res.json()
        if (json.success) {
          const { user, wallet } = json.data
          setProfile({
            companyName: user.name || "",
            email: user.email || "",
            role: user.role || "PRODUCTION_HOUSE",
            walletId: wallet?.id || "",
            balance: wallet ? Number(wallet.balance) : 0,
          })
        }
        else setError(json.error || "Failed to load profile")
      } catch {} finally {
        setLoading(false)
      }
    }
    if (user?.role === "PRODUCTION_HOUSE") load()
  }, [user])

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/production-house/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: profile.companyName }),
      })
      const json = await res.json()
      if (json.success) setSuccess("Profile saved!")
      else setError(json.error || "Save failed")
    } catch {
      setError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (!user || user.role !== "PRODUCTION_HOUSE") return null

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your production house profile</p>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 dark:bg-green-950/50 p-3 text-sm text-green-700 dark:text-green-400">{success}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Basic Info
          </CardTitle>
          <CardDescription>Your production house details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              placeholder="Enter company name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <Input value={profile.email} disabled className="bg-muted/50" />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              <Input value={profile.role} disabled className="bg-muted/50" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 size-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            Wallet
          </CardTitle>
          <CardDescription>Your connected wallet information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wallet ID</span>
            <span className="font-mono text-xs">{profile.walletId || "Not connected"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-medium">{profile.balance.toFixed(2)} MC</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
