import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { oldPassword, newPassword } = await req.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Both old and new passwords are required" }, { status: 400 })
    }

    // Fetch user with current password
    const user = await prisma.user.findUnique({
      where: { id: session.sub }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify the old password
    const isValid = await bcrypt.compare(oldPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 })
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12)
    const hashedNewPassword = await bcrypt.hash(newPassword, salt)

    // Update the password in database
    await prisma.user.update({
      where: { id: session.sub },
      data: { password: hashedNewPassword }
    })

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (error: any) {
    console.error("Change Password Error:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
