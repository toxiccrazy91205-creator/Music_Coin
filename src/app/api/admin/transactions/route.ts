import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const transactions = await prisma.transaction.findMany({
      include: {
        sender: {
          include: { user: { select: { name: true, email: true } } }
        },
        receiver: {
          include: { user: { select: { name: true, email: true } } }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: transactions })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to fetch transactions" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { transactionId, isFlagged } = await request.json()

    if (!transactionId || typeof isFlagged !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const updatedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: { isFlagged },
      include: {
        sender: { include: { user: { select: { name: true, email: true } } } },
        receiver: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    return NextResponse.json({ success: true, data: updatedTx })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to flag transaction" }, { status: 500 })
  }
}
