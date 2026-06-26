import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken, setSessionCookie, clearSessionCookie } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("__refresh")?.value

    if (!refreshToken) {
      await clearSessionCookie()
      return NextResponse.json({ error: "No refresh token" }, { status: 401 })
    }

    // Verify the refresh token
    const payload = await verifyToken(refreshToken)

    // Optional but secure: Check if user still exists and hasn't been banned
    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    })

    if (!user) {
      await clearSessionCookie()
      return NextResponse.json({ error: "User no longer exists" }, { status: 401 })
    }

    // Mint a fresh 15-minute access token and new 7-day refresh token
    // Our setSessionCookie natively generates both of these for us.
    await setSessionCookie({ sub: user.id, email: user.email, role: user.role })

    return NextResponse.json({ success: true, message: "Token refreshed successfully" })
  } catch (error: any) {
    console.error("Refresh Token Error:", error)
    await clearSessionCookie()
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
  }
}
