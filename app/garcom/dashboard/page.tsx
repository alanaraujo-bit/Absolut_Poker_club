'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Clock, Check, Package, ArrowLeft, Receipt, BarChart3, User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Stats = {
  comandasAbertas: number
  comandasFechadas: number
  totalVendido: number
  totalItens: number
}

type TopProduto = {
  nome: string
  quantidade: number
}

export default function DashboardGarcomPage() {
  const router = useRouter()
  const { usuario } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!usuario?.id) return

    carregarStats()
    
    // Atualização automática a cada 3 segundos (mais rápido para garçom)
    const interval = setInterval(() => {
      carregarStats()
    }, 3000)

    return () => clearInterval(interval)
  }, [usuario])

  const carregarStats = async () => {
    try {
      if (!usuario?.id) {
        console.log('Usuário não carregado ainda')
        return
      }

      console.log('Carregando stats do dashboard para garçom:', usuario.id)
      const res = await fetch(`/api/garcom/stats?garcomId=${usuario.id}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      const data = await res.json()
      console.log('Stats do dashboard carregadas:', data)
      setStats(data.stats)
      setTopProdutos(data.topProdutos)
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark pb-20">
      <header className="glass-dark border-b border-primary/20 p-4 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/garcom')}
            className="p-2 rounded-lg hover:bg-primary/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold gold-text">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Vendas de hoje</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-poker rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <p className="text-sm text-muted-foreground">Abertas</p>
            </div>
            <p className="text-3xl font-bold gold-text">{stats.comandasAbertas}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-poker rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-400" />
              <p className="text-sm text-muted-foreground">Fechadas</p>
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.comandasFechadas}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-poker rounded-xl p-4 col-span-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">Total Vendido Hoje</p>
            </div>
            <p className="text-4xl font-bold gold-text">
              R$ {stats.totalVendido.toFixed(2)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-poker rounded-xl p-4 col-span-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-400" />
              <p className="text-sm text-muted-foreground">Total de Itens</p>
            </div>
            <p className="text-3xl font-bold text-blue-400">{stats.totalItens}</p>
          </motion.div>
        </div>

        {/* Top Produtos */}
        {topProdutos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-poker rounded-xl p-4"
          >
            <h2 className="font-bold gold-text mb-4">🏆 Mais Vendidos Hoje</h2>
            <div className="space-y-3">
              {topProdutos.map((produto, index) => (
                <div
                  key={produto.nome}
                  className="flex items-center justify-between p-3 bg-primary/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <p className="font-medium">{produto.nome}</p>
                  </div>
                  <p className="font-bold gold-text">{produto.quantidade}x</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Dicas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
        >
          <p className="text-sm text-blue-200">
            💡 <strong>Dica:</strong> Feche as comandas regularmente para manter suas estatísticas atualizadas!
          </p>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-dark border-t border-primary/20 p-3 z-40">
        <div className="flex justify-around max-w-md mx-auto">
          <Link href="/garcom" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Receipt className="w-6 h-6" />
            <span className="text-xs font-medium">Comandas</span>
          </Link>
          <Link href="/garcom/dashboard" className="flex flex-col items-center gap-1 text-primary">
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          <Link href="/garcom/perfil" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
