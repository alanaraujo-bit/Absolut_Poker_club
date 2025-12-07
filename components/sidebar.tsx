"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Package, 
  BarChart3,
  Users,
  Menu, 
  X,
  LogOut,
  UserCog
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, label: 'Home' },
  { name: 'Clientes', href: '/clientes', icon: Users, label: 'Clientes' },
  { name: 'Estoque', href: '/estoque', icon: Package, label: 'Estoque' },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3, label: 'Dados' },
]

const navigationAdmin = [
  { name: 'Usuários', href: '/usuarios', icon: UserCog, label: 'Usuários' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { usuario, logout, isAdmin } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-72 glass-poker border-r border-primary/20 p-6 z-40 flex-col">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="mb-8 space-y-3 group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full neon-border-gold flex items-center justify-center transition-all group-hover:neon-glow-gold">
                <span className="text-2xl">♠️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold gold-text">
                  Absolut Poker
                </h1>
                <p className="text-xs text-primary/80 font-semibold">
                  ACATH
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground border-t border-primary/20 pt-2">
              Canaã dos Carajás - PA
            </p>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex items-center gap-3 px-4 py-3.5 rounded-lg
                      transition-all cursor-pointer touch-feedback
                      ${isActive 
                        ? 'gradient-poker-gold text-black shadow-lg font-semibold' 
                        : 'hover:bg-primary/10 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </motion.div>
                </Link>
              )
            })}

            {/* Apenas para Admin */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider px-4">Administração</p>
                </div>
                {navigationAdmin.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <motion.div
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          flex items-center gap-3 px-4 py-3.5 rounded-lg
                          transition-all cursor-pointer touch-feedback
                          ${isActive 
                            ? 'gradient-poker-gold text-black shadow-lg font-semibold' 
                            : 'hover:bg-primary/10 text-muted-foreground hover:text-foreground'
                          }
                        `}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="font-medium">{item.name}</span>
                      </motion.div>
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          {/* Footer Info */}
          <div className="pt-6 border-t border-primary/20 space-y-3">
            <div className="flex items-center gap-3 poker-card p-3">
              <div className="w-10 h-10 rounded-full neon-border-gold flex items-center justify-center">
                <span className="text-primary text-lg">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold gold-text truncate">{usuario?.nome}</p>
                <p className="text-xs text-muted-foreground capitalize">{usuario?.tipo}</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sair</span>
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - APENAS ESTE NO MOBILE */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-dark border-t border-primary/20 z-40 safe-area-inset-bottom">
        <div className="grid grid-cols-5 gap-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className={`
                    flex flex-col items-center justify-center gap-1 py-3 px-2
                    transition-all touch-feedback min-h-[68px]
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground active:text-foreground'
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-primary/20' 
                      : 'bg-transparent'
                    }
                  `}>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                  </div>
                  <span className={`text-[10px] font-semibold leading-tight text-center ${isActive ? 'gold-text' : ''}`}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
