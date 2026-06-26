import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { userId, isApproved, role } = await request.json()

    if (!userId || (typeof isApproved !== "boolean" && !role)) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const dataToUpdate: any = {}
    if (typeof isApproved === "boolean") dataToUpdate.isApproved = isApproved
    if (role) dataToUpdate.role = role

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
