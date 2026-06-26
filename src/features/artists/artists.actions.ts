"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { serialize } from "@/lib/serialize"

export async function getOrganizerArtistsAction() {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }

    const events = await prisma.event.findMany({
      where: { organizerId: session.sub },
      include: {
        artists: {
          include: {
            artistProfile: true,
          },
        },
      },
    })

    const artistMap = new Map<string, {
      id: string
      name: string
      stageName: string | null
      genre: string
      status: string
      events: number
      rating: number
      email: string
    }>()

    for (const event of events) {
      for (const artist of event.artists) {
        const existing = artistMap.get(artist.id)
        if (existing) {
          existing.events += 1
        } else {
          artistMap.set(artist.id, {
            id: artist.id,
            name: artist.name,
            stageName: artist.artistProfile?.stageName ?? null,
            genre: artist.artistProfile?.genres?.[0] ?? "Unknown",
            status: artist.artistProfile?.verificationStatus ?? "PENDING",
            events: 1,
            rating: artist.artistProfile?.reputationScore ?? 0,
            email: artist.email,
          })
        }
      }
    }

    return { success: true as const, data: serialize(Array.from(artistMap.values())) }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
