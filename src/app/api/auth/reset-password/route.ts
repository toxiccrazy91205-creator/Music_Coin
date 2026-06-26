import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/firebase/admin"
import { hashPassword } from "@/lib/auth/password"

export async function POST(req: Request) {
  try {
    const { email, code, newPassword, isDemo } = await req.json()
    if (!email || !code || !newPassword) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Verify OTP
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

    // OTP is valid! Let's update the password
    if (isDemo) {
      // Demo Mode: Update Prisma Hash
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      const hashed = await hashPassword(newPassword)
      await prisma.user.update({
        where: { email },
        data: { password: hashed },
      })
    } else {
      // Real Mode: Update Firebase Password
      try {
        const fbUser = await adminAuth.getUserByEmail(email)
        await adminAuth.updateUser(fbUser.uid, { password: newPassword })
      } catch (e: any) {
        console.warn("Could not update Firebase password", e)
        return NextResponse.json({ success: false, error: "Failed to update real password. User may not exist in Auth." }, { status: 500 })
      }
    }

    // Mark as verified in Prisma just in case
    await prisma.user.updateMany({
      where: { email },
      data: { isVerified: true },
    })

    // Delete OTP
    await prisma.oTP.delete({ where: { email } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Reset Password Error:", error)
    return NextResponse.json({ success: false, error: "Failed to reset password" }, { status: 500 })
  }
}
