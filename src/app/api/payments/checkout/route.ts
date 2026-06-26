import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { Prisma } from "@prisma/client"

// Helper function to simulate a secure external payment processor (Stripe / Razorpay)
const simulateExternalPayment = async (amount: number, gateway: string) => {
  return {
    success: true,
    transactionId: `txn_${gateway.toLowerCase()}_${Date.now()}`,
    invoiceUrl: `https://invoices.musiccoin.demo/${gateway.toLowerCase()}/${Date.now()}`
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.sub

    const { amount, currency, gateway } = await request.json()

    if (!amount || !currency || !gateway) {
      return NextResponse.json({ error: "amount, currency, and gateway are required" }, { status: 400 })
    }

    const fiatAmount = Number(amount)
    if (fiatAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 })
    }

    // Process External Fiat Payment
    const paymentResult = await simulateExternalPayment(fiatAmount, gateway)
    if (!paymentResult.success) {
      throw new Error("Fiat payment failed at the gateway level")
    }

    // Execute Minting & Ledger Update
    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } })
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0 }
        })
      }

      // Convert Fiat to MUSIC tokens (e.g., 1 USD = 10 MUSIC)
      const exchangeRate = currency === "USD" ? 10 : currency === "INR" ? 0.12 : 1
      const cryptoAmount = new Prisma.Decimal(fiatAmount * exchangeRate)

      // Mint Tokens to user's wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: cryptoAmount } }
      })

      // Log the strict Transaction Ledger
      const txRecord = await tx.transaction.create({
        data: {
          senderId: wallet.id, // System Mint / External source
          receiverId: wallet.id,
          amount: cryptoAmount,
          currency: "MUSIC",
          paymentGateway: gateway,
          type: "DEPOSIT",
          invoiceId: paymentResult.transactionId,
          invoiceUrl: paymentResult.invoiceUrl
        }
      })

      return {
        walletBalance: updatedWallet.balance.toString(),
        transaction: txRecord
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${fiatAmount} ${currency} via ${gateway}`,
      data: result
    })

  } catch (error: any) {
    console.error(`Fiat Checkout Error:`, error)
    return NextResponse.json({ error: error.message || "Failed to process fiat checkout" }, { status: 500 })
  }
}
