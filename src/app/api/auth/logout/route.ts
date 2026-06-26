import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/auth/session"
import { adminAuth } from "@/lib/firebase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { isDemo, firebaseUid } = body

    await clearSessionCookie()

    if (!isDemo && firebaseUid) {
      // Revoke Firebase refresh tokens if Real mode
      await adminAuth.revokeRefreshTokens(firebaseUid).catch((e: any) => {
        console.warn("Failed to revoke Firebase tokens on logout", e)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Logout Error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
