import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const healthChecks = await prisma.systemHealth.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    })

    return NextResponse.json({ success: true, data: healthChecks })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to fetch system health" }, { status: 500 })
  }
}
