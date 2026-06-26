import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/firebase/admin"

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ success: false, error: "Email and code required" }, { status: 400 })
    }

    const otpRecord = await prisma.oTP.findUnique({ where: { email } })

    if (!otpRecord) {
      return NextResponse.json({ success: false, error: "No OTP requested" }, { status: 400 })
    }

    if (otpRecord.code !== code) {
      return NextResponse.json({ success: false, error: "Invalid OTP code" }, { status: 400 })
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ success: false, error: "OTP expired" }, { status: 400 })
    }

    // Verify success! Update Prisma user
    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    })

    // Also update Firebase Auth if applicable so the email is marked verified there too!
    try {
      const fbUser = await adminAuth.getUserByEmail(email)
      await adminAuth.updateUser(fbUser.uid, { emailVerified: true })
    } catch (e) {
      console.warn("Could not verify Firebase user locally (may not exist)", e)
    }

    // Delete the OTP record so it can't be reused
    await prisma.oTP.delete({ where: { email } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Verify OTP Error", error)
    return NextResponse.json({ success: false, error: "Failed to verify OTP" }, { status: 500 })
  }
}
