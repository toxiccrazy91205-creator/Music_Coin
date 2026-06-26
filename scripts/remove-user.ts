import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import * as admin from "firebase-admin"
import { getApps, initializeApp, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import * as dotenv from "dotenv"

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

async function main() {
  const emails = process.argv.slice(2)
  if (emails.length === 0) {
    console.log("Please provide emails to delete. Usage: npx tsx scripts/remove-user.ts <email1> <email2>")
    return
  }

  for (const email of emails) {
    console.log(`\nAttempting to remove user: ${email}`)

    // 1. Remove from Prisma
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      await prisma.user.delete({ where: { email } })
      console.log(`Deleted from PostgreSQL DB: ${email}`)
    } else {
      console.log(`User not found in PostgreSQL DB: ${email}`)
    }

    // 2. Remove from Firebase
    try {
      const fbUser = await getAuth().getUserByEmail(email)
      await getAuth().deleteUser(fbUser.uid)
      console.log(`Deleted from Firebase Auth: ${email}`)
    } catch (error: any) {
      console.log(`User not found in Firebase Auth (or error): ${error.message}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
