import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { enable } = await request.json()

    if (typeof enable !== 'boolean') {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.sub },
      data: { isMfaEnabled: enable }
    })

    return NextResponse.json({ success: true, message: `MFA ${enable ? 'enabled' : 'disabled'} successfully.` })
  } catch (error: any) {
    console.error("MFA Toggle Error:", error)
    return NextResponse.json({ error: "Failed to toggle MFA" }, { status: 500 })
  }
}
