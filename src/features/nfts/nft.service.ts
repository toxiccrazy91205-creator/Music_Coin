import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { AppError } from "@/lib/errors"

interface MintNftInput {
  title: string
  description: string
  price: number
  royaltyPercentage: number
}

export const NftService = {
  async mintNft(artistId: string, input: MintNftInput) {
    return prisma.$transaction(async (tx) => {
      const song = await tx.song.create({
        data: {
          artistId,
          title: input.title,
          description: input.description,
        },
      })

      const nft = await tx.nFT.create({
        data: {
          songId: song.id,
          ownerId: artistId,
          price: new Prisma.Decimal(input.price),
          royaltyPercentage: input.royaltyPercentage,
        },
        include: { song: true, owner: { select: { id: true, name: true } } },
      })

      return nft
    })
  },

  async getAvailableNfts(limit?: number) {
    return prisma.nFT.findMany({
      include: {
        song: true,
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: limit } : {}),
    })
  },

  async buyNft(buyerId: string, nftId: string) {
    return prisma.$transaction(async (tx) => {
      const nft = await tx.nFT.findUnique({
        where: { id: nftId },
        include: { song: true },
      })
      if (!nft) throw new AppError("NFT not found", 404)
      if (nft.ownerId === buyerId) throw new AppError("Cannot purchase your own NFT", 400)

      const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
      if (!buyerWallet) throw new AppError("Buyer wallet not found", 404)
      if (buyerWallet.balance.lessThan(nft.price)) {
        throw new AppError("Insufficient funds to purchase NFT", 400)
      }

      const sellerWallet = await tx.wallet.findUnique({ where: { userId: nft.ownerId } })
      if (!sellerWallet) throw new AppError("Seller wallet not found", 404)

      // Transfer funds
      await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: { balance: { decrement: nft.price } },
      })
      await tx.wallet.update({
        where: { id: sellerWallet.id },
        data: { balance: { increment: nft.price } },
      })

      // Transfer ownership
      await tx.nFT.update({
        where: { id: nftId },
        data: { ownerId: buyerId },
      })

      // Log sale transaction
      const transaction = await tx.transaction.create({
        data: {
          senderId: buyerWallet.id,
          receiverId: sellerWallet.id,
          amount: nft.price,
          type: "TRANSFER",
        },
      })

      // Handle royalty
      if (nft.royaltyPercentage > 0) {
        const royaltyAmount = nft.price.mul(nft.royaltyPercentage).div(100)
        await tx.royalty.create({
          data: {
            nftId: nft.id,
            artistId: nft.ownerId,
            amount: royaltyAmount,
          },
        })
        await tx.transaction.create({
          data: {
            senderId: buyerWallet.id,
            receiverId: sellerWallet.id,
            amount: royaltyAmount,
            type: "ROYALTY_PAYMENT",
          },
        })
      }

      const updatedNft = await tx.nFT.findUnique({
        where: { id: nftId },
        include: { song: true, owner: { select: { id: true, name: true } } },
      })

      return { nft: updatedNft, transaction }
    })
  },
}
