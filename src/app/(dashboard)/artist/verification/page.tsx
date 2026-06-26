"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Shield, CheckCircle, Clock, AlertCircle, Upload, FileText, Star, Award
} from "lucide-react"

interface VerificationData {
  status: "PENDING" | "APPROVED" | "REJECTED" | "NOT_SUBMITTED"
  reputationScore: number
  documents: string[]
  submittedAt?: string
}

export default function ArtistVerificationPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [verificationData, setVerificationData] = useState<VerificationData>({
    status: "NOT_SUBMITTED",
    reputationScore: 0,
    documents: [],
  })

  useEffect(() => {
    async function loadVerification() {
      try {
        const res = await fetch("/api/artists/me")
        const data = await res.json()
        if (data.data) {
          const artist = data.data
          setVerificationData({
            status: artist.verificationStatus || "NOT_SUBMITTED",
            reputationScore: artist.reputationScore || 0,
            documents: [],
          })
        }
      } catch {}
    }
    loadVerification()
  }, [])

  async function handleSubmitVerification(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/artists/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, status: "PENDING" })
      })
      const data = await res.json()
      if (data.success) {
        setVerificationData(prev => ({ ...prev, status: "PENDING" }))
        setMessage("Verification request submitted! An admin will review your documents.")
      } else {
        setMessage(data.error || "Submission failed")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function statusBadge(status: string) {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"><CheckCircle className="size-4" /> Verified</span>
      case "PENDING":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700"><Clock className="size-4" /> Pending Review</span>
      case "REJECTED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive"><AlertCircle className="size-4" /> Rejected</span>
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground"><Shield className="size-4" /> Not Submitted</span>
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Verification</h1>
        <p className="text-muted-foreground">Verify your identity and build your reputation</p>
      </div>

      {message && (
        <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{message}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">{statusBadge(verificationData.status)}</div>
            {verificationData.status === "APPROVED" && (
              <p className="text-sm text-green-600">Your identity is verified. You can now create events and mint NFTs.</p>
            )}
            {verificationData.status === "PENDING" && (
              <p className="text-sm text-muted-foreground">Your documents are being reviewed. This usually takes 1-2 business days.</p>
            )}
            {verificationData.status === "REJECTED" && (
              <p className="text-sm text-destructive">Your verification was rejected. Please resubmit with correct documents.</p>
            )}
            {verificationData.status === "NOT_SUBMITTED" && (
              <p className="text-sm text-muted-foreground">Submit your documents to become a verified artist.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reputation Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="size-6 text-amber-500" />
              <span className="text-3xl font-bold">{verificationData.reputationScore}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(verificationData.reputationScore, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Identity Documents
          </CardTitle>
          <CardDescription>Submit your identification and artist credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitVerification} className="space-y-4">
            <div className="space-y-2">
              <Label>Government ID (Passport / Driver's License)</Label>
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                <Input type="file" accept="image/*,.pdf" className="hidden" disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Artist Portfolio / Proof of Work</Label>
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload portfolio, music links, or press kit</p>
                <Input type="file" accept="image/*,.pdf" className="hidden" disabled />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <p>Document upload coming soon. Submit your verification request below and an admin will process it.</p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || verificationData.status === "APPROVED" || verificationData.status === "PENDING"}
            >
              {loading ? "Submitting..." :
               verificationData.status === "APPROVED" ? "Already Verified" :
               verificationData.status === "PENDING" ? "Under Review" :
               "Submit Verification Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5" />
            How Reputation Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Complete Verification</p>
                <p className="text-xs text-muted-foreground">+30 points — Verify your identity to unlock all features</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Mint NFTs</p>
                <p className="text-xs text-muted-foreground">+5 points per NFT — Share your music as collectibles</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Fan Engagement</p>
                <p className="text-xs text-muted-foreground">+1 point per vote — Build your fan base</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
