import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
    if (!token) return NextResponse.json({ error: "Not authenticated", statusCode: 401 }, { status: 401 })

    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })

    const { nftId } = await request.json()
    if (!nftId) {
      return NextResponse.json({ error: "nftId is required", statusCode: 400 }, { status: 400 })
    }

    const { NftService } = await import("@/features/nfts/nft.service")
    const result = await NftService.buyNft(payload.sub as string, nftId)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    let status = 400
    if (message.includes("Not authenticated")) status = 401
    if (message.includes("not found")) status = 404
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}
