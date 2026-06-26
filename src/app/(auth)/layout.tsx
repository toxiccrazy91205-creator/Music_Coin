"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Music Coin Festival
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
