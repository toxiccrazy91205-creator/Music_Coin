import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const genre = searchParams.get("genre")
    const status = searchParams.get("status")

    const where: any = {}
    if (genre) where.genres = { has: genre }
    if (status) where.verificationStatus = status

    const artists = await prisma.artist.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { reputationScore: "desc" },
    })

    return NextResponse.json({ success: true, data: artists })
  } catch (error: any) {
    console.error("GET /api/artists error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch artists" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    if (session.role !== "ARTIST" && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Only Artists can create an artist profile" }, { status: 403 })
    }

    const { stageName, bio, genres } = await req.json()

    if (!stageName) {
      return NextResponse.json({ success: false, error: "Stage name is required" }, { status: 400 })
    }

    const existingProfile = await prisma.artist.findUnique({
      where: { userId: session.sub }
    })

    if (existingProfile) {
      return NextResponse.json({ success: false, error: "Artist profile already exists" }, { status: 400 })
    }

    const newArtist = await prisma.artist.create({
      data: {
        userId: session.sub,
        stageName,
        bio: bio || null,
        genres: genres || [],
      }
    })

    return NextResponse.json({ success: true, data: newArtist }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/artists error:", error)
    return NextResponse.json({ success: false, error: "Failed to create artist profile" }, { status: 500 })
  }
}
