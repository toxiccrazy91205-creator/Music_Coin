import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/auth/password"
import { signToken, setSessionCookie } from "@/lib/auth/session"
import { adminAuth } from "@/lib/firebase/admin"
import { sendEmail } from "@/lib/email/sender"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { isDemo, email, password, firebaseIdToken } = body

    let user;

    if (isDemo) {
      // Demo Mode Login
      user = await prisma.user.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      
      const valid = await verifyPassword(password, user.password)
      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    } else {
      // Real Firebase Login
      if (!firebaseIdToken) {
        return NextResponse.json({ error: "Missing Firebase token" }, { status: 400 })
      }

      // Verify token
      const decodedToken = await adminAuth.verifyIdToken(firebaseIdToken)

      if (!decodedToken.email_verified) {
        return NextResponse.json({ error: "Email not verified" }, { status: 403 })
      }

      user = await prisma.user.findUnique({ where: { email: decodedToken.email! } })
      
      if (!user) {
          return NextResponse.json({ error: "User not found in our database" }, { status: 401 })
      }

      // Ensure custom claims are set
      if (!decodedToken.role) {
        await adminAuth.setCustomUserClaims(decodedToken.uid, { role: user.role })
      }
    }

    // MFA Check
    if (user.isMfaEnabled) {
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

      // Invalidate old OTPs
      await prisma.oTP.deleteMany({ where: { email: user.email } })

      // Create new OTP
      await prisma.oTP.create({
        data: { email: user.email, code: otpCode, expiresAt }
      })

      // Send Email
      await sendEmail(
        user.email,
        "Music Coin - MFA Code",
        `Your MFA code is: ${otpCode}. It expires in 10 minutes.`
      )

      // Generate a temporary JWT just for MFA step
      const tempToken = await signToken({ sub: user.id, email: user.email, role: user.role })

      return NextResponse.json({ 
        success: true, 
        requiresMfa: true, 
        tempToken, 
        message: "MFA code sent to email" 
      })
    }

    // Standard Login (No MFA)
    await setSessionCookie({ sub: user.id, email: user.email, role: user.role })

    return NextResponse.json({ success: true, isDemo, data: { id: user.id, email: user.email, role: user.role } })
  } catch (error: any) {
    console.error("Login Error:", error)
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 })
  }
}
