"use server"

import { AnalyticsService } from "./analytics.service"

export async function getAnalyticsAction() {
  try {
    return await AnalyticsService.getAnalytics()
  } catch {
    return null
  }
}
