import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { Prisma } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.sub

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true }
      })

      if (!user || !user.wallet) throw new Error("Wallet not found")

      const wallet = user.wallet
      
      if (wallet.stakedBalance.lte(0)) {
        throw new Error("No tokens staked to generate rewards")
      }

      // Calculate Time Elapsed
      const now = new Date()
      const lastClaim = wallet.lastClaimDate || wallet.createdAt
      const elapsedMs = now.getTime() - lastClaim.getTime()
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)

      if (elapsedDays <= 0) {
        throw new Error("No time elapsed to generate rewards")
      }

      // Dynamic Yield Math (APY to Daily)
      const baseAPY = 0.05 // 5% for Fans
      const premiumAPY = 0.10 // 10% for VIPs
      const activeAPY = user.isPremiumMember ? premiumAPY : baseAPY
      const dailyRate = activeAPY / 365

      // Calculate Reward
      const stakedNum = Number(wallet.stakedBalance)
      const rewardGenerated = stakedNum * dailyRate * elapsedDays

      if (rewardGenerated <= 0) {
        throw new Error("Generated reward is too small to claim")
      }

      // Mint Reward and update lastClaimDate
      const rewardDecimal = new Prisma.Decimal(rewardGenerated.toFixed(4)) // Keep to 4 decimals

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: rewardDecimal },
          lastClaimDate: now
        }
      })

      // Log the reward generation (simulate a mint transaction)
      await tx.transaction.create({
        data: {
          senderId: wallet.id, // Using self as sender for minted rewards in this simplified ledger
          receiverId: wallet.id,
          amount: rewardDecimal,
          type: "DEPOSIT" // Could be a custom "REWARD_CLAIM" enum later
        }
      })

      return {
        rewardAmount: rewardDecimal.toString(),
        newBalance: updatedWallet.balance.toString(),
        activeAPY: `${(activeAPY * 100)}%`
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Rewards claimed successfully!",
      data: result
    })

  } catch (error: any) {
    console.error(`Reward Claim Error:`, error)
    return NextResponse.json({ success: false, error: error.message || "Failed to claim rewards" }, { status: 400 })
  }
}
