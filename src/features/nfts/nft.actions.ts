"use server"

import { NftService } from "@/features/nfts/nft.service"
import { getSession } from "@/lib/auth/session"

export async function mintNftAction(input: {
  title: string
  description: string
  price: number
  royaltyPercentage: number
}) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    if (session.role !== "ARTIST") return { success: false as const, error: "Only artists can mint NFTs" }
    const nft = await NftService.mintNft(session.sub, input)
    return { success: true as const, data: nft }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function getNftsAction() {
  try {
    const nfts = await NftService.getAvailableNfts()
    return { success: true as const, data: nfts }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function buyNftAction(nftId: string) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }
    const result = await NftService.buyNft(session.sub, nftId)
    return { success: true as const, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
