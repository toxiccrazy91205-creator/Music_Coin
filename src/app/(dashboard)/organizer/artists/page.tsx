"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getOrganizerArtistsAction } from "@/features/artists/artists.actions"
import { Mic2, Search, Plus, Star, UserCheck, Trash2 } from "lucide-react"

interface ArtistItem {
  id: string
  name: string
  stageName: string | null
  genre: string
  status: string
  events: number
  rating: number
  email: string
}

export default function ArtistManagementPage() {
  const [artists, setArtists] = useState<ArtistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function load() {
      const res = await getOrganizerArtistsAction()
      if (res.success) setArtists(res.data as unknown as ArtistItem[])
      setLoading(false)
    }
    load()
  }, [])

  const filteredArtists = artists.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.stageName && a.stageName.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const verifiedCount = artists.filter((a) => a.status === "APPROVED").length
  const pendingCount = artists.filter((a) => a.status === "PENDING").length

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading artists...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Artist Management</h1>
          <p className="text-muted-foreground">Manage your event lineups and roster of performers.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 shadow-md" disabled>
          <Plus className="mr-2 size-4" />
          Invite Artist
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roster</CardTitle>
            <Mic2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{artists.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Artists across your events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Performers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to be booked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle>Roster Network</CardTitle>
            <CardDescription className="mt-1">Artists associated with your events</CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or genre..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {artists.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Mic2 className="mx-auto mb-3 size-10 opacity-40" />
              <p>No artists yet. Artists appear here once added to your events.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Artist Info</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Past Events</th>
                    <th className="px-6 py-4 font-medium">Rating</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredArtists.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No artists found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredArtists.map((artist) => (
                      <tr key={artist.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Mic2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-base">{artist.stageName || artist.name}</p>
                              <p className="text-xs text-muted-foreground">{artist.genre}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              artist.status === "APPROVED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}
                          >
                            {artist.status === "APPROVED" ? "VERIFIED" : artist.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium">{artist.events}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-medium text-foreground">
                              {artist.rating > 0 ? artist.rating : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" disabled>
                              Book
                            </Button>
                            <Button variant="ghost" size="icon" title="Remove from Roster" disabled>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
