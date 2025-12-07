'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, LogOut, TrendingUp, Calendar, Receipt, BarChart3 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type StatsGeral = {
  totalComandas: number
  totalVendido: number
  comandasHoje: number
  primeiraComanda: string | null
}

export default function PerfilGarcom() {
  const { usuario, logout } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<StatsGeral>({
    totalComandas: 0,
    totalVendido: 0,
    comandasHoje: 0,
    primeiraComanda: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!usuario) {
      router.push('/login')
      return
    }

    if (usuario.tipo !== 'garcom') {
      router.push('/')
      return
    }

    loadStats()
  }, [usuario, router])

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/garcom/perfil?garcomId=${usuario?.id}`)
      if (!response.ok) throw new Error('Erro ao carregar estatísticas')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const diasTrabalhados = stats.primeiraComanda 
    ? Math.floor((new Date().getTime() - new Date(stats.primeiraComanda).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark pb-20">
      <header className="glass-dark border-b border-primary/20 p-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold gold-text">Meu Perfil</h1>
            <p className="text-xs text-muted-foreground">Informações e Estatísticas</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Card do Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-poker rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold gold-text">{usuario?.nome}</h2>
              <p className="text-sm text-muted-foreground">@{usuario?.username}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                Garçom
              </span>
            </div>
          </div>
        </motion.div>

        {/* Estatísticas Gerais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-poker rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold gold-text mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Estatísticas Gerais
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Comandas</p>
                  <p className="text-2xl font-bold text-white">{stats.totalComandas}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendido</p>
                  <p className="text-2xl font-bold gold-text">
                    R$ {stats.totalVendido.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comandas Hoje</p>
                  <p className="text-2xl font-bold text-white">{stats.comandasHoje}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dias Trabalhados</p>
                  <p className="text-2xl font-bold text-white">{diasTrabalhados}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Botão de Logout */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="w-full glass-poker rounded-xl p-4 flex items-center justify-center gap-3 text-red-400 hover:bg-red-500/10 transition-all border border-red-500/30"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair da Conta</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground"
        >
          Absolut Poker © 2024
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-dark border-t border-primary/20 p-3 z-40">
        <div className="flex justify-around max-w-md mx-auto">
          <Link href="/garcom" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Receipt className="w-6 h-6" />
            <span className="text-xs font-medium">Comandas</span>
          </Link>
          <Link href="/garcom/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          <Link href="/garcom/perfil" className="flex flex-col items-center gap-1 text-primary">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
