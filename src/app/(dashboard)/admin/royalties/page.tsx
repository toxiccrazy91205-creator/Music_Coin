"use client"

import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, AlertTriangle, ArrowRightLeft } from "lucide-react"

export default function RoyaltiesAdminPage() {
  const { user } = useAuth()

  if (!user || user.role !== "ADMIN") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Royalty Management</h1>
          <p className="text-muted-foreground mt-1">Oversee platform-wide royalty flows and contract metrics.</p>
        </div>
        <Button variant="outline">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          View Blockchain Logs
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Royalties Distributed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$142,300.50</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Smart Contracts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,240</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">2</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Royalty Distributions</CardTitle>
          <CardDescription>Real-time stream of automated payouts via RoyaltyDistribution.sol.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Contract ID</th>
                  <th className="px-6 py-4 font-medium">Beneficiary</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { id: "RD-7439", beneficiary: "Neon Sound Studios (Split)", amount: "$450.00", status: "Completed", tx: "0x4f...a1b2" },
                  { id: "RD-7440", beneficiary: "DJ Eclipse", amount: "$120.50", status: "Completed", tx: "0x8e...c3d4" },
                  { id: "RD-7441", beneficiary: "Bassline Productions", amount: "$890.00", status: "Disputed", tx: "Pending" },
                ].map((row) => (
                  <tr key={row.id} className="bg-card hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">{row.id}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.beneficiary}</td>
                    <td className="px-6 py-4 font-medium">{row.amount}</td>
                    <td className="px-6 py-4">
                      {row.status === "Completed" ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {row.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-muted-foreground">
                      {row.tx !== "Pending" ? <a href="#" className="hover:underline">{row.tx}</a> : row.tx}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
