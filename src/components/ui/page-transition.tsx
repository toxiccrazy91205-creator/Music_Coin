"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
  className?: string
  duration?: number
}

export function PageTransition({ children, className, duration = 0.3 }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
