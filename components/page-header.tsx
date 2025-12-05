"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3,
  Users,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Estoque', href: '/estoque', icon: Package },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
]

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

export default function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  const pathname = usePathname()

  return (
    <div className="mb-8">
      {/* Breadcrumb Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-absolut-gold transition-colors">
            Início
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{title}</span>
        </div>

        {/* Quick Navigation Buttons */}
        <div className="flex flex-wrap gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const NavIcon = item.icon
            
            return (
              <Link key={item.name} href={item.href}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    border transition-all text-sm font-medium
                    ${isActive 
                      ? 'bg-absolut-gold/20 border-absolut-gold text-absolut-gold neon-glow' 
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:text-foreground'
                    }
                  `}
                >
                  <NavIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </motion.button>
              </Link>
            )
          })}
        </div>
      </motion.div>

      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4"
      >
        {Icon && (
          <div className="w-12 h-12 rounded-lg glass-effect border border-absolut-gold/30 flex items-center justify-center">
            <Icon className="h-6 w-6 text-absolut-gold" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold gold-text">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
