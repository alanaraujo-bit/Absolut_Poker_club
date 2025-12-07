"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, ShoppingBag, Package, AlertTriangle, LayoutDashboard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'

interface DashboardStats {
  totalVendidoHoje: number
  totalPedidosHoje: number
  produtoMaisVendido: string
  estoquesBaixos: number
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVendidoHoje: 0,
    totalPedidosHoje: 0,
    produtoMaisVendido: '-',
    estoquesBaixos: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    
    // Atualização automática a cada 5 segundos
    const interval = setInterval(() => {
      fetchStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/dashboard/stats', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('📊 Dashboard atualizado:', data)
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: 'Total Vendido Hoje',
      value: formatCurrency(stats.totalVendidoHoje),
      icon: TrendingUp,
      gradient: 'from-absolut-gold to-absolut-lightgold',
      description: 'Faturamento do dia',
    },
    {
      title: 'Pedidos Hoje',
      value: stats.totalPedidosHoje.toString(),
      icon: ShoppingBag,
      gradient: 'from-absolut-darkgold to-absolut-gold',
      description: 'Total de pedidos',
    },
    {
      title: 'Produto Mais Vendido',
      value: stats.produtoMaisVendido,
      icon: Package,
      gradient: 'from-absolut-silver to-absolut-gold',
      description: 'Líder de vendas',
    },
    {
      title: 'Estoque Baixo',
      value: stats.estoquesBaixos.toString(),
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-red-600',
      description: 'Produtos em alerta',
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content - Padding apenas para bottom nav mobile */}
      <main className="flex-1 lg:ml-72 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <PageHeader 
              title="Dashboard ACATH"
              description="Associação Canaense Absolut de Texas Hold'em"
              icon={LayoutDashboard}
            />
            <div className="flex items-center gap-2 text-xs text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="hidden md:inline">Atualização em tempo real</span>
            </div>
          </div>

          {/* Stats Cards - Mobile optimized */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {cards.map((card, index) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 2) }}
                >
                  <Card className="relative overflow-hidden poker-card h-full">
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10`} />
                    <CardHeader className="pb-2 px-3 pt-3 md:pb-3 md:px-6 md:pt-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground line-clamp-2">
                          {card.title}
                        </CardTitle>
                        <div className={`p-1.5 md:p-2 rounded-lg bg-gradient-to-br ${card.gradient} bg-opacity-20 shrink-0`}>
                          <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                      {loading ? (
                        <div className="h-6 md:h-8 bg-white/5 rounded animate-pulse" />
                      ) : (
                        <>
                          <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-1 truncate">
                            {card.value}
                          </div>
                          <p className="text-[9px] md:text-xs text-muted-foreground line-clamp-1">
                            {card.description}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Alert Card */}
          {stats.estoquesBaixos > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-orange-500/50 bg-orange-500/10">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-orange-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm md:text-base">Atenção: Estoque Baixo</CardTitle>
                      <CardDescription className="text-xs md:text-sm">
                        {stats.estoquesBaixos} produto(s) com estoque abaixo do mínimo
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                  <Link href="/estoque">
                    <Button variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white w-full md:w-auto">
                      Verificar Estoque
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

    </div>
  )
}
