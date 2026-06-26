import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

const COMMUNITY_VERIFICATION_THRESHOLD = 50

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: artistId } = await params;

    // Check if Artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId }
    })

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    // Prevent duplicate endorsements (Prisma handles this via the @@unique constraint, but we check explicitly for UX)
    const existingEndorsement = await prisma.communityEndorsement.findUnique({
      where: {
        userId_artistId: {
          userId: session.sub,
          artistId: artist.id
        }
      }
    })

    if (existingEndorsement) {
      return NextResponse.json({ error: "You have already endorsed this artist" }, { status: 400 })
    }

    // Execute Endorsement Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the endorsement record
      await tx.communityEndorsement.create({
        data: {
          userId: session.sub,
          artistId: artist.id
        }
      })

      // 2. Increment the artist's reputation score
      const updatedArtist = await tx.artist.update({
        where: { id: artist.id },
        data: { reputationScore: { increment: 1 } }
      })

      return updatedArtist
    })

    // 3. Workflow Trigger: Check if they crossed the Community Verification Threshold
    let workflowStatusMessage = "Endorsement recorded."
    if (result.reputationScore >= COMMUNITY_VERIFICATION_THRESHOLD && result.verificationStatus === "PENDING") {
      workflowStatusMessage = "Community Verification threshold reached! Artist is now awaiting final Admin Review."
      // Note: We don't change verificationStatus to APPROVED here, because Admin Review is the final step.
      // But we could add a "COMMUNITY_VERIFIED" sub-status if we expanded the enum. For now, the reputationScore dictates it.
    }

    return NextResponse.json({ 
      success: true, 
      message: workflowStatusMessage,
      newScore: result.reputationScore 
    })

  } catch (error: any) {
    console.error("Endorsement Error:", error)
    return NextResponse.json({ error: "Failed to endorse artist" }, { status: 500 })
  }
}
