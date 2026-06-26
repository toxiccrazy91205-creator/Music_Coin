import { NextResponse } from "next/server"

async function getUserId(request: Request): Promise<string> {
  const token = request.headers.get("cookie")?.split("__session=")?.[1]?.split(";")?.[0]
  if (!token) throw new Error("Not authenticated")
  const { jwtVerify } = await import("jose")
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
  return payload.sub as string
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)

    const { WalletService } = await import("@/features/wallet/wallet.service")
    const result = await WalletService.getTransactions(userId, page, limit)
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    const status = message === "Not authenticated" ? 401 : 400
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
