import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { UserRole, ROLE_LEVELS } from "@/types"

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/api/auth/",
  "/api/events",
  "/api/nfts",
  "/_next/static/",
  "/_next/image/",
  "/favicon.ico",
  "/events",
  "/nft-marketplace",
]

const ROUTE_LEVELS: Record<string, number> = {
  "/admin": ROLE_LEVELS[UserRole.ADMIN],
  "/artist/analytics": ROLE_LEVELS[UserRole.ARTIST],
  "/artist/nfts/create": ROLE_LEVELS[UserRole.ARTIST],
  "/production-house": ROLE_LEVELS[UserRole.PRODUCTION_HOUSE],
  "/organizer/events/new": ROLE_LEVELS[UserRole.ORGANIZER],
  "/organizer/events": ROLE_LEVELS[UserRole.ORGANIZER],
}

const DEFAULT_ROUTE_LEVEL = ROLE_LEVELS[UserRole.FAN]

// Simple In-Memory Rate Limiter for Edge (Per Isolate)
const RATE_LIMIT_MAP = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_MAX_REQUESTS = 100
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters")
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

  // 0. SSL/TLS Enforcement (Data in Transit)
  // Disabled for EC2 IP testing
  // if (process.env.NODE_ENV === "production" && request.headers.get("x-forwarded-proto") !== "https") {
  //   const secureUrl = new URL(request.url)
  //   secureUrl.protocol = "https:"
  //   return NextResponse.redirect(secureUrl, 301)
  // }

  const isApi = pathname.startsWith("/api")

  // 1. CORS Enforcement
  const response = NextResponse.next()
  if (isApi) {
    // Modify these to match your actual deployed domain later
    response.headers.set("Access-Control-Allow-Origin", "https://musiccoin.demo")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    
    // Handle OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { headers: response.headers, status: 204 })
    }
  }

  // 2. Rate Limiting (DDoS Protection) - Disabled for Local Development to prevent testing blocks
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  
  if (process.env.NODE_ENV !== "development") {
    const now = Date.now()
    const rateLimitData = RATE_LIMIT_MAP.get(ip)

    if (rateLimitData) {
      if (now - rateLimitData.timestamp > RATE_LIMIT_WINDOW_MS) {
        RATE_LIMIT_MAP.set(ip, { count: 1, timestamp: now })
      } else {
        rateLimitData.count += 1
        if (rateLimitData.count > RATE_LIMIT_MAX_REQUESTS) {
          return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), { 
            status: 429, 
            headers: { "Content-Type": "application/json" }
          })
        }
      }
    } else {
      RATE_LIMIT_MAP.set(ip, { count: 1, timestamp: now })
    }
  }

  // 3. CSRF Protection (Mutation Requests)
  if (isApi && ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    // If it's a mutation, ensure it originated from our app (or is explicitly allowed cross-origin if needed)
    const origin = request.headers.get("origin")
    const fetchSite = request.headers.get("sec-fetch-site")
    
    // Relaxed CSRF for Demo: If origin is completely missing (like curl/postman testing), we allow it.
    // If it is present, it MUST match our trusted domain.
    // Disabled for EC2 raw IP testing since the origin won't be musiccoin.demo or localhost
    // if (origin && !origin.includes("musiccoin.demo") && !origin.includes("localhost")) {
    //    return new NextResponse(JSON.stringify({ error: "CSRF Forbidden" }), { 
    //      status: 403, 
    //      headers: { "Content-Type": "application/json" }
    //    })
    // }
    
    // Strict browser fetch-site check
    if (fetchSite && fetchSite === "cross-site") {
      return new NextResponse(JSON.stringify({ error: "Cross-Site Requests Forbidden" }), { 
        status: 403, 
        headers: { "Content-Type": "application/json" }
      })
    }
  }

  // Allow Public Routes
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  if (isPublicRoute) {
    // Keep CORS headers by returning the modified response object
    return response
  }

  // Authentication & Authorization for Protected Routes
  const token = request.cookies.get("__session")?.value
  if (!token) {
    return isApi 
      ? new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: response.headers })
      : NextResponse.redirect(new URL("/login", request.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    if (isApi) {
      return new NextResponse(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: response.headers })
    } else {
      const redirectResponse = NextResponse.redirect(new URL("/login", request.url))
      redirectResponse.cookies.set("__session", "", { maxAge: 0 })
      return redirectResponse
    }
  }

  if (pathname.startsWith("/dashboard")) {
    const requiredRoute = Object.entries(ROUTE_LEVELS).find(([route]) => pathname.startsWith(route))
    const requiredLevel = requiredRoute ? requiredRoute[1] : DEFAULT_ROUTE_LEVEL
    const userLevel = ROLE_LEVELS[payload.role]

    if (userLevel < requiredLevel) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
