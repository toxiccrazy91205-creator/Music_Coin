"use client"

import { motion } from "framer-motion"
import type { ReactNode, ElementType } from "react"

interface ScaleOnHoverProps {
  children: ReactNode
  className?: string
  scale?: number
  as?: ElementType
}

export function ScaleOnHover({ children, className, scale = 1.02, as: Component = "div" }: ScaleOnHoverProps) {
  const MotionComponent = motion.create(Component as any)

  return (
    <MotionComponent
      whileHover={{ scale, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </MotionComponent>
  )
}
