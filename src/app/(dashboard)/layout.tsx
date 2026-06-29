"use client"

import { Sidebar } from "./components/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { PageTransition } from "@/components/ui/page-transition"
import { useAuth } from "@/hooks/useAuth"
import { useEffect } from "react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <PageTransition key={pathname}>
              {children}
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
