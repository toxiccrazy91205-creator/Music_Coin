"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

interface RevenueChartProps {
  data: { month: string; total: number }[]
}
export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Line
      data={{
        labels: data.map((d) => d.month),
        datasets: [{ label: "Revenue (MC)", data: data.map((d) => d.total), borderColor: "#10b981", tension: 0.3 }],
      }}
      options={{ responsive: true, plugins: { legend: { display: false } } }}
    />
  )
}

interface NftSalesChartProps {
  data: { date: string; total: number }[]
}
export function NftSalesChart({ data }: NftSalesChartProps) {
  return (
    <Bar
      data={{
        labels: data.map((d) => d.date.slice(5)),
        datasets: [{ label: "Sales (MC)", data: data.map((d) => d.total), backgroundColor: "#6366f1" }],
      }}
      options={{ responsive: true, plugins: { legend: { display: false } } }}
    />
  )
}

interface EventSalesChartProps {
  total: number
  count: number
}
export function EventSalesSummary({ total, count }: EventSalesChartProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">{total} MC</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Tickets Sold</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
      </div>
    </div>
  )
}

interface ArtistEarningsChartProps {
  data: { artistName: string; total: number }[]
}
export function ArtistEarningsChart({ data }: ArtistEarningsChartProps) {
  return (
    <Bar
      data={{
        labels: data.map((d) => d.artistName),
        datasets: [{ label: "Earnings (MC)", data: data.map((d) => d.total), backgroundColor: "#f59e0b" }],
      }}
      options={{ responsive: true, indexAxis: "y" as const, plugins: { legend: { display: false } } }}
    />
  )
}
