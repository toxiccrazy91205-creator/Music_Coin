import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { getAnalyticsAction } from "@/features/analytics/analytics.actions"
import { RevenueChart, NftSalesChart, EventSalesSummary, ArtistEarningsChart } from "./charts"

export default async function AdminDashboard() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    redirect("/")
  }
  const data = await getAnalyticsAction()
  if (!data) return <div className="p-8 text-center text-muted-foreground">Failed to load analytics</div>

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">Revenue (12mo)</h2>
          <p className="mb-4 text-3xl font-bold">{data.revenue.total} MC</p>
          <RevenueChart data={data.revenue.byMonth} />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">NFT Sales (30d)</h2>
          <p className="mb-4 text-3xl font-bold">{data.nftSales.total} MC</p>
          <p className="mb-2 text-sm text-muted-foreground">{data.nftSales.count} transactions</p>
          <NftSalesChart data={data.nftSales.byDay} />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">Event Sales</h2>
          <EventSalesSummary total={data.eventSales.total} count={data.eventSales.count} />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">Top Artists by Earnings</h2>
          <ArtistEarningsChart data={data.artistEarnings} />
        </div>
      </div>
    </div>
  )
}
