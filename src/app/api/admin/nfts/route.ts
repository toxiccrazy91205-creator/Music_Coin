import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const nfts = await prisma.nFT.findMany({
      include: {
        owner: { select: { name: true, email: true } },
        song: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: nfts })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to fetch NFTs" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { nftId, status } = await request.json()

    if (!nftId || !status) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const updatedNft = await prisma.nFT.update({
      where: { id: nftId },
      data: { status },
      include: {
        owner: { select: { name: true, email: true } },
        song: { select: { title: true } },
      },
    })

    return NextResponse.json({ success: true, data: updatedNft })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to update NFT" }, { status: 500 })
  }
}
