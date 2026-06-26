import { Prisma } from "@prisma/client"

export function serialize<T>(value: T): T {
  if (value instanceof Prisma.Decimal) {
    return Number(value) as T
  }
  if (value instanceof Date) {
    return value as T
  }
  if (Array.isArray(value)) {
    return value.map(serialize) as T
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>)) {
      result[key] = serialize((value as Record<string, unknown>)[key])
    }
    return result as T
  }
  return value
}
