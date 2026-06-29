import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"
import { Prisma } from "@prisma/client"

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

const SEED_USERS = [
  { name: "Admin", email: "admin@musiccoin.festival", password: "Admin@123", role: "ADMIN" as const },
  { name: "Event Organizer", email: "organizer@musiccoin.festival", password: "Organizer@123", role: "ORGANIZER" as const },
  { name: "Artist One", email: "artist@musiccoin.festival", password: "Artist@123", role: "ARTIST" as const },
  { name: "Production House", email: "production@musiccoin.festival", password: "Production@123", role: "PRODUCTION_HOUSE" as const },
  { name: "Fan One", email: "fan@musiccoin.festival", password: "Fan@123", role: "FAN" as const },
]

async function main() {
  console.log("Seeding database...")
  const saltRounds = 12

  for (const userData of SEED_USERS) {
    const hashed = await hash(userData.password, saltRounds)

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        name: userData.name,
        email: userData.email,
        password: hashed,
        role: userData.role,
      },
    })

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    })

    if (!wallet) {
      await prisma.wallet.create({
        data: { userId: user.id, balance: new Prisma.Decimal(1000) },
      })
      console.log(`Created wallet for ${userData.email} (${userData.role}) with balance 1000`)
    }

    if (userData.role === "ARTIST") {
      const existingArtist = await prisma.artist.findUnique({
        where: { userId: user.id }
      })
      if (!existingArtist) {
        await prisma.artist.create({
          data: {
            userId: user.id,
            stageName: "Neon Dreamer",
            bio: "Official demo artist.",
            genres: ["Electronic", "Synthwave"],
          }
        })
        console.log(`Created Artist profile for ${userData.email}`)
      }
    }

    console.log(`Seeded user: ${userData.email} (${userData.role}) — ${user.id}`)
  }

  // Seed sample published event with capacity
  const organizer = await prisma.user.findUnique({ where: { email: "organizer@musiccoin.festival" } })
  const artist = await prisma.user.findUnique({ where: { email: "artist@musiccoin.festival" } })

  if (organizer) {
    const existingEvent = await prisma.event.findFirst({ where: { organizerId: organizer.id } })
    if (!existingEvent) {
      await prisma.event.create({
        data: {
          organizerId: organizer.id,
          title: "Summer Music Festival 2026",
          description: "A weekend of live music, food, and art in the park.",
          venue: "Main Stage A",
          eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          ticketPrice: new Prisma.Decimal(50),
          capacity: 500,
          status: "PUBLISHED",
        },
      })
      console.log("Created sample published event with capacity 500")
    }
  }

  // Seed sample NFT from artist
  if (artist) {
    const existingSong = await prisma.song.findFirst({ where: { artistId: artist.id } })
    if (!existingSong) {
      const song = await prisma.song.create({
        data: {
          artistId: artist.id,
          title: "Neon Dreams",
          description: "An original electronic track with unique vibes.",
        },
      })

      await prisma.nFT.create({
        data: {
          songId: song.id,
          creatorId: artist.id,
          ownerId: artist.id,
          price: new Prisma.Decimal(100),
          royaltyPercentage: 10,
        },
      })
      console.log("Created sample NFT 'Neon Dreams' priced at 100 MC with 10% royalty")
    }
  }

  const tableCounts = {
    users: await prisma.user.count(),
    wallets: await prisma.wallet.count(),
    events: await prisma.event.count(),
    tickets: await prisma.ticket.count(),
    songs: await prisma.song.count(),
    nfts: await prisma.nFT.count(),
    royalties: await prisma.royalty.count(),
    votes: await prisma.vote.count(),
    transactions: await prisma.transaction.count(),
  }

  console.log("Table counts:", JSON.stringify(tableCounts, null, 2))
  console.log("Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
