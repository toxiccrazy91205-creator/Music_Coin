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

    const buyerId = session.sub
    const { nftId } = await request.json()

    if (!nftId) {
      return NextResponse.json({ success: false, error: "nftId is required" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const nft = await tx.nFT.findUnique({ where: { id: nftId } })

      if (!nft) throw new Error("NFT not found")
      if (nft.status !== "FOR_SALE") throw new Error("NFT is not currently for sale")
      if (nft.ownerId === buyerId) throw new Error("You already own this NFT")

      const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
      if (!buyerWallet) throw new Error("Buyer wallet not found")
      if (buyerWallet.balance.lessThan(nft.price)) throw new Error("Insufficient balance")

      const sellerWallet = await tx.wallet.findUnique({ where: { userId: nft.ownerId } })
      if (!sellerWallet) throw new Error("Seller wallet not found")

      // Royalty Calculation
      const priceNum = Number(nft.price)
      const royaltyPercentage = nft.royaltyPercentage || 0
      const royaltyAmount = new Prisma.Decimal(priceNum * (royaltyPercentage / 100))
      const sellerAmount = new Prisma.Decimal(priceNum - Number(royaltyAmount))

      // 1. Deduct full price from Buyer
      await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: { balance: { decrement: nft.price } }
      })

      // 2. Add seller cut to Seller
      await tx.wallet.update({
        where: { id: sellerWallet.id },
        data: { balance: { increment: sellerAmount } }
      })

      // 3. Add royalty to Original Creator (if creator is different from seller or even if same)
      if (nft.creatorId && royaltyAmount.greaterThan(0)) {
        const creatorWallet = await tx.wallet.findUnique({ where: { userId: nft.creatorId } })
        if (creatorWallet) {
          await tx.wallet.update({
            where: { id: creatorWallet.id },
            data: { balance: { increment: royaltyAmount } }
          })
          
          // Log Royalty Transaction
          await tx.transaction.create({
            data: {
              senderId: buyerWallet.id,
              receiverId: creatorWallet.id,
              amount: royaltyAmount,
              type: "ROYALTY_PAYMENT"
            }
          })

          // Create Royalty record
          if (nft.creatorId) {
             await tx.royalty.create({
               data: {
                 nftId: nft.id,
                 artistId: nft.creatorId,
                 percentage: royaltyPercentage,
                 amount: royaltyAmount,
                 paidAt: new Date()
               }
             })
          }
        }
      }

      // 4. Log the Main Transfer Transaction
      await tx.transaction.create({
        data: {
          senderId: buyerWallet.id,
          receiverId: sellerWallet.id,
          amount: sellerAmount,
          type: "TRANSFER"
        }
      })

      // 5. Transfer NFT Ownership
      const updatedNft = await tx.nFT.update({
        where: { id: nft.id },
        data: {
          ownerId: buyerId,
          status: "SOLD"
        }
      })

      return updatedNft
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("POST /api/nft/buy error:", error.message)
    const status = error.message.includes("not found") ? 404 : 400
    return NextResponse.json({ success: false, error: error.message || "Failed to buy NFT" }, { status })
  }
}
