"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { serialize } from "@/lib/serialize"

export async function getNotificationsAction() {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return { success: true as const, data: serialize(notifications) }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return { success: true as const, data: null }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const session = await getSession()
    if (!session) return { success: false as const, error: "Not authenticated" }

    await prisma.notification.updateMany({
      where: { userId: session.sub, isRead: false },
      data: { isRead: true },
    })

    return { success: true as const, data: null }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}
