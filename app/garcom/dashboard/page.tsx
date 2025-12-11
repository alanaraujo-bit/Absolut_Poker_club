'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Clock, Check, Package, Receipt, BarChart3, User, Calendar, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Periodo = 'hoje' | 'ontem' | 'semana' | 'mes'

type Stats = {
  totalComandas: number
  comandasAbertas: number
  comandasFechadas: number
  totalVendido: number
  totalItensVendidos: number
  ticketMedio: number
}

type DashboardData = {
  periodo: string
  stats: Stats
  topProdutos: { nome: string; quantidade: number; valor: number }[]
  vendasPorDia: { data: string; valor: number }[]
  formasPagamento: { forma: string; count: number; valor: number }[]
  comandas: any[]
}

const periodos: { value: Periodo; label: string; emoji: string }[] = [
  { value: 'hoje', label: 'Hoje', emoji: '📅' },
  { value: 'ontem', label: 'Ontem', emoji: '📆' },
  { value: 'semana', label: 'Última Semana', emoji: '📊' },
  { value: 'mes', label: 'Último Mês', emoji: '📈' },
]

export default function DashboardGarcomPage() {
  const router = useRouter()
  const { usuario } = useAuth()
  const [periodo, setPeriodo] = useState<Periodo>('hoje')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mostrarFiltro, setMostrarFiltro] = useState(false)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!usuario?.id) return

    const carregarDashboard = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/garcom/dashboard?garcomId=${usuario.id}&periodo=${periodo}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        })
        
        if (!res.ok) {
          console.error('Erro na resposta:', res.status)
          return
        }
        
        const resultado = await res.json()
        setData(resultado)
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    // Usar timeout para evitar duplo carregamento
    const timer = setTimeout(() => {
      carregarDashboard()
    }, 100)

    return () => clearTimeout(timer)
  }, [usuario?.id, periodo])

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const stats = data.stats
  const periodoAtual = periodos.find(p => p.value === periodo)!

  return (
    <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark pb-20">
      <header className="glass-dark border-b border-primary/20 p-4 sticky top-0 z-30">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold gold-text">Dashboard</h1>
              <p className="text-xs text-muted-foreground">{usuario?.nome}</p>
            </div>
          </div>

          {/* Filtro de Período */}
          <div className="relative">
            <button
              onClick={() => setMostrarFiltro(!mostrarFiltro)}
              className="w-full poker-card p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  {periodoAtual.emoji} {periodoAtual.label}
                </span>
              </div>
              <motion.div
                animate={{ rotate: mostrarFiltro ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-primary" />
              </motion.div>
            </button>

            <AnimatePresence>
              {mostrarFiltro && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 poker-card p-2 space-y-1 z-50"
                >
                  {periodos.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        setPeriodo(p.value)
                        setMostrarFiltro(false)
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        periodo === p.value
                          ? 'bg-primary/20 font-bold'
                          : 'hover:bg-primary/10'
                      }`}
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
              <Receipt className="w-5 h-5 text-blue-400" />
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <p className="text-2xl font-bold">{stats.totalComandas}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-poker rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-400" />
              <p className="text-xs text-muted-foreground">Fechadas</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.comandasFechadas}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-poker rounded-xl p-4 col-span-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">Total Vendido</p>
            </div>
            <p className="text-4xl font-bold gold-text">
              R$ {formatarValor(stats.totalVendido)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-poker rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-400" />
              <p className="text-xs text-muted-foreground">Itens</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.totalItensVendidos}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-poker rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              R$ {formatarValor(stats.ticketMedio)}
            </p>
          </motion.div>
        </div>

        {/* Top Produtos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-poker rounded-xl p-4"
        >
          <h3 className="font-bold gold-text mb-4">🏆 Produtos Mais Vendidos</h3>
          <div className="space-y-3">
            {data.topProdutos.slice(0, 5).map((produto, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-primary/5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary/30">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{produto.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {produto.quantidade} vendidos
                    </p>
                  </div>
                </div>
                <p className="font-bold gold-text">R$ {formatarValor(produto.valor)}</p>
              </div>
            ))}
            {data.topProdutos.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma venda no período
              </p>
            )}
          </div>
        </motion.div>

        {/* Formas de Pagamento */}
        {data.formasPagamento.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-poker rounded-xl p-4"
          >
            <h3 className="font-bold gold-text mb-4">💳 Formas de Pagamento</h3>
            <div className="space-y-2">
              {data.formasPagamento.map((forma, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                  <div>
                    <p className="font-medium capitalize">{forma.forma}</p>
                    <p className="text-xs text-muted-foreground">{forma.count} transações</p>
                  </div>
                  <p className="font-bold gold-text">R$ {formatarValor(forma.valor)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lista de Comandas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-poker rounded-xl p-4"
        >
          <h3 className="font-bold gold-text mb-4">📋 Histórico de Comandas</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.comandas.map((comanda) => (
              <div
                key={comanda.id}
                className={`p-3 rounded-lg border ${
                  comanda.status === 'fechada'
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-amber-500/5 border-amber-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-semibold">{comanda.cliente}</p>
                    <p className="text-xs text-muted-foreground">
                      Comanda #{comanda.id} • {comanda.itens} itens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold gold-text">R$ {formatarValor(comanda.valorTotal)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        comanda.status === 'fechada'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {comanda.status === 'fechada' ? '✓ Fechada' : '⏳ Aberta'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(comanda.dataAbertura).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {comanda.formaPagamento && ` • ${comanda.formaPagamento}`}
                </p>
              </div>
            ))}
            {data.comandas.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma comanda no período selecionado
              </p>
            )}
          </div>
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
