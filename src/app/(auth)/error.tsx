"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Authentication Error</h1>
        <p className="text-muted-foreground">Something went wrong during authentication.</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = "/login"}>Back to Login</Button>
      </div>
    </div>
  )
}
