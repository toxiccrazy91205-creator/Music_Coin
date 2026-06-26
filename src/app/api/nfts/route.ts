import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit")
    const { NftService } = await import("@/features/nfts/nft.service")
    const nfts = await NftService.getAvailableNfts(limit ? Number(limit) : undefined)
    return NextResponse.json({ success: true, data: nfts })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
    if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })

    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })

    const body = await request.json()
    const { title, description, price, royaltyPercentage } = body
    if (!title || !description || price === undefined || royaltyPercentage === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (isNaN(Number(price)) || isNaN(Number(royaltyPercentage))) {
      return NextResponse.json({ success: false, error: "Invalid price or royalty percentage" }, { status: 400 })
    }

    const { NftService } = await import("@/features/nfts/nft.service")
    const nft = await NftService.mintNft(payload.sub as string, {
      title,
      description,
      price: Number(price),
      royaltyPercentage: Number(royaltyPercentage),
    })
    return NextResponse.json({ success: true, data: nft }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
