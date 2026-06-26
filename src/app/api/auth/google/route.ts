import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { setSessionCookie } from "@/lib/auth/session"

export async function POST(req: Request) {
  try {
    const { idToken, email, name, avatarUrl } = await req.json()

    if (!idToken || !email) {
      return NextResponse.json({ error: "Missing Google Auth parameters" }, { status: 400 })
    }

    // Find the user by email
    let user = await prisma.user.findUnique({
      where: { email: email }
    })

    // If no user exists, auto-create a FAN account for this Google User
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || "Google User",
          avatarUrl: avatarUrl || null,
          password: `GOOGLE_AUTH_${Date.now()}`, // Random unused password
          role: "FAN",
          isVerified: true
        }
      })
    } else if (avatarUrl && !user.avatarUrl) {
      // Sync Google Avatar if they didn't have one
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl }
      })
    }

    // Generate secure dual JWT tokens via session.ts
    await setSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role
    })

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        role: user.role,
        email: user.email
      }
    })
  } catch (error: any) {
    console.error("Google Login Error:", error)
    return NextResponse.json({ error: "Google authentication failed" }, { status: 500 })
  }
}
