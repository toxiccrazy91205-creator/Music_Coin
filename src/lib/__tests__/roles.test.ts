import { describe, it, expect } from "vitest"
import { hasPermission, canAccessRoute } from "@/lib/auth/roles"
import { UserRole, ROLE_LEVELS } from "@/types"

describe("hasPermission", () => {
  it("should allow ADMIN for any action", () => {
    expect(hasPermission(UserRole.ADMIN, ROLE_LEVELS[UserRole.FAN])).toBe(true)
    expect(hasPermission(UserRole.ADMIN, ROLE_LEVELS[UserRole.ADMIN])).toBe(true)
  })

  it("should deny lower role for higher action", () => {
    expect(hasPermission(UserRole.FAN, ROLE_LEVELS[UserRole.ADMIN])).toBe(false)
    expect(hasPermission(UserRole.FAN, ROLE_LEVELS[UserRole.ARTIST])).toBe(false)
  })

  it("should allow equal or higher role", () => {
    expect(hasPermission(UserRole.ARTIST, ROLE_LEVELS[UserRole.FAN])).toBe(true)
    expect(hasPermission(UserRole.ARTIST, ROLE_LEVELS[UserRole.ARTIST])).toBe(true)
  })
})

describe("canAccessRoute", () => {
  it("should allow user with level >= route level", () => {
    expect(canAccessRoute(UserRole.ADMIN, ROLE_LEVELS[UserRole.ADMIN])).toBe(true)
    expect(canAccessRoute(UserRole.ADMIN, ROLE_LEVELS[UserRole.FAN])).toBe(true)
    expect(canAccessRoute(UserRole.ARTIST, ROLE_LEVELS[UserRole.FAN])).toBe(true)
  })

  it("should deny user with level < route level", () => {
    expect(canAccessRoute(UserRole.FAN, ROLE_LEVELS[UserRole.ADMIN])).toBe(false)
    expect(canAccessRoute(UserRole.FAN, ROLE_LEVELS[UserRole.ARTIST])).toBe(false)
  })
})
