import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    // 10 minutes expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Upsert into DB
    await prisma.oTP.upsert({
      where: { email },
      update: { code, expiresAt },
      create: { email, code, expiresAt },
    })


    // Setup Nodemailer transporter
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      const mailOptions = {
        from: `"Music Coin Festival" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your Music Coin Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #333;">Welcome to Music Coin Festival!</h2>
            <p style="color: #666; font-size: 16px;">Please use the following 6-digit code to verify your email address.</p>
            <div style="margin: 30px 0; padding: 20px; background-color: #f4f4f5; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #18181b;">${code}</span>
            </div>
            <p style="color: #999; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      console.log(`📧 Successfully sent email to ${email}`)
    } else {
      console.warn("SMTP_USER or SMTP_PASS not set in .env! Email not sent.")
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Send OTP Error", error)
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}
