import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Prisma } from "@prisma/client"

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Adding metrics seed data...")
  
  const artistUser = await prisma.user.findUnique({ where: { email: "artist@musiccoin.festival" } })
  const fanUser = await prisma.user.findUnique({ where: { email: "fan@musiccoin.festival" } })
  const organizerUser = await prisma.user.findUnique({ where: { email: "organizer@musiccoin.festival" } })
  const event = await prisma.event.findFirst()
  const song = await prisma.song.findFirst()

  if (!artistUser || !fanUser || !event || !song) {
    console.log("Core seed data missing. Run standard seed first.")
    return
  }

  // 1. Verified Artist Profile
  const existingArtist = await prisma.artist.findUnique({ where: { userId: artistUser.id } })
  if (!existingArtist) {
    await prisma.artist.create({
      data: {
        userId: artistUser.id,
        stageName: artistUser.name,
        bio: "A demo artist for Music Coin.",
        genres: ["Electronic", "Pop"],
        verificationStatus: "APPROVED"
      }
    })
    console.log("Created Verified Artist")
  }

  // 2. Tickets Sold
  const existingTicket = await prisma.ticket.findFirst({ where: { userId: fanUser.id } })
  if (!existingTicket) {
    await prisma.ticket.create({
      data: {
        eventId: event.id,
        userId: fanUser.id,
        seatNumber: "A1",
        tier: "VIP",
        price: new Prisma.Decimal(50),
        status: "SOLD"
      }
    })
    console.log("Created Sold Ticket")
  }

  // 3. NFT Volume & Royalty
  const existingSoldNft = await prisma.nFT.findFirst({ where: { status: "SOLD" } })
  if (!existingSoldNft) {
    const nft = await prisma.nFT.create({
      data: {
        songId: song.id,
        creatorId: artistUser.id,
        ownerId: fanUser.id,
        price: new Prisma.Decimal(250),
        royaltyPercentage: 10,
        status: "SOLD"
      }
    })
    
    // Royalty Payment
    const fanWallet = await prisma.wallet.findUnique({ where: { userId: fanUser.id } })
    const artistWallet = await prisma.wallet.findUnique({ where: { userId: artistUser.id } })
    const orgWallet = await prisma.wallet.findUnique({ where: { userId: organizerUser!.id } })
    
    if (fanWallet && artistWallet && orgWallet) {
      await prisma.transaction.create({
        data: {
          senderId: fanWallet.id, 
          receiverId: artistWallet.id,
          amount: new Prisma.Decimal(25),
          type: "ROYALTY_PAYMENT",
          status: "COMPLETED"
        }
      })
      
      // Monthly Revenue transaction
      await prisma.transaction.create({
        data: {
          senderId: fanWallet.id,
          receiverId: orgWallet.id,
          amount: new Prisma.Decimal(50),
          type: "TICKET_PURCHASE",
          status: "COMPLETED"
        }
      })
    }
    console.log("Created Sold NFT and Transactions")
  }

  // 4. Active Fan Communities
  const existingFanClub = await prisma.fanClubDiscussion.findFirst()
  if (!existingFanClub) {
    await prisma.fanClubDiscussion.create({
      data: {
        artistId: artistUser.id,
        fanId: fanUser.id,
        message: "So excited for the upcoming drops.",
      }
    })
    console.log("Created Fan Community Discussion")
  }

  // 5. Staking TVL
  const fanWallet = await prisma.wallet.findUnique({ where: { userId: fanUser.id } })
  if (fanWallet && Number(fanWallet.stakedBalance) === 0) {
    await prisma.wallet.update({
      where: { id: fanWallet.id },
      data: { stakedBalance: new Prisma.Decimal(500) }
    })
    console.log("Updated Staking TVL")
  }

  console.log("Metrics seed completed successfully!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
