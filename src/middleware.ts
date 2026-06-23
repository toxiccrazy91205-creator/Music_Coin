import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { UserRole, ROLE_LEVELS } from "@/types"

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/_next/static/",
  "/_next/image/",
  "/favicon.ico",
]

const ROUTE_LEVELS: Record<string, number> = {
  "/dashboard/admin": ROLE_LEVELS[UserRole.ADMIN],
  "/dashboard/analytics": ROLE_LEVELS[UserRole.ARTIST],
  "/dashboard/nfts/create": ROLE_LEVELS[UserRole.ARTIST],
  "/dashboard/events/create": ROLE_LEVELS[UserRole.ORGANIZER],
}

const DEFAULT_ROUTE_LEVEL = ROLE_LEVELS[UserRole.FAN]

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not set")
  return new TextEncoder().encode(secret)
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] })
    return payload as unknown as { sub: string; email: string; role: UserRole }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  if (isPublicRoute) return NextResponse.next()

  const token = request.cookies.get("__session")?.value
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.set("__session", "", { maxAge: 0 })
    return response
  }

  if (pathname.startsWith("/dashboard")) {
    const requiredRoute = Object.entries(ROUTE_LEVELS).find(([route]) =>
      pathname.startsWith(route)
    )
    const requiredLevel = requiredRoute ? requiredRoute[1] : DEFAULT_ROUTE_LEVEL
    const userLevel = ROLE_LEVELS[payload.role]

    if (userLevel < requiredLevel) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
