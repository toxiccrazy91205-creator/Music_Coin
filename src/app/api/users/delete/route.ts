import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, clearSessionCookie } from "@/lib/auth/session"
import { adminAuth } from "@/lib/firebase/admin"

export async function DELETE(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { email } = session

    // Delete user from Firebase Auth if it exists (Real Mode)
    try {
      if (email) {
        const fbUser = await adminAuth.getUserByEmail(email)
        await adminAuth.deleteUser(fbUser.uid)
      }
    } catch (e: any) {
      // User might not exist in Firebase (Demo mode) or Firebase error
      console.warn("Firebase user deletion skipped or failed:", e.message)
    }

    // Delete user from PostgreSQL Database
    await prisma.user.delete({
      where: { id: session.sub },
    })

    // Clear JWT Cookie
    await clearSessionCookie()

    return NextResponse.json({ success: true, message: "User account deleted successfully" })
  } catch (error: any) {
    console.error("DELETE /api/users/delete error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete account" }, { status: 500 })
  }
}
