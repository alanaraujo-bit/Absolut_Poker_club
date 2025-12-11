"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  LayoutDashboard, 
  LogOut,
  DollarSign,
  Clock,
  CheckCircle,
  Calendar,
  BarChart3,
  Filter,
  Eye,
  ShoppingCart
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'
import { useAuth } from '@/lib/auth-context'

interface DashboardStats {
  periodo: string
  totalFechadas: number
  qtdFechadas: number
  totalAbertas: number
  qtdAbertas: number
  ticketMedio: number
  comandasAbertasAgora: number
  totalPeriodoAnterior: number
  variacao: number
  totalMesAtual: number
  qtdMesAtual: number
  vendasPorHora: Array<{
    hora: string
    valor: number
    comandas: number
  }>
  topProdutos: Array<{
    nome: string
    quantidade: number
    valor: number
    categoria: string
    unidadeMedida: string
    precoVenda: number
  }>
  categorias: Array<{
    nome: string
    valor: number
  }>
  ultimasComandasFechadas: Array<{
    id: number
    numero: string
    cliente: string
    valorTotal: number
    dataFechamento: Date
    itens: number
  }>
  estoquesBaixos: number
}

const CORES_GRAFICO = ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#DC143C', '#C71585', '#8B008B', '#4B0082', '#191970']

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'hoje' | 'ontem' | 'semana' | 'mes'>('hoje')
  const { logout } = useAuth()

  useEffect(() => {
    fetchStats()
    
    // Atualização automática a cada 10 segundos
    const interval = setInterval(() => {
      fetchStats()
    }, 10000)

    return () => clearInterval(interval)
  }, [periodo])

  async function fetchStats() {
    try {
      const res = await fetch(`/api/dashboard/stats?periodo=${periodo}`, {
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

  const periodoLabel = {
    hoje: 'Hoje',
    ontem: 'Ontem',
    semana: 'Esta Semana',
    mes: 'Este Mês'
  }

  const periodoAnteriorLabel = {
    hoje: 'ontem',
    ontem: 'anteontem',
    semana: 'semana passada',
    mes: 'mês passado'
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 lg:ml-72 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header com Filtros */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <PageHeader 
              title="Dashboard ACATH"
              description="Associação Canaense Absolut de Texas Hold'em"
              icon={LayoutDashboard}
            />
            <div className="flex items-center gap-3 flex-wrap">
              <div className="hidden md:flex items-center gap-2 text-xs text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Atualização em tempo real</span>
              </div>
              
              {/* Filtro de Período */}
              <div className="flex items-center gap-2 bg-card/50 rounded-lg p-1 border border-border">
                <Filter className="h-4 w-4 text-muted-foreground ml-2" />
                {(['hoje', 'ontem', 'semana', 'mes'] as const).map((p) => (
                  <Button
                    key={p}
                    onClick={() => setPeriodo(p)}
                    variant={periodo === p ? 'default' : 'ghost'}
                    size="sm"
                    className={`text-xs ${
                      periodo === p 
                        ? 'bg-absolut-gold text-black hover:bg-absolut-gold/90' 
                        : 'hover:bg-white/10'
                    }`}
                  >
                    {periodoLabel[p]}
                  </Button>
                ))}
              </div>

              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="lg:hidden flex items-center gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="poker-card">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-white/5 rounded animate-pulse mb-2" />
                    <div className="h-8 bg-white/5 rounded animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-white/5 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Cards Principais - KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Fechadas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="poker-card border-green-500/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Comandas Fechadas ({periodoLabel[periodo]})
                        </CardTitle>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        {formatCurrency(stats.totalFechadas)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {stats.qtdFechadas} comanda(s) • Fechadas em {periodoLabel[periodo].toLowerCase()}
                      </p>
                      {stats.variacao !== 0 && (
                        <div className={`flex items-center gap-1 text-xs ${stats.variacao > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <TrendingUp className={`h-3 w-3 ${stats.variacao < 0 ? 'rotate-180' : ''}`} />
                          <span>
                            {stats.variacao > 0 ? '+' : ''}{stats.variacao.toFixed(1)}% vs {periodoAnteriorLabel[periodo]}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Comandas Abertas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="poker-card border-yellow-500/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Comandas Abertas ({periodoLabel[periodo]})
                        </CardTitle>
                        <Clock className="h-5 w-5 text-yellow-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-400 mb-1">
                        {formatCurrency(stats.totalAbertas)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.qtdAbertas} comanda(s) • Iniciadas em {periodoLabel[periodo].toLowerCase()}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Ticket Médio */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="poker-card border-blue-500/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Ticket Médio
                        </CardTitle>
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-400 mb-1">
                        {formatCurrency(stats.ticketMedio)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Valor médio por comanda
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Comandas Abertas Total */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="poker-card border-absolut-gold/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-absolut-gold/10 to-transparent" />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Faturamento do Mês
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-absolut-gold" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-absolut-gold mb-1">
                        {formatCurrency(stats.totalMesAtual)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.qtdMesAtual} comandas este mês
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Gráficos Principais */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Vendas por Hora/Dia */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="poker-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-absolut-gold" />
                        Vendas por {periodo === 'hoje' || periodo === 'ontem' ? 'Hora' : 'Dia'}
                      </CardTitle>
                      <CardDescription>
                        Distribuição de vendas no período
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={stats.vendasPorHora}>
                          <defs>
                            <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis 
                            dataKey="hora" 
                            stroke="#888"
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis 
                            stroke="#888"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1a1a1a', 
                              border: '1px solid #FFD700',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="valor" 
                            stroke="#FFD700" 
                            fillOpacity={1} 
                            fill="url(#colorVendas)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Gráfico de Pizza - Vendas por Categoria */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="poker-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-5 w-5 text-absolut-gold" />
                        Vendas por Categoria
                      </CardTitle>
                      <CardDescription>
                        Distribuição de faturamento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={stats.categorias}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ nome, percent }) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="valor"
                          >
                            {stats.categorias.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1a1a1a', 
                              border: '1px solid #FFD700',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Top 10 Produtos e Últimas Comandas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 10 Produtos */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="poker-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-5 w-5 text-absolut-gold" />
                        Top 10 Produtos Mais Vendidos
                      </CardTitle>
                      <CardDescription>
                        Ranking de produtos por faturamento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {stats.topProdutos.map((produto, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div 
                                className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0"
                                style={{ 
                                  backgroundColor: `${CORES_GRAFICO[index]}20`,
                                  color: CORES_GRAFICO[index]
                                }}
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{produto.nome}</div>
                                <div className="text-xs text-muted-foreground">
                                  {produto.quantidade.toFixed(2)} {produto.unidadeMedida === 'kg' ? 'kg' : 'un'} • R$ {produto.precoVenda.toFixed(2)}/{produto.unidadeMedida === 'kg' ? 'kg' : 'un'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <div className="font-bold" style={{ color: CORES_GRAFICO[index] }}>
                                {formatCurrency(produto.valor)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Últimas Comandas Fechadas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card className="poker-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-green-500" />
                        Últimas Comandas Fechadas
                      </CardTitle>
                      <CardDescription>
                        Comandas recentemente finalizadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stats.ultimasComandasFechadas.length > 0 ? (
                          stats.ultimasComandasFechadas.map((comanda) => (
                            <Link 
                              key={comanda.id}
                              href={`/relatorios/comandas`}
                              className="block"
                            >
                              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-absolut-gold">
                                      #{comanda.numero}
                                    </span>
                                    <span className="text-sm">•</span>
                                    <span className="text-sm text-muted-foreground">
                                      {comanda.cliente}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {comanda.itens} item(ns) • {new Date(comanda.dataFechamento).toLocaleString('pt-BR')}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-400">
                                    {formatCurrency(comanda.valorTotal)}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            Nenhuma comanda fechada no período
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Alerta de Estoque */}
              {stats.estoquesBaixos > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Card className="border-orange-500/50 bg-orange-500/10">
                    <CardHeader className="p-4 md:p-6">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">Atenção: Estoque Baixo</CardTitle>
                          <CardDescription>
                            {stats.estoquesBaixos} produto(s) com estoque abaixo do mínimo
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                      <Link href="/estoque">
                        <Button variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white w-full md:w-auto">
                          <Eye className="h-4 w-4 mr-2" />
                          Verificar Estoque
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}
