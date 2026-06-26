"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface SlideUpProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  distance?: number
}

export function SlideUp({ children, className, delay = 0, duration = 0.4, distance = 40 }: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
