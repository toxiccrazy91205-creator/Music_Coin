"use client"

import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Rocket, Users, Target } from "lucide-react"

export default function OrganizerCrowdfundingPage() {
  const { user } = useAuth()

  if (!user || user.role !== "ORGANIZER") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crowdfunding Campaigns</h1>
          <p className="text-muted-foreground mt-1">Raise capital from your fanbase for upcoming events to reduce financial risk.</p>
        </div>
        <Button>
          <Rocket className="mr-2 h-4 w-4" />
          Launch New Campaign
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,200</div>
            <p className="text-xs text-muted-foreground mt-1">Across 2 active campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Backers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,402</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funding Goal Met</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">85%</div>
            <p className="text-xs text-muted-foreground mt-1">Avg. completion rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>Track the progress of your live funding goals.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[
              {
                id: 1,
                name: "Summer Beats Festival 2026",
                raised: 35000,
                goal: 50000,
                backers: 850,
                daysLeft: 12,
              },
              {
                id: 2,
                name: "Neon Nights Club Tour",
                raised: 10200,
                goal: 10000,
                backers: 552,
                daysLeft: 2,
              }
            ].map((campaign) => (
              <div key={campaign.id} className="flex flex-col gap-2 border-b pb-6 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">{campaign.backers} backers • {campaign.daysLeft} days left</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">${campaign.raised.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground"> / ${campaign.goal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5 mt-2 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${campaign.raised >= campaign.goal ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, (campaign.raised / campaign.goal) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm">Manage Rewards</Button>
                  <Button size="sm">Update Backers</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
