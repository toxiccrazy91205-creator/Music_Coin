"use client"

import { Sidebar } from "./components/sidebar"
import { usePathname } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { PageTransition } from "@/components/ui/page-transition"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
