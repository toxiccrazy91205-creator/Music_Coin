import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { NftService } = await import("@/features/nfts/nft.service")
    const nfts = await NftService.getAvailableNfts()
    return NextResponse.json({ data: nfts })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message, statusCode: 400 }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
    if (!token) return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })

    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })

    const body = await request.json()
    const { title, description, price, royaltyPercentage } = body
    if (!title || !description || price === undefined || royaltyPercentage === undefined) {
      return NextResponse.json({ error: "Missing required fields", statusCode: 400 }, { status: 400 })
    }

    const { NftService } = await import("@/features/nfts/nft.service")
    const nft = await NftService.mintNft(payload.sub as string, {
      title,
      description,
      price: Number(price),
      royaltyPercentage: Number(royaltyPercentage),
    })
    return NextResponse.json({ data: nft }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message, statusCode: 400 }, { status: 400 })
  }
}
