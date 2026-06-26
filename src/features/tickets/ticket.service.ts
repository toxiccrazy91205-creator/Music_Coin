import { prisma } from "@/lib/prisma"
import { AppError } from "@/lib/errors"

export const TicketService = {
  async buyTicket(userId: string, eventId: string) {
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } })
      if (!event) throw new AppError("Event not found", 404)
      if (event.status !== "PUBLISHED") throw new AppError("Event is not available for purchase", 400)

      let currentTicketPrice = event.ticketPrice
      let activeTier = "GENERAL"

      // --- DYNAMIC PRICING ALGORITHM ---
      if (event.capacity !== null) {
        const ticketCount = await tx.ticket.count({ where: { eventId } })
        if (ticketCount >= event.capacity) throw new AppError("Event is sold out", 400)

        if (event.isDynamicPricingEnabled) {
          const capacityRemaining = event.capacity - ticketCount
          const percentRemaining = capacityRemaining / event.capacity

          if (percentRemaining <= 0.20) {
            // High Demand Surge: Capacity drops below 20%, Surge price by 25%
            currentTicketPrice = currentTicketPrice.mul(1.25)
            activeTier = "HIGH_DEMAND_SURGE"
          } else if (percentRemaining >= 0.80) {
            // Early Bird: Above 80% capacity remains, Discount price by 10%
            currentTicketPrice = currentTicketPrice.mul(0.90)
            activeTier = "EARLY_BIRD"
          }
        }
      }

      const fanWallet = await tx.wallet.findUnique({ where: { userId } })
      if (!fanWallet) throw new AppError("Wallet not found", 404)
      if (fanWallet.balance.lessThan(currentTicketPrice)) {
        throw new AppError("Insufficient funds to purchase ticket", 400)
      }

      const organizerWallet = await tx.wallet.findUnique({ where: { userId: event.organizerId } })
      if (!organizerWallet) throw new AppError("Organizer wallet not found", 404)

      await tx.wallet.update({
        where: { id: fanWallet.id },
        data: { balance: { decrement: currentTicketPrice } },
      })
      await tx.wallet.update({
        where: { id: organizerWallet.id },
        data: { balance: { increment: currentTicketPrice } },
      })

      const simulatedNftTokenId = "nft_" + Math.random().toString(36).substring(2, 15)
      const simulatedQrCode = "qr_" + Math.random().toString(36).substring(2, 15)

      const ticket = await tx.ticket.create({
        data: { 
          eventId, 
          userId,
          price: currentTicketPrice,
          tier: activeTier,
          nftTokenId: simulatedNftTokenId,
          qrCode: simulatedQrCode,
        },
      })

      const transaction = await tx.transaction.create({
        data: {
          senderId: fanWallet.id,
          receiverId: organizerWallet.id,
          amount: currentTicketPrice,
          type: "TICKET_PURCHASE",
        },
      })

      return { ticket, transaction }
    })
  },

  async getUserTickets(userId: string) {
    return prisma.ticket.findMany({
      where: { userId },
      include: { event: { include: { organizer: { select: { id: true, name: true } } } } },
      orderBy: { purchaseDate: "desc" },
    })
  },
}
