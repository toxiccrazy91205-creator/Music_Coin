import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "PRODUCTION_HOUSE") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const contracts = await prisma.productionContract.findMany({
      where: { productionHouseId: session.sub },
      include: {
        artist: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: contracts })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "PRODUCTION_HOUSE") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { artistId, revenueSplit, royaltySplit } = await request.json()

    if (!artistId || typeof revenueSplit !== "number" || typeof royaltySplit !== "number") {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 })
    }

    const contract = await prisma.productionContract.create({
      data: {
        productionHouseId: session.sub,
        artistId,
        revenueSplit,
        royaltySplit,
      },
    })

    return NextResponse.json({ success: true, data: contract })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    // Handle unique constraint error specifically for nice UX
    if (message.includes("Unique constraint failed")) {
      return NextResponse.json({ success: false, error: "A contract with this artist already exists." }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
