import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { Prisma } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { nftId, bidAmount } = await request.json()

    if (!nftId || !bidAmount) {
      return NextResponse.json({ error: "nftId and bidAmount are required" }, { status: 400 })
    }

    const fanId = session.sub
    const bidValue = new Prisma.Decimal(bidAmount)

    if (bidValue.lte(0)) {
      return NextResponse.json({ error: "Bid amount must be greater than zero" }, { status: 400 })
    }

    // Execute Auction Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch NFT and verify it is on auction
      const nft = await tx.nFT.findUnique({
        where: { id: nftId }
      })

      if (!nft) throw new Error("NFT not found")
      if (nft.status !== "AUCTION") throw new Error("This NFT is not currently up for auction")
      if (nft.auctionEndTime && new Date() > nft.auctionEndTime) throw new Error("The auction has ended")

      // 2. Verify new bid is higher than current highest bid or starting price
      const currentHighest = nft.highestBid ? nft.highestBid : nft.price
      if (bidValue.lte(currentHighest)) {
        throw new Error(`Your bid must be higher than the current highest bid of ${currentHighest.toString()}`)
      }

      // 3. Verify Fan Wallet has enough balance to cover the bid
      const fanWallet = await tx.wallet.findUnique({ where: { userId: fanId } })
      if (!fanWallet) throw new Error("Wallet not found")
      if (fanWallet.balance.lessThan(bidValue)) {
        throw new Error("Insufficient funds to place this bid")
      }

      // Note: In a real system, you might lock/escrow the funds here.
      // For this workflow, we just update the highest bid record on the NFT.
      const updatedNft = await tx.nFT.update({
        where: { id: nftId },
        data: {
          highestBid: bidValue,
          highestBidderId: fanId
        }
      })

      return updatedNft
    })

    return NextResponse.json({ 
      success: true, 
      message: "Bid placed successfully!",
      data: {
        highestBid: result.highestBid?.toString(),
        highestBidderId: result.highestBidderId
      }
    })

  } catch (error: any) {
    console.error("NFT Bid Error:", error)
    return NextResponse.json({ error: error.message || "Failed to place bid" }, { status: 500 })
  }
}
