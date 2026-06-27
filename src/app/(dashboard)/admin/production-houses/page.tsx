"use client"

import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, CheckCircle2, XCircle } from "lucide-react"

export default function ProductionHousesAdminPage() {
  const { user } = useAuth()

  if (!user || user.role !== "ADMIN") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production House Management</h1>
          <p className="text-muted-foreground mt-1">Verify and onboard production houses to the platform.</p>
        </div>
        <Button>
          <Building2 className="mr-2 h-4 w-4" />
          Add Production House
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">3</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Review and verify production house applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Company Name</th>
                  <th className="px-6 py-4 font-medium">Representative</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { id: 1, name: "Neon Sound Studios", rep: "Alice Walker", status: "Pending" },
                  { id: 2, name: "Bassline Productions", rep: "Mark Chen", status: "Verified" },
                ].map((ph) => (
                  <tr key={ph.id} className="bg-card hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium">{ph.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{ph.rep}</td>
                    <td className="px-6 py-4">
                      {ph.status === "Verified" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ph.status === "Pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900/30 dark:hover:bg-green-900/20">Approve</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20">Reject</Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm">Manage Rights</Button>
                      )}
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
