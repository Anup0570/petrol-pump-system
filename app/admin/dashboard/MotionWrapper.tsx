'use client'

import { motion } from 'framer-motion'
import { pageFadeIn, containerVariants, itemVariants } from '@/lib/motion'

export function PageWrapper({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div 
      variants={pageFadeIn} 
      initial="hidden" 
      animate="show" 
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div variants={containerVariants} className={className}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}
