"use client"

import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Music, TrendingUp, Coins, Activity } from "lucide-react"

export default function TokensAdminPage() {
  const { user } = useAuth()

  if (!user || user.role !== "ADMIN") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Token Management</h1>
          <p className="text-muted-foreground mt-1">Monitor FanToken.sol deployment, supply, and liquidity.</p>
        </div>
        <Button>
          <Coins className="mr-2 h-4 w-4" />
          Mint Tokens
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supply (MFT)</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,000,000</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Circulating Supply</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">450,230</div>
            <p className="text-xs text-muted-foreground mt-1">45% of total supply</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120,500</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Price</CardTitle>
            <Music className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">$1.24</div>
            <p className="text-xs text-green-500 mt-1">+2.4% (24h)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Operations & Governance</CardTitle>
          <CardDescription>Recent mints, burns, and large staking events.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Event Type</th>
                  <th className="px-6 py-4 font-medium">Amount (MFT)</th>
                  <th className="px-6 py-4 font-medium">Address</th>
                  <th className="px-6 py-4 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { id: 1, type: "Stake", amount: "5,000", address: "0x3a...9f2b", time: "10 mins ago" },
                  { id: 2, type: "Transfer", amount: "200", address: "0x1c...4d5e", time: "1 hour ago" },
                  { id: 3, type: "Mint", amount: "100,000", address: "Admin MultiSig", time: "2 days ago" },
                ].map((row) => (
                  <tr key={row.id} className="bg-card hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.type === 'Mint' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                        row.type === 'Stake' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{row.amount}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{row.address}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{row.time}</td>
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
