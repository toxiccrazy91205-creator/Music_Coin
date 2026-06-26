"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Dashboard Error</h1>
        <p className="text-muted-foreground">Something went wrong loading this page.</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = "/login"}>Go Home</Button>
      </div>
    </div>
  )
}
