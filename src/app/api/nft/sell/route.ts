import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { Prisma } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { nftId, price } = await request.json()

    if (!nftId || price === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields: nftId, price" }, { status: 400 })
    }

    const nft = await prisma.nFT.findUnique({ where: { id: nftId } })

    if (!nft) {
      return NextResponse.json({ success: false, error: "NFT not found" }, { status: 404 })
    }

    if (nft.ownerId !== session.sub) {
      return NextResponse.json({ success: false, error: "Only the owner can list this NFT for sale" }, { status: 403 })
    }

    const updatedNft = await prisma.nFT.update({
      where: { id: nftId },
      data: {
        status: "FOR_SALE",
        price: new Prisma.Decimal(price)
      }
    })

    return NextResponse.json({ success: true, data: updatedNft })
  } catch (error: any) {
    console.error("POST /api/nft/sell error:", error)
    return NextResponse.json({ success: false, error: "Failed to list NFT for sale" }, { status: 500 })
  }
}
