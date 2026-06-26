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

    if (session.role !== "ARTIST" && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Only Artists can mint NFTs" }, { status: 403 })
    }

    const { songTitle, description, price, royaltyPercentage, metadataUrl } = await request.json()

    if (!songTitle || price === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields: songTitle, price" }, { status: 400 })
    }

    // Simulate Minting: Create Song and NFT in a transaction
    const simulatedTokenId = "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)
    const simulatedContractAddress = "0xMockContract123456789"

    const result = await prisma.$transaction(async (tx) => {
      const song = await tx.song.create({
        data: {
          artistId: session.sub,
          title: songTitle,
          description: description || "",
        }
      })

      const nft = await tx.nFT.create({
        data: {
          creatorId: session.sub,
          ownerId: session.sub,
          songId: song.id,
          tokenId: simulatedTokenId,
          contractAddress: simulatedContractAddress,
          metadataUrl: metadataUrl || null,
          price: new Prisma.Decimal(price),
          royaltyPercentage: Number(royaltyPercentage) || 10,
          status: "MINTED"
        }
      })

      return { song, nft }
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/nft/mint error:", error)
    return NextResponse.json({ success: false, error: "Failed to mint NFT" }, { status: 500 })
  }
}
