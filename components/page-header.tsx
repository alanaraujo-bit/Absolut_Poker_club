"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  actions?: React.ReactNode
}

export default function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  const pathname = usePathname()

  return (
    <div className="mb-6 md:mb-8">
      {/* Breadcrumb Navigation - Hidden on mobile, visible on tablet+ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 md:mb-6 hidden md:block"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors touch-feedback">
            Início
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{title}</span>
        </div>
      </motion.div>

      {/* Page Title - Mobile optimized */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 md:gap-4 justify-between"
      >
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          {Icon && (
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg glass-poker border border-primary/30 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold gold-text truncate">{title}</h1>
            {description && (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-1">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="shrink-0">
            {actions}
          </div>
        )}
      </motion.div>
    </div>
  )
}
