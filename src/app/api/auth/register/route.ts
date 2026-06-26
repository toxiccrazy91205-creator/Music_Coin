import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/password"
import { signToken, setSessionCookie } from "@/lib/auth/session"
import { adminAuth } from "@/lib/firebase/admin"
import { Prisma, TransactionType } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { isDemo, email, password, name, role, firebaseIdToken } = body

    if (isDemo) {
      // Demo Mode Registration
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
      
      const hashed = await hashPassword(password)
      const user = await prisma.$transaction(async (tx) => {
        const isApproved = role === "FAN" ? true : false
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
      return NextResponse.json({ success: true, isDemo: true, data: { id: user.id, email: user.email, role: user.role } })
    }

    // Real Firebase Registration
    if (!firebaseIdToken) {
      return NextResponse.json({ error: "Missing Firebase token" }, { status: 400 })
    }

    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(firebaseIdToken)
    const existingUser = await prisma.user.findUnique({ where: { email: decodedToken.email! } })
    if (existingUser) {
        return NextResponse.json({ error: "Email already exists in database" }, { status: 400 })
    }

    // Create Prisma User with dummy password (Firebase manages auth)
    const user = await prisma.$transaction(async (tx) => {
      const isApproved = role === "FAN" ? true : false
      const newUser = await tx.user.create({
        data: { name: name || "User", email: decodedToken.email!, password: "FIREBASE_MANAGED", role, isApproved },
      })
      const wallet = await tx.wallet.create({
        data: { userId: newUser.id, balance: new Prisma.Decimal(0) },
      })
      if (role === "FAN") {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: new Prisma.Decimal(1000) } },
        })
      }
      return newUser
    })

    // Set custom claims on Firebase so it knows the user's role
    await adminAuth.setCustomUserClaims(decodedToken.uid, { role: user.role })

    // Create session cookie via our session logic only for Demo Mode
    // Real users must verify email and then login explicitly
    // const token = await signToken({ sub: user.id, email: user.email, role: user.role })
    // await setSessionCookie(token)

    return NextResponse.json({ success: true, data: { id: user.id, email: user.email, role: user.role } })
  } catch (error: any) {
    console.error("Register Error:", error)
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 })
  }
}
