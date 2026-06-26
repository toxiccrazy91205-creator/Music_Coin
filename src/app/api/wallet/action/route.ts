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
    const { action, amount, targetWalletId } = await request.json()

    if (!action || !amount) {
      return NextResponse.json({ success: false, error: "action and amount are required" }, { status: 400 })
    }

    const value = new Prisma.Decimal(amount)
    if (value.lte(0)) {
      return NextResponse.json({ success: false, error: "Amount must be greater than zero" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } })
      if (!wallet) throw new Error("Wallet not found")

      let updatedWallet
      let txRecord

      switch (action) {
        case "DEPOSIT":
          updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: value } }
          })
          txRecord = await tx.transaction.create({
            data: {
              senderId: wallet.id, // For deposit, we just track it to the same wallet for ledger
              receiverId: wallet.id,
              amount: value,
              type: "DEPOSIT"
            }
          })
          break

        case "WITHDRAW":
          if (wallet.balance.lessThan(value)) throw new Error("Insufficient funds to withdraw")
          updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: value } }
          })
          txRecord = await tx.transaction.create({
            data: {
              senderId: wallet.id,
              receiverId: wallet.id, // Outward withdrawal
              amount: value,
              type: "WITHDRAWAL"
            }
          })
          break

        case "TRANSFER":
          if (!targetWalletId) throw new Error("targetWalletId is required for transfers")
          if (wallet.balance.lessThan(value)) throw new Error("Insufficient funds to transfer")
          
          const receiver = await tx.wallet.findUnique({ where: { id: targetWalletId } })
          if (!receiver) throw new Error("Target wallet not found")

          updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: value } }
          })
          
          await tx.wallet.update({
            where: { id: receiver.id },
            data: { balance: { increment: value } }
          })

          txRecord = await tx.transaction.create({
            data: {
              senderId: wallet.id,
              receiverId: receiver.id,
              amount: value,
              type: "TRANSFER"
            }
          })
          break

        case "STAKE":
          if (wallet.balance.lessThan(value)) throw new Error("Insufficient balance to stake")
          
          const lockUntil = new Date()
          lockUntil.setDate(lockUntil.getDate() + 30) // 30-day Lock Period

          updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: { 
              balance: { decrement: value },
              stakedBalance: { increment: value },
              stakeLockUntil: lockUntil,
              lastClaimDate: wallet.lastClaimDate || new Date()
            }
          })

          // Check for Premium Upgrade (e.g., stake >= 500 MUSIC unlocks Premium)
          const totalStaked = updatedWallet.stakedBalance
          if (totalStaked.gte(500)) {
            await tx.user.update({
              where: { id: userId },
              data: { isPremiumMember: true }
            })
          }

          txRecord = await tx.transaction.create({
            data: {
              senderId: wallet.id,
              receiverId: wallet.id,
              amount: value,
              type: "STAKE"
            }
          })
          break

        case "UNSTAKE":
          if (wallet.stakedBalance.lessThan(value)) throw new Error("Insufficient staked balance")
          if (wallet.stakeLockUntil && new Date() < wallet.stakeLockUntil) {
            throw new Error(`Tokens are locked until ${wallet.stakeLockUntil.toISOString()}`)
          }

          updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: { increment: value },
              stakedBalance: { decrement: value }
            }
          })

          // Check if they drop below Premium threshold
          if (updatedWallet.stakedBalance.lessThan(500)) {
             await tx.user.update({
               where: { id: userId },
               data: { isPremiumMember: false }
             })
          }

          txRecord = await tx.transaction.create({
            data: {
              senderId: wallet.id,
              receiverId: wallet.id,
              amount: value,
              type: "UNSTAKE"
            }
          })
          break

        default:
          throw new Error("Invalid action. Must be DEPOSIT, WITHDRAW, TRANSFER, STAKE, or UNSTAKE")
      }

      return { updatedWallet, transactionId: txRecord.id }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Action ${action} completed successfully`,
      data: result
    })

  } catch (error: any) {
    console.error(`Wallet Action Error:`, error)
    return NextResponse.json({ success: false, error: error.message || "Wallet action failed" }, { status: 500 })
  }
}
