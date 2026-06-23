import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"
import { UserRole } from "@/types"

export interface TokenPayload extends JWTPayload {
  sub: string
  email: string
  role: UserRole
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long")
  }
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: Omit<TokenPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] })
  return payload as unknown as TokenPayload
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("__session")?.value
  if (!token) return null
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("__session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}
