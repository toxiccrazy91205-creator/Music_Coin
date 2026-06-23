import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

async function getUserId(request: Request): Promise<string> {
  const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
  if (!token) throw new Error("Not authenticated")
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
  return payload.sub as string
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    const { WalletService } = await import("@/features/wallet/wallet.service")
    const wallet = await WalletService.getWallet(userId)
    return NextResponse.json({ data: wallet })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message === "Not authenticated" ? 401 : 404
    return NextResponse.json({ error: message, statusCode: status }, { status })
  }
}
