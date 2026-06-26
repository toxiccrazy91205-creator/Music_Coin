import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { VerificationStatus } from "@prisma/client"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const artists = await prisma.artist.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: artists })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to fetch artists" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { artistId, status } = await request.json()

    if (!artistId || !status || !Object.values(VerificationStatus).includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const updatedArtist = await prisma.artist.update({
      where: { id: artistId },
      data: { verificationStatus: status },
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: updatedArtist })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to update artist" }, { status: 500 })
  }
}
