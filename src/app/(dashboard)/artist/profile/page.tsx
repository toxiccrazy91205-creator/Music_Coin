"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  User, Music, Globe, Link2, ImageIcon, BookOpen, Save, Plus, X
} from "lucide-react"

interface ArtistProfile {
  stageName: string
  bio: string
  genres: string[]
  socialLinks: string[]
  portfolio: string[]
}

export default function ArtistProfilePage() {
  const { user, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [profile, setProfile] = useState<ArtistProfile>({
    stageName: user?.name || "",
    bio: "",
    genres: [],
    socialLinks: [],
    portfolio: [],
  })
  const [newGenre, setNewGenre] = useState("")
  const [newLink, setNewLink] = useState("")

  useEffect(() => {
    if (user) {
      setProfile(prev => ({ ...prev, stageName: user.name || "" }))
    }
  }, [user])

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch("/api/users/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.stageName })
      })
      const data = await res.json()
      if (data.success) {
        setMessage("Profile saved!")
        refreshProfile()
      } else {
        setMessage(data.error || "Save failed")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function addGenre() {
    if (newGenre && !profile.genres.includes(newGenre)) {
      setProfile({ ...profile, genres: [...profile.genres, newGenre] })
      setNewGenre("")
    }
  }

  function removeGenre(genre: string) {
    setProfile({ ...profile, genres: profile.genres.filter(g => g !== genre) })
  }

  function addLink() {
    if (newLink && !profile.socialLinks.includes(newLink)) {
      setProfile({ ...profile, socialLinks: [...profile.socialLinks, newLink] })
      setNewLink("")
    }
  }

  function removeLink(link: string) {
    setProfile({ ...profile, socialLinks: profile.socialLinks.filter(l => l !== link) })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Artist Profile</h1>
        <p className="text-muted-foreground">Manage your artist identity and portfolio</p>
      </div>

      {message && (
        <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{message}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Basic Info
          </CardTitle>
          <CardDescription>Your public artist profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Stage Name</Label>
            <div className="flex items-center gap-2">
              <Music className="size-4 text-muted-foreground" />
              <Input value={profile.stageName} onChange={(e) => setProfile({ ...profile, stageName: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <textarea
              className="flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Tell your story as an artist..."
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 size-4" />
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            Genres
          </CardTitle>
          <CardDescription>Select your music genres</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add a genre (e.g. Jazz, Rock, Electronic)"
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGenre())}
            />
            <Button variant="outline" onClick={addGenre}><Plus className="size-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.genres.map((genre) => (
              <span key={genre} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm">
                {genre}
                <button onClick={() => removeGenre(genre)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {profile.genres.length === 0 && (
              <p className="text-sm text-muted-foreground">No genres added yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            Social Links
          </CardTitle>
          <CardDescription>Connect your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://instagram.com/your-profile"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
            />
            <Button variant="outline" onClick={addLink}><Plus className="size-4" /></Button>
          </div>
          <div className="space-y-2">
            {profile.socialLinks.map((link) => (
              <div key={link} className="flex items-center gap-2 rounded-lg border p-2">
                <Link2 className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1 truncate">{link}</span>
                <button onClick={() => removeLink(link)} className="text-muted-foreground hover:text-destructive">
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {profile.socialLinks.length === 0 && (
              <p className="text-sm text-muted-foreground">No social links added</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" />
            Portfolio
          </CardTitle>
          <CardDescription>Showcase your work and music library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <ImageIcon className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">Music Library & Portfolio</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload your music tracks, album art, and promotional content (coming soon)
            </p>
            <Button variant="outline" className="mt-4" disabled>
              <Plus className="mr-2 size-4" />
              Upload Music
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Account Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span>Artist</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Joined</span>
            <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
