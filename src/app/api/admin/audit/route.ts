import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const auditLogs = await prisma.auditLog.findMany({
      include: {
        admin: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100 // Limit to recent 100 for performance
    })

    return NextResponse.json({ success: true, data: auditLogs })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
