import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { TransactionType } from "@prisma/client"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Revenue comes from Fee collections, Verifications, Listing Fees
    const revenueTransactions = await prisma.transaction.findMany({
      where: {
        type: {
          in: ["FEE_COLLECTION", "VERIFICATION_FEE", "LISTING_FEE", "ADVERTISEMENT_REVENUE", "SUBSCRIPTION_PAYMENT"]
        },
        status: "COMPLETED"
      },
      orderBy: { createdAt: "desc" },
    })

    const totalRevenue = revenueTransactions.reduce((acc, tx) => acc + Number(tx.amount), 0)

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        transactions: revenueTransactions
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: "Failed to fetch revenue reports" }, { status: 500 })
  }
}
