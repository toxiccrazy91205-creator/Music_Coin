import { prisma } from "@/lib/prisma"
import { AppError } from "@/lib/errors"

export const TicketService = {
  async buyTicket(userId: string, eventId: string) {
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } })
      if (!event) throw new AppError("Event not found", 404)
      if (event.status !== "PUBLISHED") throw new AppError("Event is not available for purchase", 400)

      if (event.capacity !== null) {
        const ticketCount = await tx.ticket.count({ where: { eventId } })
        if (ticketCount >= event.capacity) throw new AppError("Event is sold out", 400)
      }

      const fanWallet = await tx.wallet.findUnique({ where: { userId } })
      if (!fanWallet) throw new AppError("Wallet not found", 404)
      if (fanWallet.balance.lessThan(event.ticketPrice)) {
        throw new AppError("Insufficient funds to purchase ticket", 400)
      }

      const organizerWallet = await tx.wallet.findUnique({ where: { userId: event.organizerId } })
      if (!organizerWallet) throw new AppError("Organizer wallet not found", 404)

      await tx.wallet.update({
        where: { id: fanWallet.id },
        data: { balance: { decrement: event.ticketPrice } },
      })
      await tx.wallet.update({
        where: { id: organizerWallet.id },
        data: { balance: { increment: event.ticketPrice } },
      })

      const ticket = await tx.ticket.create({
        data: { eventId, userId },
      })

      const transaction = await tx.transaction.create({
        data: {
          senderId: fanWallet.id,
          receiverId: organizerWallet.id,
          amount: event.ticketPrice,
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
      orderBy: { createdAt: "desc" },
    })
  },
}
