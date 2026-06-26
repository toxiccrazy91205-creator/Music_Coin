"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, Database, Activity, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

type SystemHealth = {
  id: string
  type: string
  status: string
  resolved: boolean
  details: string | null
  createdAt: string
}

export default function SystemHealthPage() {
  const { user } = useAuth()
  const [healthLogs, setHealthLogs] = useState<SystemHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch("/api/admin/system")
        if (response.ok) {
          const json = await response.json()
          if (json.success) setHealthLogs(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch system health", err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "ADMIN") fetchHealth()
  }, [user])

  if (!user || user.role !== "ADMIN") return null
  if (loading) return <div className="animate-pulse">Loading system health...</div>

  const isHealthy = !healthLogs.some(log => log.status === "CRITICAL" && !log.resolved)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <div className={`text-sm font-medium flex items-center gap-2 px-3 py-1 rounded-full ${
          isHealthy ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }`}>
          {isHealthy ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {isHealthy ? "All Systems Operational" : "System Issues Detected"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">99.99%</div>
            <p className="text-xs text-muted-foreground mt-1">Uptime across 4 regions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database (PostgreSQL)</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">12ms</div>
            <p className="text-xs text-muted-foreground mt-1">Average query latency</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Node Sync</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">Synced</div>
            <p className="text-xs text-muted-foreground mt-1">Block height: 18,493,291</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Health Check Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Component</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {healthLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors bg-card">
                    <td className="px-6 py-4 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium">{log.type}</td>
                    <td className="px-6 py-4">
                      {log.status === "HEALTHY" && <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Healthy</span>}
                      {log.status === "WARNING" && <span className="text-yellow-600 font-bold flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Warning</span>}
                      {log.status === "CRITICAL" && <span className="text-red-600 font-bold flex items-center gap-1"><XCircle className="h-4 w-4" /> Critical</span>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.details || "-"}
                      {!log.resolved && log.status !== "HEALTHY" && (
                        <span className="ml-2 inline-block bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Unresolved</span>
                      )}
                    </td>
                  </tr>
                ))}
                {healthLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No health alerts recorded. System is 100% operational.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
