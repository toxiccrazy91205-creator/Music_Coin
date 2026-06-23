import { describe, it, expect } from "vitest"
import { hashPassword, verifyPassword } from "@/lib/auth/password"

describe("password", () => {
  it("should hash and verify a password", async () => {
    const password = "TestPassword123!"
    const hashed = await hashPassword(password)
    expect(hashed).not.toBe(password)
    const valid = await verifyPassword(password, hashed)
    expect(valid).toBe(true)
  })

  it("should reject wrong password", async () => {
    const password = "TestPassword123!"
    const hashed = await hashPassword(password)
    const valid = await verifyPassword("WrongPassword456!", hashed)
    expect(valid).toBe(false)
  })
})
