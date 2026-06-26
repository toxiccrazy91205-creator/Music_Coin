import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "FOR_SALE"

    const nfts = await prisma.nFT.findMany({
      where: { status },
      include: {
        song: { select: { title: true, description: true } },
        owner: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ success: true, data: nfts })
  } catch (error: any) {
    console.error("GET /api/nft error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch NFTs" }, { status: 500 })
  }
}
