import { prisma } from "@/lib/prisma"

const VOTE_REWARD = 10

export const VoteService = {
  async castVote(fanId: string, artistId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.vote.findUnique({
        where: { fanId_artistId: { fanId, artistId } },
      })

      const vote = await tx.vote.upsert({
        where: { fanId_artistId: { fanId, artistId } },
        update: { weight: { increment: 1 } },
        create: { fanId, artistId, weight: 1 },
      })

      let reward = 0
      if (!existing) {
        const wallet = await tx.wallet.findUnique({ where: { userId: fanId } })
        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: VOTE_REWARD } },
          })
          await tx.transaction.create({
            data: {
              senderId: wallet.id,
              receiverId: wallet.id,
              amount: VOTE_REWARD,
              type: "DEPOSIT",
            },
          })
          reward = VOTE_REWARD
        }
      }

      return { vote, reward }
    })

    return result
  },

  async getResults() {
    const votes = await prisma.vote.findMany({
      select: { artistId: true, weight: true, artist: { select: { name: true } } },
    })

    const grouped = new Map<string, { artistName: string; voteCount: number }>()
    for (const v of votes) {
      const entry = grouped.get(v.artistId) || { artistName: v.artist.name, voteCount: 0 }
      entry.voteCount += v.weight
      grouped.set(v.artistId, entry)
    }

    const sorted = Array.from(grouped.entries())
      .map(([artistId, data]) => ({ artistId, artistName: data.artistName, voteCount: data.voteCount, rank: 0 }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .map((item, i) => ({ ...item, rank: i + 1 }))

    return { results: sorted }
  },
}
