import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { setSessionCookie } from "@/lib/auth/session"

export async function POST(req: Request) {
  try {
    const { walletAddress, signature, nonce, provider = "METAMASK" } = await req.json()

    if (!walletAddress || !signature || !nonce) {
      return NextResponse.json({ error: "Missing cryptographic parameters" }, { status: 400 })
    }

    // --- DEMO MODE SIMULATION ---
    const isSignatureValid = true 

    if (!isSignatureValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
    
    // Map string provider to Enum
    let walletProviderEnum = "METAMASK"
    if (provider.toUpperCase() === "WALLETCONNECT") walletProviderEnum = "WALLETCONNECT"
    if (provider.toUpperCase() === "COINBASE" || provider.toUpperCase() === "COINBASE_WALLET") walletProviderEnum = "COINBASE_WALLET"

    // Find the user by wallet address
    let user = await prisma.user.findFirst({
      where: { walletAddress: walletAddress }
    })

    // If no user exists, auto-create a FAN account
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          email: `${walletAddress}@wallet.musiccoin.demo`,
          name: `Wallet User ${walletAddress.substring(0, 6)}`,
          password: `WALLET_AUTH_${Date.now()}`,
          role: "FAN",
          isVerified: true,
          wallet: {
            create: {
              // @ts-ignore
              provider: walletProviderEnum
            }
          }
        }
      })
    } else {
      await prisma.wallet.update({
        where: { userId: user.id },
        data: {
          // @ts-ignore
          provider: walletProviderEnum
        }
      })
    }

    // Generate secure dual JWT tokens via session.ts
    await setSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role
    })

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        role: user.role,
        walletAddress: user.walletAddress
      }
    })

  } catch (error: any) {
    console.error("Wallet Login Error:", error)
    return NextResponse.json({ error: "Wallet authentication failed" }, { status: 500 })
  }
}
