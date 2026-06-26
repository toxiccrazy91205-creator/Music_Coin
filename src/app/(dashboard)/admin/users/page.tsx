"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldBan, ShieldCheck, UserCog } from "lucide-react"

type User = {
  id: string
  name: string
  email: string
  role: string
  isApproved: boolean
  createdAt: string
}

const ROLES = ["FAN", "ARTIST", "ORGANIZER", "PRODUCTION_HOUSE", "ADMIN"]

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users")
        if (!response.ok) throw new Error("Failed to fetch users")
        const json = await response.json()
        if (json.success) setUsers(json.data)
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (user?.role === "ADMIN") fetchUsers()
  }, [user])

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      })
      if (!response.ok) throw new Error("Failed to update user")
      const json = await response.json()
      if (json.success) setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...json.data } : u)))
    } catch (err: unknown) {
      alert("Error updating user")
    }
  }

  if (!user || user.role !== "ADMIN") return null
  if (loading) return <div className="text-muted-foreground animate-pulse">Loading users...</div>
  if (error) return <div className="text-destructive">Error: {error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="bg-card hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium">{u.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <Select
                        defaultValue={u.role}
                        onValueChange={(val) => updateUser(u.id, { role: val as string })}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      {u.isApproved ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <ShieldCheck className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <ShieldBan className="h-3.5 w-3.5" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant={u.isApproved ? "destructive" : "default"}
                        size="sm"
                        onClick={() => updateUser(u.id, { isApproved: !u.isApproved })}
                      >
                        {u.isApproved ? "Suspend" : "Unsuspend"}
                      </Button>
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
