import { UserRole, ROLE_LEVELS } from "@/types"

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function hasPermission(userRole: UserRole, requiredLevel: number): boolean {
  const userLevel = ROLE_LEVELS[userRole]
  return userLevel >= requiredLevel
}

export function canAccessRoute(userRole: UserRole, routeLevel: number): boolean {
  return hasPermission(userRole, routeLevel)
}
