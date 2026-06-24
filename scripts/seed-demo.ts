import { PrismaClient, UserRole } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const alreadySeeded = await prisma.user.findFirst({ where: { email: "fan1@demo.com" } })
  if (alreadySeeded) {
    console.log("Seed already executed, skipping.")
    return
  }

  console.log("Seeding demo data...")

  // 1. Create platform admin wallet user
  const platformUser = await prisma.user.upsert({
    where: { email: "platform@musiccoin.demo" },
    update: {},
    create: { name: "Platform Admin", email: "platform@musiccoin.demo", password: "demo", role: "ORGANIZER" },
  })
  let pw = await prisma.wallet.findUnique({ where: { userId: platformUser.id } })
  if (!pw) {
    pw = await prisma.wallet.create({ data: { userId: platformUser.id, balance: 100000 } })
  } else {
    await prisma.wallet.update({ where: { id: pw.id }, data: { balance: { increment: 100000 } } })
  }
  console.log("  Platform wallet:", pw.id, "balance:", 100000)

  async function createUser(name: string, email: string, role: UserRole) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, password: "demo", role },
    })
    let wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: user.id, balance: 1000 } })
    }
    return { user, wallet }
  }

  // 2. Fans
  const fans: { user: { id: string }; wallet: { id: string } }[] = []
  for (let i = 1; i <= 100; i++) {
    fans.push(await createUser(`Fan ${i}`, `fan${i}@demo.com`, "FAN"))
  }
  console.log(`  Created ${fans.length} fans`)

  // 3. Artists
  const artists: { user: { id: string; name: string }; wallet: { id: string } }[] = []
  for (let i = 1; i <= 20; i++) {
    artists.push(await createUser(`Artist ${i}`, `artist${i}@demo.com`, "ARTIST"))
  }
  console.log(`  Created ${artists.length} artists`)

  // 4. Organizers
  const organizers: { user: { id: string }; wallet: { id: string } }[] = []
  for (let i = 1; i <= 10; i++) {
    organizers.push(await createUser(`Organizer ${i}`, `organizer${i}@demo.com`, "ORGANIZER"))
  }
  console.log(`  Created ${organizers.length} organizers`)

  // 5. Production houses
  for (let i = 1; i <= 5; i++) {
    await createUser(`Production House ${i}`, `ph${i}@demo.com`, "PRODUCTION_HOUSE")
  }
  console.log("  Created 5 production houses")

  // 6. Festivals (events)
  const festivalNames = ["Summer Vibes", "Rock Fest", "Jazz Night", "EDM Festival", "Hip Hop Summit",
    "Classical Evening", "Folk Gathering", "Indie Fest", "Metal Mayhem", "Pop Explosion"]
  for (let i = 0; i < 10; i++) {
    const organizer = organizers[i % organizers.length]
    await prisma.event.create({
      data: {
        title: festivalNames[i],
        description: `Annual ${festivalNames[i]} music festival`,
        date: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
        venue: `Venue ${i + 1}`,
        capacity: 5000 + i * 1000,
        organizerId: organizer.user.id,
        ticketPrice: 50 + i * 10,
        status: "PUBLISHED",
      },
    })
  }
  console.log("  Created 10 festivals")

  // 7. Create songs and NFTs
  const songStyles = ["Pop", "Rock", "Jazz", "Electronic", "Hip Hop", "Classical", "R&B", "Country", "Blues", "Reggae"]
  let nftCount = 0
  for (const artist of artists) {
    const numSongs = 2 + Math.floor(Math.random() * 2)
    for (let s = 1; s <= numSongs && nftCount < 100; s++) {
      const style = songStyles[(nftCount + s) % songStyles.length]
      const song = await prisma.song.create({
        data: { title: `${style} Track ${s} by ${artist.user.name}`, description: `${style} track`, artistId: artist.user.id },
      })
      const price = 10 + Math.floor(Math.random() * 90)
      await prisma.nFT.create({
        data: { songId: song.id, ownerId: artist.user.id, price, royaltyPercentage: 10 },
      })
      nftCount++
    }
  }
  console.log(`  Created ${nftCount} NFTs`)

  // 8. Create ticket purchases
  const events = await prisma.event.findMany()
  let ticketCount = 0
  for (const event of events) {
    const buyers = fans.slice(0, 5 + Math.floor(Math.random() * 10))
    for (const buyer of buyers) {
      await prisma.ticket.create({
        data: { eventId: event.id, userId: buyer.user.id, seatNumber: `A${Math.floor(Math.random() * 100) + 1}` },
      })
      await prisma.transaction.create({
        data: {
          senderId: buyer.wallet.id,
          receiverId: buyer.wallet.id,
          amount: Number(event.ticketPrice),
          type: "TICKET_PURCHASE",
        },
      })
      ticketCount++
    }
  }
  console.log(`  Created ${ticketCount} ticket purchases`)

  // 9. Simulate NFT purchases and royalties
  const allNfts = await prisma.nFT.findMany()
  let txCount = 0
  let royaltyCount = 0
  for (const nft of allNfts.slice(0, 50)) {
    const buyer = fans[Math.floor(Math.random() * fans.length)]
    const ownerArtist = artists.find(a => a.user.id === nft.ownerId)
    if (!ownerArtist) continue

    await prisma.transaction.create({
      data: {
        senderId: buyer.wallet.id,
        receiverId: ownerArtist.wallet.id,
        amount: Number(nft.price),
        type: "TRANSFER",
      },
    })
    txCount++

    if (Number(nft.royaltyPercentage) > 0) {
      const royaltyAmount = Number(nft.price) * Number(nft.royaltyPercentage) / 100
      await prisma.royalty.create({
        data: { nftId: nft.id, artistId: ownerArtist.user.id, amount: royaltyAmount },
      })
      await prisma.transaction.create({
        data: {
          senderId: buyer.wallet.id,
          receiverId: ownerArtist.wallet.id,
          amount: royaltyAmount,
          type: "ROYALTY_PAYMENT",
        },
      })
      royaltyCount++
    }
  }

  // Extra DEPOSIT transactions to reach target
  for (let i = 0; i < 200; i++) {
    const fan = fans[Math.floor(Math.random() * fans.length)]
    await prisma.transaction.create({
      data: {
        senderId: fan.wallet.id,
        receiverId: fan.wallet.id,
        amount: 5 + Math.floor(Math.random() * 50),
        type: "DEPOSIT",
      },
    })
    txCount++
  }

  console.log(`  Created ${txCount} NFT transactions and ${royaltyCount} royalties`)
  console.log(`  Total transactions: ${ticketCount + txCount}`)

  // 10. Create votes
  let voteCount = 0
  for (const fan of fans) {
    const votedArtist = artists[Math.floor(Math.random() * artists.length)]
    const existing = await prisma.vote.findFirst({
      where: { fanId: fan.user.id, artistId: votedArtist.user.id },
    })
    if (existing) {
      await prisma.vote.update({
        where: { id: existing.id },
        data: { weight: { increment: 1 } },
      })
    } else {
      await prisma.vote.create({
        data: { fanId: fan.user.id, artistId: votedArtist.user.id, weight: 1 },
      })
    }
    voteCount++
  }
  console.log(`  Created ${voteCount} votes`)

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
