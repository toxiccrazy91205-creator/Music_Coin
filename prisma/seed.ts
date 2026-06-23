import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as crypto from "crypto"

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

async function main() {
  console.log("Seeding database...")

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@musiccoin.festival" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@musiccoin.festival",
      password: hashPassword("Admin@123"),
      role: "ADMIN",
    },
  })

  console.log(`Admin user created: ${adminUser.email} (${adminUser.id})`)

  const wallet = await prisma.wallet.findUnique({
    where: { userId: adminUser.id },
  })

  if (!wallet) {
    await prisma.wallet.create({
      data: {
        userId: adminUser.id,
        balance: 1000,
      },
    })
    console.log("Wallet created for admin user with balance 1000")
  } else {
    console.log(`Wallet found with balance: ${wallet.balance}`)
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

  console.log("Database connection verified. Table counts:", JSON.stringify(tableCounts, null, 2))
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
