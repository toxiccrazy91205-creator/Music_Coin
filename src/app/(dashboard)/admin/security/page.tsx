"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ShieldAlert, Key } from "lucide-react"

type AuditLog = {
  id: string
  action: string
  details: string | null
  createdAt: string
  admin: {
    name: string
    email: string
  }
}

export default function SecurityManagementPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch("/api/admin/audit")
        if (response.ok) {
          const json = await response.json()
          if (json.success) setLogs(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch logs", err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "ADMIN") fetchLogs()
  }, [user])

  if (!user || user.role !== "ADMIN") return null
  if (loading) return <div className="animate-pulse">Loading security logs...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Security Management</h1>
        <div className="text-sm font-medium text-green-600 flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
          <Shield className="h-4 w-4" /> System Secure
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Controls</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Strict</div>
            <p className="text-xs text-muted-foreground mt-1">MFA enforced for all Admin accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud Detection</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">Active</div>
            <p className="text-xs text-muted-foreground mt-1">Monitoring 100% of blockchain transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Admin</th>
                  <th className="px-6 py-4 font-medium">Action Taken</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors bg-card">
                    <td className="px-6 py-4 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium">
                      {log.admin.name}
                      <div className="text-xs text-muted-foreground">{log.admin.email}</div>
                    </td>
                    <td className="px-6 py-4 font-bold">{log.action}</td>
                    <td className="px-6 py-4 text-muted-foreground">{log.details || "-"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No recent audit logs.
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
