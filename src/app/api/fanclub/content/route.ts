import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('artistId')

    if (!artistId) {
      return NextResponse.json({ error: "artistId is required" }, { status: 400 })
    }

    const fanId = session.sub

    // Verify if the fan is Premium
    const fan = await prisma.user.findUnique({
      where: { id: fanId },
      select: { isPremiumMember: true }
    })

    if (!fan) {
      return NextResponse.json({ error: "Fan account not found" }, { status: 404 })
    }

    // Fetch all content for this artist
    const allContent = await prisma.exclusiveContent.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' }
    })

    // Mathematically filter the content based on membership tier
    const accessibleContent = allContent.map(content => {
      // If it's standard content, everyone sees the URL
      if (!content.isPremiumOnly) {
        return content
      }
      
      // If it's Premium Only, check the fan's membership
      if (content.isPremiumOnly && fan.isPremiumMember) {
        return content // VIPs get the actual URL
      }

      // If they are a standard fan trying to view Premium content, censor the URL
      return {
        ...content,
        contentUrl: "LOCKED_PREMIUM_CONTENT - Upgrade to VIP via Staking to unlock!"
      }
    })

    return NextResponse.json({ 
      success: true, 
      isPremiumMember: fan.isPremiumMember,
      data: accessibleContent
    })

  } catch (error: any) {
    console.error(`Fan Club Content Error:`, error)
    return NextResponse.json({ error: error.message || "Failed to load Fan Club content" }, { status: 500 })
  }
}
