"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, TrendingUp, Package, Calendar, FileDown, Users, Filter, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { generateRelatorioPDF, generateRelatorioClientePDF } from '@/lib/pdf-generator'

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
    id: number
    nome: string
  }
}

interface Cliente {
  id: number
  nome: string
  saldo: number
  _count?: {
    comandas: number
  }
}

interface RelatorioCliente {
  cliente: {
    id: number
    nome: string
    telefone: string | null
    cpf: string | null
    saldo: number
  }
  periodo: string
  estatisticas: {
    totalComandas: number
    totalGasto: number
    ticketMedio: number
    saldoAtual: number
  }
  produtosMaisComprados: Array<{
    nome: string
    quantidade: number
    total: number
  }>
  historicoComandas: Array<{
    data: string
    total: number
  }>
  comandasDetalhadas: Array<{
    id: number
    dataAbertura: string
    dataFechamento: string | null
    valorTotal: number
    formaPagamento: string | null
    itens: Array<{
      produto: string
      quantidade: number
      precoUnitario: number
      subtotal: number
    }>
  }>
}

export default function RelatoriosPage() {
  const [vendas, setVendas] = useState<RelatorioVendas>({ hoje: 0, semana: 0, mes: 0 })
  const [topProdutos, setTopProdutos] = useState<ProdutoMaisVendido[]>([])
  const [pedidosRecentes, setPedidosRecentes] = useState<PedidoRecente[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes')
  const [clienteSelecionado, setClienteSelecionado] = useState<number | null>(null)
  const [relatorioCliente, setRelatorioCliente] = useState<RelatorioCliente | null>(null)
  const [loadingRelatorioCliente, setLoadingRelatorioCliente] = useState(false)
  const [buscaCliente, setBuscaCliente] = useState('')

  useEffect(() => {
    fetchRelatorios()
    fetchClientes()
    
    // Atualização automática a cada 5 segundos
    const interval = setInterval(() => {
      fetchRelatorios()
      if (!clienteSelecionado) {
        fetchClientes()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [clienteSelecionado])

  async function fetchClientes() {
    try {
      const res = await fetch('/api/clientes')
      if (res.ok) {
        const data = await res.json()
        setClientes(data)
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  async function fetchRelatorioCliente(clienteId: number, periodo: string) {
    setLoadingRelatorioCliente(true)
    try {
      const res = await fetch(`/api/relatorios/cliente/${clienteId}?periodo=${periodo}`)
      if (res.ok) {
        const data = await res.json()
        setRelatorioCliente(data)
      }
    } catch (error) {
      console.error('Erro ao carregar relatório do cliente:', error)
    } finally {
      setLoadingRelatorioCliente(false)
    }
  }

  function handleSelecionarCliente(clienteId: number) {
    setClienteSelecionado(clienteId)
    fetchRelatorioCliente(clienteId, periodoSelecionado)
  }

  function handleFecharRelatorioCliente() {
    setClienteSelecionado(null)
    setRelatorioCliente(null)
    setBuscaCliente('')
  }

  function handleChangePeriodoCliente(periodo: string) {
    setPeriodoSelecionado(periodo)
    if (clienteSelecionado) {
      fetchRelatorioCliente(clienteSelecionado, periodo)
    }
  }

  function handleExportRelatorioCliente() {
    if (relatorioCliente) {
      generateRelatorioClientePDF(relatorioCliente)
    }
  }

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

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
  )

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
          <div className="flex items-center justify-between flex-wrap gap-3">
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
            <div className="flex gap-2">
              <Button 
                onClick={handleExportPDF}
                size="sm"
                variant="outline"
                className="gap-2 btn-poker-outline"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar Geral</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </div>
          </div>

          {/* Seção de Relatórios por Cliente */}
          <Card className="poker-card border-primary/50">
            <CardHeader className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base md:text-lg">Relatório por Jogador</CardTitle>
                </div>
                {clienteSelecionado && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleFecharRelatorioCliente}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardDescription className="text-xs md:text-sm">
                Selecione um jogador para ver o histórico detalhado
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {!clienteSelecionado ? (
                <>
                  <Input
                    placeholder="Buscar jogador..."
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    className="mb-3"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {clientesFiltrados.map((cliente) => (
                      <Button
                        key={cliente.id}
                        variant="outline"
                        className="justify-between h-auto py-3 px-4 btn-poker-outline"
                        onClick={() => handleSelecionarCliente(cliente.id)}
                      >
                        <div className="text-left">
                          <div className="font-medium text-sm">{cliente.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {cliente._count?.comandas || 0} comandas
                          </div>
                        </div>
                        <div className={`text-sm font-bold ${cliente.saldo < 0 ? 'text-orange-500' : 'text-green-500'}`}>
                          {formatCurrency(Math.abs(cliente.saldo))}
                        </div>
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <AnimatePresence>
                  {loadingRelatorioCliente ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                      <p className="text-sm text-muted-foreground mt-2">Carregando relatório...</p>
                    </div>
                  ) : relatorioCliente && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {/* Header do Relatório do Cliente */}
                      <div className="flex items-center justify-between p-4 rounded-lg glass-poker border border-primary/30">
                        <div>
                          <h3 className="text-lg font-bold">{relatorioCliente.cliente.nome}</h3>
                          <p className="text-sm text-muted-foreground">
                            {relatorioCliente.cliente.telefone || 'Sem telefone'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${relatorioCliente.cliente.saldo < 0 ? 'text-orange-500' : 'text-green-500'}`}>
                            {formatCurrency(Math.abs(relatorioCliente.cliente.saldo))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {relatorioCliente.cliente.saldo < 0 ? 'deve' : 'saldo'}
                          </p>
                        </div>
                      </div>

                      {/* Filtro de Período */}
                      <div className="flex gap-2 flex-wrap items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {['hoje', 'semana', 'mes', 'todos'].map((periodo) => (
                            <Button
                              key={periodo}
                              size="sm"
                              variant={periodoSelecionado === periodo ? 'default' : 'outline'}
                              onClick={() => handleChangePeriodoCliente(periodo)}
                              className={periodoSelecionado === periodo ? 'btn-poker-primary' : 'btn-poker-outline'}
                            >
                              {periodo === 'hoje' ? 'Hoje' : periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mês' : 'Todos'}
                            </Button>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleExportRelatorioCliente}
                          className="gap-2 btn-poker-outline"
                        >
                          <FileDown className="h-4 w-4" />
                          <span className="hidden sm:inline">Exportar PDF</span>
                          <span className="sm:hidden">PDF</span>
                        </Button>
                      </div>

                      {/* Estatísticas do Cliente */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg glass-poker border border-primary/20">
                          <div className="text-xs text-muted-foreground mb-1">Total Comandas</div>
                          <div className="text-xl font-bold gold-text">{relatorioCliente.estatisticas.totalComandas}</div>
                        </div>
                        <div className="p-3 rounded-lg glass-poker border border-primary/20">
                          <div className="text-xs text-muted-foreground mb-1">Total Gasto</div>
                          <div className="text-xl font-bold gold-text">{formatCurrency(relatorioCliente.estatisticas.totalGasto)}</div>
                        </div>
                        <div className="p-3 rounded-lg glass-poker border border-primary/20">
                          <div className="text-xs text-muted-foreground mb-1">Ticket Médio</div>
                          <div className="text-xl font-bold gold-text">{formatCurrency(relatorioCliente.estatisticas.ticketMedio)}</div>
                        </div>
                        <div className="p-3 rounded-lg glass-poker border border-primary/20">
                          <div className="text-xs text-muted-foreground mb-1">Saldo Atual</div>
                          <div className={`text-xl font-bold ${relatorioCliente.estatisticas.saldoAtual < 0 ? 'text-orange-500' : 'text-green-500'}`}>
                            {formatCurrency(Math.abs(relatorioCliente.estatisticas.saldoAtual))}
                          </div>
                        </div>
                      </div>

                      {/* Gráfico de Histórico */}
                      {relatorioCliente.historicoComandas.length > 0 && (
                        <div className="p-4 rounded-lg glass-poker border border-primary/20">
                          <h4 className="text-sm font-semibold mb-3">Histórico de Gastos</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={relatorioCliente.historicoComandas}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                              <XAxis dataKey="data" stroke="#888" style={{ fontSize: '10px' }} />
                              <YAxis stroke="#888" style={{ fontSize: '10px' }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1a1a1a',
                                  border: '1px solid #D4AF37',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                                formatter={(value: any) => formatCurrency(Number(value))}
                              />
                              <Line type="monotone" dataKey="total" stroke="#D4AF37" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Produtos Mais Comprados */}
                      {relatorioCliente.produtosMaisComprados.length > 0 && (
                        <div className="p-4 rounded-lg glass-poker border border-primary/20">
                          <h4 className="text-sm font-semibold mb-3">Produtos Favoritos</h4>
                          <div className="space-y-2">
                            {relatorioCliente.produtosMaisComprados.slice(0, 5).map((produto, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm">{produto.nome}</span>
                                  <span className="text-xs text-muted-foreground">x{produto.quantidade}</span>
                                </div>
                                <span className="text-sm font-bold gold-text">{formatCurrency(produto.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comandas Detalhadas */}
                      <div className="p-4 rounded-lg glass-poker border border-primary/20">
                        <h4 className="text-sm font-semibold mb-3">Histórico de Comandas</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {relatorioCliente.comandasDetalhadas.map((comanda) => (
                            <div key={comanda.id} className="p-3 rounded bg-background/50 border border-primary/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold">Comanda #{comanda.id}</span>
                                <span className="text-sm font-bold gold-text">{formatCurrency(comanda.valorTotal)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {comanda.dataFechamento ? formatDate(new Date(comanda.dataFechamento)) : 'Em aberto'}
                                {comanda.formaPagamento && ` • ${comanda.formaPagamento}`}
                              </div>
                              <div className="space-y-1">
                                {comanda.itens.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span>{item.quantidade}x {item.produto}</span>
                                    <span>{formatCurrency(item.subtotal)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

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
