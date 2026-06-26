"use server"

import { AnalyticsService } from "./analytics.service"
import { serialize } from "@/lib/serialize"

export async function getAnalyticsAction() {
  try {
    return serialize(await AnalyticsService.getAnalytics())
  } catch {
    return null
  }
}
