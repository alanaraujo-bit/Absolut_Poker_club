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
  dataPedido: string
  valorTotal: number
}

export default function RelatoriosPage() {
  const [vendas, setVendas] = useState<RelatorioVendas>({ hoje: 0, semana: 0, mes: 0 })
  const [topProdutos, setTopProdutos] = useState<ProdutoMaisVendido[]>([])
  const [pedidosRecentes, setPedidosRecentes] = useState<PedidoRecente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRelatorios()
  }, [])

  async function fetchRelatorios() {
    try {
      const [vendasRes, topRes, pedidosRes] = await Promise.all([
        fetch('/api/relatorios/vendas'),
        fetch('/api/relatorios/top-produtos'),
        fetch('/api/relatorios/pedidos-recentes'),
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
        createdAt: p.dataPedido
      })),
      totalGeral: vendas.mes,
      totalPedidos: pedidosRecentes.length
    }
    
    generateRelatorioPDF(pdfData)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 lg:ml-80 p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader 
            title="Relatórios"
            description="Análise de vendas e performance"
            icon={BarChart3}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold gold-text mb-2">Relatórios</h1>
                <p className="text-muted-foreground">Análise de vendas e desempenho</p>
              </div>
              <Button 
                onClick={handleExportPDF}
                size="lg"
                className="gap-2"
              >
                <FileDown className="h-5 w-5" />
                Exportar PDF
              </Button>
            </div>
          </motion.div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Vendas Hoje
                    </CardTitle>
                    <Calendar className="h-5 w-5 text-pink-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-8 bg-white/5 rounded animate-pulse" />
                  ) : (
                    <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
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
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Vendas na Semana
                    </CardTitle>
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-8 bg-white/5 rounded animate-pulse" />
                  ) : (
                    <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
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
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Vendas no Mês
                    </CardTitle>
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-8 bg-white/5 rounded animate-pulse" />
                  ) : (
                    <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                      {formatCurrency(vendas.mes)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de Vendas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Vendas</CardTitle>
                  <CardDescription>Faturamento por período</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={vendasData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="valor" fill="url(#gradient)" radius={[8, 8, 0, 0]} />
                      <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E1306C" />
                          <stop offset="100%" stopColor="#8134AF" />
                        </linearGradient>
                      </defs>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produtos Mais Vendidos
                  </CardTitle>
                  <CardDescription>Top 5 produtos do mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProdutos.slice(0, 5).map((produto, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                            style={{
                              background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                            }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{produto.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              {produto.quantidade} vendidos
                            </div>
                          </div>
                        </div>
                        <div className="font-bold">{formatCurrency(produto.total)}</div>
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
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
                <CardDescription>Últimos 10 pedidos realizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pedidosRecentes.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex items-center justify-between p-4 rounded-lg glass-effect neon-border"
                    >
                      <div>
                        <div className="font-medium">Pedido #{pedido.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(new Date(pedido.dataPedido))}
                        </div>
                      </div>
                      <div className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
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
