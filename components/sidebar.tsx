"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3,
  Users,
  Menu, 
  X 
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Novo Pedido', href: '/pedidos', icon: ShoppingCart },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Estoque', href: '/estoque', icon: Package },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass-effect neon-border"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -320 }}
        className={`
          fixed top-0 left-0 h-screen w-80 
          glass-effect border-r border-white/10
          p-6 z-40 lg:translate-x-0 transition-transform
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-absolut-gold flex items-center justify-center">
                <span className="text-2xl">♠️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold gold-text">
                  Absolut Poker
                </h1>
                <p className="text-xs text-absolut-gold/80 font-semibold">
                  ACATH
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground border-t border-white/10 pt-2">
              Canaã dos Carajás - PA
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all cursor-pointer
                      ${isActive 
                        ? 'gradient-primary text-white neon-glow' 
                        : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Footer Info */}
          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-absolut-gold flex items-center justify-center">
                <span className="text-absolut-gold font-bold text-lg">👑</span>
              </div>
              <div>
                <p className="text-sm font-medium gold-text">Absolut Club</p>
                <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
