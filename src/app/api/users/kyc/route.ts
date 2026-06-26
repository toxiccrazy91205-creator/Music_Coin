import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { encryptData, decryptData } from "@/lib/security/encryption"

// POST: Securely encrypt and store KYC Data
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { ssn, passportNumber, legalName } = await request.json()

    if (!ssn && !passportNumber) {
      return NextResponse.json({ error: "Identity data required" }, { status: 400 })
    }

    // Stringify the sensitive data
    const kycPayload = JSON.stringify({
      ssn,
      passportNumber,
      legalName,
      submittedAt: new Date().toISOString()
    })

    // AES-256-GCM Encryption
    const encryptedKycData = encryptData(kycPayload)

    // Store strictly the cipher-text in PostgreSQL
    await prisma.user.update({
      where: { id: session.sub },
      data: { encryptedKycData }
    })

    return NextResponse.json({ success: true, message: "KYC data encrypted and stored securely." })
  } catch (error: any) {
    console.error("KYC Encryption Error:", error)
    return NextResponse.json({ error: "Failed to process secure data" }, { status: 500 })
  }
}

// GET: Securely retrieve and decrypt KYC Data
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { encryptedKycData: true }
    })

    if (!user || !user.encryptedKycData) {
      return NextResponse.json({ error: "No KYC data found" }, { status: 404 })
    }

    // AES-256-GCM Decryption
    const decryptedPayload = decryptData(user.encryptedKycData)
    const kycData = JSON.parse(decryptedPayload)

    return NextResponse.json({ success: true, data: kycData })
  } catch (error: any) {
    console.error("KYC Decryption Error:", error)
    return NextResponse.json({ error: "Failed to decrypt secure data" }, { status: 500 })
  }
}
