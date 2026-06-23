import { describe, it, expect } from "vitest"
import { loginSchema, registerSchema } from "@/lib/auth/validation"
import { UserRole } from "@/types"

describe("loginSchema", () => {
  it("should accept valid login input", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "Password123!" })
    expect(result.success).toBe(true)
  })

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "Password123!" })
    expect(result.success).toBe(false)
  })

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" })
    expect(result.success).toBe(false)
  })
})

describe("registerSchema", () => {
  it("should accept valid register input", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "Password123!",
      role: UserRole.ARTIST,
    })
    expect(result.success).toBe(true)
  })

  it("should reject missing name", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Password123!",
      role: UserRole.ARTIST,
    })
    expect(result.success).toBe(false)
  })

  it("should reject invalid role", () => {
    const result = registerSchema.safeParse({
      name: "Test",
      email: "test@example.com",
      password: "Password123!",
      role: "INVALID_ROLE",
    })
    expect(result.success).toBe(false)
  })
})
