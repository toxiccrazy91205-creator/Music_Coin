"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { signToken, setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth/session"
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/auth/validation"
import type { AuthResult } from "@/lib/auth/roles"
import type { IUserPublic } from "@/types"
import { Prisma, TransactionType } from "@prisma/client"

function sanitizeUser(user: { password: string; [key: string]: unknown }): IUserPublic {
  const { password: _, ...safe } = user
  return safe as IUserPublic
}

export async function register(input: RegisterInput): Promise<AuthResult<IUserPublic>> {
  try {
    const parsed = registerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { name, email, password, role } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { success: false, error: "An account with this email already exists" }
    }

    const hashed = await hashPassword(password)

    const user = await prisma.$transaction(async (tx) => {
      const isApproved = role === "FAN" ? true : false;
      const newUser = await tx.user.create({
        data: { name, email, password: hashed, role, isApproved },
      })

      const wallet = await tx.wallet.create({
        data: { userId: newUser.id, balance: new Prisma.Decimal(0) },
      })

      if (role === "FAN") {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: new Prisma.Decimal(1000) } },
        })
        await tx.transaction.create({
          data: {
            senderId: wallet.id,
            receiverId: wallet.id,
            amount: new Prisma.Decimal(1000),
            type: TransactionType.DEPOSIT,
          },
        })
      }

      return newUser
    })

    await setSessionCookie({ sub: user.id, email: user.email, role: user.role })

    return { success: true, data: sanitizeUser(user) }
  } catch (error) {
    console.error("Register error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export async function login(input: LoginInput): Promise<AuthResult<IUserPublic>> {
  try {
    const parsed = loginSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return { success: false, error: "Invalid email or password" }
    }

    await setSessionCookie({ sub: user.id, email: user.email, role: user.role })

    return { success: true, data: sanitizeUser(user) }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export async function logout(): Promise<AuthResult<null>> {
  try {
    await clearSessionCookie()
    return { success: true, data: null }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export async function getProfile(): Promise<AuthResult<IUserPublic>> {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    })

    if (!user) {
      await clearSessionCookie()
      return { success: false, error: "User not found" }
    }

    return { success: true, data: user as unknown as IUserPublic }
  } catch (error) {
    console.error("GetProfile error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}
