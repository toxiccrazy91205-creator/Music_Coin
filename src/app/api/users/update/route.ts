import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, walletAddress, avatarUrl } = body

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.sub },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(walletAddress !== undefined && { walletAddress }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        walletAddress: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error: any) {
    console.error("PUT /api/users/update error:", error)
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 })
  }
}
