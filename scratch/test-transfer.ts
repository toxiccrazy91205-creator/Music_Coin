import { WalletService } from "../src/features/wallet/wallet.service"
import { prisma } from "../src/lib/prisma"
import { Prisma } from "@prisma/client"

async function run() {
  try {
    const users = await prisma.user.findMany({ take: 2 })
    if (users.length < 2) {
      console.log("Need at least 2 users")
      return
    }

    const senderWallet = await prisma.wallet.findUnique({ where: { userId: users[0].id } })
    const receiverWallet = await prisma.wallet.findUnique({ where: { userId: users[1].id } })

    if (!senderWallet || !receiverWallet) {
      console.log("Wallets not found")
      return
    }

    console.log(`Sender: ${users[0].email} (${senderWallet.balance} MC)`)
    console.log(`Receiver: ${users[1].email} (${receiverWallet.balance} MC)`)

    // Credit sender for test
    await prisma.wallet.update({
      where: { id: senderWallet.id },
      data: { balance: 100 }
    })

    console.log("Executing transfer...")
    const result = await WalletService.executeWalletTransfer(
      senderWallet.id,
      receiverWallet.id,
      new Prisma.Decimal(10)
    )
    
    console.log("Success:", result)
  } catch (e: any) {
    console.error("Error:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}

run()
