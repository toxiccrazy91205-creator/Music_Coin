import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
      }
    })

    if (!artist) {
      return NextResponse.json({ success: false, error: "Artist not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: artist })
  } catch (error: any) {
    console.error(`GET /api/artists/[id] error:`, error)
    return NextResponse.json({ success: false, error: "Failed to fetch artist" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params;
    const artist = await prisma.artist.findUnique({ where: { id } })
    if (!artist) {
      return NextResponse.json({ success: false, error: "Artist not found" }, { status: 404 })
    }

    // Security: Only the artist themselves or an Admin can edit this profile
    if (artist.userId !== session.sub && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const { stageName, bio, genres, verificationStatus, reputationScore } = body

    // Prepare update payload
    const updateData: any = {}
    
    // Anyone authorized can update standard profile fields
    if (stageName !== undefined) updateData.stageName = stageName
    if (bio !== undefined) updateData.bio = bio
    if (genres !== undefined) updateData.genres = genres

    // Security: Only Admins can modify Verification and Reputation
    if (session.role === "ADMIN") {
      if (verificationStatus !== undefined) updateData.verificationStatus = verificationStatus
      if (reputationScore !== undefined) updateData.reputationScore = reputationScore
    }

    // Use a transaction if we are verifying the artist, so we can mint the badge simultaneously
    let updatedArtist;
    
    if (session.role === "ADMIN" && verificationStatus === "APPROVED" && artist.verificationStatus !== "APPROVED") {
      updatedArtist = await prisma.$transaction(async (tx) => {
        // 1. Update the artist status
        const upd = await tx.artist.update({
          where: { id },
          data: updateData,
        })
        
        // 2. Ensure they have a song record to attach the NFT to (since NFT requires songId in Prisma schema)
        // For a badge, we can create a dummy "Verification Profile" song
        let profileSong = await tx.song.findFirst({
          where: { artistId: artist.userId, title: "Verified Artist Profile" }
        })
        if (!profileSong) {
          profileSong = await tx.song.create({
            data: {
              artistId: artist.userId,
              title: "Verified Artist Profile",
              description: "Official verification badge profile."
            }
          })
        }

        // 3. Mint the actual Verified Badge NFT
        const simulatedTokenId = "0xBADGE" + Math.random().toString(16).slice(2, 10)
        await tx.nFT.create({
          data: {
            creatorId: artist.userId,
            ownerId: artist.userId,
            songId: profileSong.id,
            tokenId: simulatedTokenId,
            contractAddress: "0xArtistIdentityContract",
            metadataUrl: "https://musiccoin.demo/badges/verified.png",
            price: 0,
            royaltyPercentage: 0,
            status: "MINTED"
          }
        })

        return upd
      })
    } else {
      updatedArtist = await prisma.artist.update({
        where: { id },
        data: updateData,
      })
    }

    return NextResponse.json({ success: true, data: updatedArtist })
  } catch (error: any) {
    console.error(`PUT /api/artists/[id] error:`, error)
    return NextResponse.json({ success: false, error: "Failed to update artist" }, { status: 500 })
  }
}
