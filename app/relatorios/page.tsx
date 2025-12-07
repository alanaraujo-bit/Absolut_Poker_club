"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Package, Calendar, FileDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { generateRelatorioPDF } from '@/lib/pdf-generator'

interface RelatorioVendas {
  hoje: number
  semana: number
  mes: number
}

interface ProdutoMaisVendido {
  nome: string
  quantidade: number
  total: number
}

interface PedidoRecente {
  id: number
  dataFechamento: string
  valorTotal: number
  cliente: {
    nome: string
  }
}

export default function RelatoriosPage() {
  const [vendas, setVendas] = useState<RelatorioVendas>({ hoje: 0, semana: 0, mes: 0 })
  const [topProdutos, setTopProdutos] = useState<ProdutoMaisVendido[]>([])
  const [pedidosRecentes, setPedidosRecentes] = useState<PedidoRecente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRelatorios()
    
    // Atualização automática a cada 5 segundos
    const interval = setInterval(() => {
      fetchRelatorios()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  async function fetchRelatorios() {
    try {
      const [vendasRes, topRes, pedidosRes] = await Promise.all([
        fetch('/api/relatorios/vendas', { cache: 'no-store' }),
        fetch('/api/relatorios/top-produtos', { cache: 'no-store' }),
        fetch('/api/relatorios/pedidos-recentes', { cache: 'no-store' }),
      ])

      if (vendasRes.ok) {
        const data = await vendasRes.json()
        setVendas(data)
      }

      if (topRes.ok) {
        const data = await topRes.json()
        setTopProdutos(data)
      }

      if (pedidosRes.ok) {
        const data = await pedidosRes.json()
        setPedidosRecentes(data)
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const vendasData = [
    { name: 'Hoje', valor: vendas.hoje },
    { name: 'Semana', valor: vendas.semana },
    { name: 'Mês', valor: vendas.mes },
  ]

  const COLORS = ['#D4AF37', '#FFD700', '#B8960C', '#C0C0C0', '#D4AF37']

  function handleExportPDF() {
    // Preparar dados para o PDF
    const pdfData = {
      periodo: `${formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))} - ${formatDate(new Date())}`,
      vendas: [
        { data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), total: vendas.hoje, pedidos: 5 },
        { data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), total: vendas.semana / 7, pedidos: 8 },
        { data: new Date().toISOString(), total: vendas.hoje, pedidos: pedidosRecentes.length },
      ],
      topProdutos: topProdutos.map(p => ({
        nome: p.nome,
        totalVendido: p.total,
        quantidade: p.quantidade
      })),
      pedidosRecentes: pedidosRecentes.map(p => ({
        id: p.id,
        total: p.valorTotal,
        createdAt: p.dataFechamento,
        cliente: p.cliente.nome
      })),
      totalGeral: vendas.mes,
      totalPedidos: pedidosRecentes.length
    }
    
    generateRelatorioPDF(pdfData)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 lg:ml-72 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <PageHeader 
                title="Relatórios"
                description="Análise de vendas e performance"
                icon={BarChart3}
              />
              <div className="flex items-center gap-2 text-xs text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="hidden lg:inline">Tempo real</span>
              </div>
            </div>
            <Button 
              onClick={handleExportPDF}
              size="sm"
              className="gap-2 btn-poker-primary"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>

          {/* Cards de Resumo - Mobile optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="poker-card">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                      Vendas Hoje
                    </CardTitle>
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {loading ? (
                    <div className="h-7 md:h-8 bg-primary/5 rounded animate-pulse" />
                  ) : (
                    <div className="text-2xl md:text-3xl font-bold gold-text">
                      {formatCurrency(vendas.hoje)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="poker-card">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                      Vendas na Semana
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {loading ? (
                    <div className="h-7 md:h-8 bg-primary/5 rounded animate-pulse" />
                  ) : (
                    <div className="text-2xl md:text-3xl font-bold gold-text">
                      {formatCurrency(vendas.semana)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="sm:col-span-2 lg:col-span-1"
            >
              <Card className="poker-card">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                      Vendas no Mês
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {loading ? (
                    <div className="h-7 md:h-8 bg-primary/5 rounded animate-pulse" />
                  ) : (
                    <div className="text-2xl md:text-3xl font-bold gold-text">
                      {formatCurrency(vendas.mes)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Gráfico de Vendas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="poker-card">
                <CardHeader className="px-4 pt-4 pb-3">
                  <CardTitle className="text-base md:text-lg">Evolução de Vendas</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Faturamento por período</CardDescription>
                </CardHeader>
                <CardContent className="px-2 md:px-4 pb-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={vendasData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #D4AF37',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="valor" fill="#D4AF37" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Produtos */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="poker-card">
                <CardHeader className="px-4 pt-4 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Package className="h-4 w-4 md:h-5 md:w-5" />
                    Top Produtos
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">Mais vendidos do mês</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
                    {topProdutos.slice(0, 5).map((produto, index) => (
                      <div key={index} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <div
                            className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold text-black text-sm md:text-base shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                            }}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm md:text-base truncate">{produto.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {produto.quantidade} vendidos
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-sm md:text-base gold-text shrink-0">{formatCurrency(produto.total)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Pedidos Recentes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
              <Card className="poker-card">
                <CardHeader className="px-4 pt-4 pb-3">
                  <CardTitle className="text-base md:text-lg">Comandas Recentes</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Últimas 10 comandas fechadas</CardDescription>
                </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2 md:space-y-3">
                  {pedidosRecentes.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex items-center justify-between p-3 md:p-4 rounded-lg glass-poker border border-primary/20"
                    >
                      <div>
                        <div className="font-medium text-sm md:text-base">Comanda #{pedido.id}</div>
                        <div className="text-xs text-muted-foreground">{pedido.cliente.nome}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">
                          {pedido.dataFechamento ? formatDate(new Date(pedido.dataFechamento)) : '-'}
                        </div>
                      </div>
                      <div className="text-base md:text-lg font-bold gold-text">
                        {formatCurrency(Number(pedido.valorTotal))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
