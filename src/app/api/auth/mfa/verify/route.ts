import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken, setSessionCookie } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const { tempToken, code } = await request.json()

    if (!tempToken || !code) {
      return NextResponse.json({ error: "Missing token or code" }, { status: 400 })
    }

    // Verify temp token
    const payload = await verifyToken(tempToken)
    
    // Check OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: { email: payload.email, code },
    })

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid MFA code" }, { status: 401 })
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ error: "MFA code expired" }, { status: 401 })
    }

    // OTP is valid, log them in properly
    await setSessionCookie({ sub: payload.sub, email: payload.email, role: payload.role })

    // Clean up OTP
    await prisma.oTP.deleteMany({ where: { email: payload.email } })

    return NextResponse.json({ success: true, message: "MFA verified, logged in." })
  } catch (error: any) {
    console.error("MFA Verify Error:", error)
    return NextResponse.json({ error: "Invalid token or server error" }, { status: 500 })
  }
}
