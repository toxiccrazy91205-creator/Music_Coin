import { describe, it, expect, beforeAll } from "vitest"
import { signToken, verifyToken } from "@/lib/auth/session"
import { UserRole } from "@/types"

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-that-is-at-least-32-chars-long!!"
})

describe("session", () => {
  it("should sign and verify a token", async () => {
    const payload = { sub: "user-1", email: "test@example.com", role: UserRole.ARTIST }
    const token = await signToken(payload)
    expect(token).toBeTruthy()
    const decoded = await verifyToken(token)
    expect(decoded.sub).toBe("user-1")
    expect(decoded.email).toBe("test@example.com")
    expect(decoded.role).toBe(UserRole.ARTIST)
  })

  it("should reject invalid token", async () => {
    await expect(verifyToken("invalid-token")).rejects.toThrow()
  })
})
