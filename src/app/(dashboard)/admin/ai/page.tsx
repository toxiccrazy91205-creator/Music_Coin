"use client"

import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bot, Sparkles, TrendingUp, ShieldAlert, Zap } from "lucide-react"

export default function AIDashboardPage() {
  const { user } = useAuth()

  if (!user || user.role !== "ADMIN") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Command Center</h1>
          <p className="text-muted-foreground mt-1">Phase 2 predictive modeling and artificial intelligence engine.</p>
        </div>
        <div className="text-sm font-bold text-white flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 rounded-full shadow-lg">
          <Sparkles className="h-4 w-4" /> Phase 2 Beta
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardHeader>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Demand Prediction</CardTitle>
            <CardDescription>AI-driven ticket pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our neural network predicts ticket demand based on artist popularity, historical sales, and global listening trends.
            </p>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-[75%]"></div>
            </div>
            <p className="text-xs text-right mt-2 text-muted-foreground">Model Accuracy: 94.2%</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldAlert className="h-24 w-24" />
          </div>
          <CardHeader>
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>AI Fraud Detection</CardTitle>
            <CardDescription>Wash-trading prevention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Real-time anomaly detection scans blockchain transactions to automatically flag wash trading and illicit royalty loops.
            </p>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-red-600 w-[99%]"></div>
            </div>
            <p className="text-xs text-right mt-2 text-muted-foreground">Monitoring 100% of blocks</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bot className="h-24 w-24" />
          </div>
          <CardHeader>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
              <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle>Recommendation Engine</CardTitle>
            <CardDescription>Hyper-personalized Discovery</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Matches fans with undiscovered artists using collaborative filtering and deep audio vectorization.
            </p>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 w-[60%]"></div>
            </div>
            <p className="text-xs text-right mt-2 text-muted-foreground">Training in progress...</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30 border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Deploy AI Models</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Connecting the cluster to production data will consume significant compute credits. Are you ready to initialize the Phase 2 AI engine?
          </p>
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium opacity-50 cursor-not-allowed">
            Initialize Engine (Locked)
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
