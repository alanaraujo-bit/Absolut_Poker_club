"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, ShoppingBag, Package, AlertTriangle, LayoutDashboard, Plus, X, Minus, Trash2, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface DashboardStats {
  totalVendidoHoje: number
  totalPedidosHoje: number
  produtoMaisVendido: string
  estoquesBaixos: number
}

interface Produto {
  id: number
  nome: string
  precoVenda: number
  estoqueAtual: number
  ativo?: boolean
}

interface Cliente {
  id: number
  nome: string
  saldo: number
}

interface ItemCarrinho {
  produtoId: number
  nome: string
  precoUnitario: number
  quantidade: number
  subtotal: number
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVendidoHoje: 0,
    totalPedidosHoje: 0,
    produtoMaisVendido: '-',
    estoquesBaixos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchCliente, setSearchCliente] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<number | null>(null)
  const [pagoAVista, setPagoAVista] = useState(true)
  const [loadingPedido, setLoadingPedido] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
    fetchProdutos()
    fetchClientes()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/dashboard/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProdutos() {
    try {
      const res = await fetch('/api/produtos')
      if (res.ok) {
        const data = await res.json()
        setProdutos(data)
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

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

  function adicionarAoCarrinho(produto: Produto) {
    const itemExistente = carrinho.find(i => i.produtoId === produto.id)
    
    if (itemExistente) {
      if (itemExistente.quantidade >= produto.estoqueAtual) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${produto.estoqueAtual} unidades disponíveis`,
          variant: "destructive",
        })
        return
      }
      setCarrinho(carrinho.map(i =>
        i.produtoId === produto.id
          ? { ...i, quantidade: i.quantidade + 1, subtotal: (i.quantidade + 1) * i.precoUnitario }
          : i
      ))
    } else {
      setCarrinho([...carrinho, {
        produtoId: produto.id,
        nome: produto.nome,
        precoUnitario: Number(produto.precoVenda),
        quantidade: 1,
        subtotal: Number(produto.precoVenda)
      }])
    }
  }

  function alterarQuantidade(produtoId: number, delta: number) {
    const item = carrinho.find(i => i.produtoId === produtoId)
    if (!item) return
    
    const novaQuantidade = item.quantidade + delta
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId)
      return
    }
    
    const produto = produtos.find(p => p.id === produtoId)
    if (produto && novaQuantidade > produto.estoqueAtual) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${produto.estoqueAtual} unidades disponíveis`,
        variant: "destructive",
      })
      return
    }
    
    setCarrinho(carrinho.map(i =>
      i.produtoId === produtoId
        ? { ...i, quantidade: novaQuantidade, subtotal: novaQuantidade * i.precoUnitario }
        : i
    ))
  }

  function removerDoCarrinho(produtoId: number) {
    setCarrinho(carrinho.filter(item => item.produtoId !== produtoId))
  }

  async function finalizarPedido() {
    if (carrinho.length === 0) return

    setLoadingPedido(true)
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          itens: carrinho,
          clienteId: clienteSelecionado,
          pago: pagoAVista
        }),
      })

      if (res.ok) {
        const statusPagamento = pagoAVista ? "à vista" : "fiado"
        const clienteInfo = clienteSelecionado 
          ? ` - Cliente: ${clientes.find(c => c.id === clienteSelecionado)?.nome}` 
          : ""
        
        toast({
          title: "Pedido finalizado!",
          description: `Total: ${formatCurrency(totalCarrinho)} (${statusPagamento})${clienteInfo}`,
        })
        
        setCarrinho([])
        setClienteSelecionado(null)
        setSearchCliente('')
        setPagoAVista(true)
        setModalAberto(false)
        fetchStats()
        fetchProdutos()
        fetchClientes()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o pedido",
        variant: "destructive",
      })
    } finally {
      setLoadingPedido(false)
    }
  }

  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.subtotal, 0)
  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) && p.ativo
  )

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
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 lg:ml-80 p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader 
            title="Dashboard ACATH"
            description="Associação Canaense Absolut de Texas Hold'em"
            icon={LayoutDashboard}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 2) }}
                >
                  <Card className="relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {card.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient} bg-opacity-20`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="h-8 bg-white/5 rounded animate-pulse" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold mb-1">
                            {card.value}
                          </div>
                          <p className="text-xs text-muted-foreground">
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
              className="mt-8"
            >
              <Card className="border-orange-500/50 bg-orange-500/10">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                    <div>
                      <CardTitle>Atenção: Estoque Baixo</CardTitle>
                      <CardDescription>
                        {stats.estoquesBaixos} produto(s) com estoque abaixo do mínimo
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href="/estoque">
                    <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                      Verificar Estoque
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setModalAberto(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full gradient-primary neon-glow shadow-2xl flex items-center justify-center z-50 lg:right-16"
      >
        <Plus className="h-8 w-8 text-white" />
      </motion.button>

      {/* Modal Pedido Rápido */}
      <AnimatePresence>
        {modalAberto && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalAberto(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-2"
            >
              <div className="w-full max-w-3xl h-[80vh]">
              <Card className="h-full flex flex-col">
                <CardHeader className="border-b border-white/10 flex-shrink-0 p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm gold-text">Pedido Rápido</CardTitle>
                      <CardDescription className="text-[10px]">Selecione e finalize</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalAberto(false)}
                      className="hover:bg-white/10 h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-2 min-h-0 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 h-full">
                    {/* Produtos - 3 colunas */}
                    <div className="lg:col-span-3 flex flex-col h-full min-h-0">
                      <Input
                        type="text"
                        placeholder="🔍 Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-1.5 bg-white/5 border-white/10 flex-shrink-0 h-6 text-[10px]"
                      />
                      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
                        {produtosFiltrados.map((produto) => (
                          <motion.button
                            key={produto.id}
                            whileHover={{ scale: 1.005 }}
                            whileTap={{ scale: 0.995 }}
                            onClick={() => adicionarAoCarrinho(produto)}
                            className="w-full p-1 rounded glass-effect border border-white/10 hover:border-absolut-gold/50 transition-all text-left flex-shrink-0"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-[10px] truncate">{produto.nome}</h3>
                                <p className="text-[8px] text-muted-foreground">Est: {produto.estoqueAtual}</p>
                              </div>
                              <span className="text-[10px] font-bold gradient-primary bg-clip-text text-transparent whitespace-nowrap">
                                {formatCurrency(Number(produto.precoVenda))}
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Carrinho - 2 colunas */}
                    <div className="lg:col-span-2 flex flex-col h-full min-h-0 border-l border-white/10 pl-2">
                      <h3 className="text-xs font-bold mb-2 flex items-center gap-1 flex-shrink-0">
                        <ShoppingBag className="h-3 w-3" />
                        Carrinho ({carrinho.length})
                      </h3>
                      
                      {/* Seleção de Cliente */}
                      <div className="space-y-1 pb-2 mb-2 border-b border-white/10 flex-shrink-0">
                        <Label className="flex items-center gap-1 text-[10px] font-medium">
                          <User className="h-2.5 w-2.5" />
                          Cliente
                        </Label>
                        
                        <Input
                          type="text"
                          placeholder="🔍 Cliente..."
                          value={searchCliente}
                          onChange={(e) => setSearchCliente(e.target.value)}
                          className="w-full bg-white/5 border-white/10 focus:border-absolut-gold text-[10px] h-6"
                        />

                        {searchCliente && (
                          <div className="max-h-24 overflow-y-auto space-y-1 p-1 rounded-lg bg-white/5 border border-white/10">
                            <button
                              onClick={() => {
                                setClienteSelecionado(null)
                                setSearchCliente('')
                              }}
                              className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors text-xs"
                            >
                              <span className="text-muted-foreground">Sem cliente</span>
                            </button>
                            {clientes
                              .filter(c => c.nome.toLowerCase().includes(searchCliente.toLowerCase()))
                              .map((cliente) => (
                                <button
                                  key={cliente.id}
                                  onClick={() => {
                                    setClienteSelecionado(cliente.id)
                                    setSearchCliente('')
                                  }}
                                  className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-xs truncate flex-1">{cliente.nome}</span>
                                    <span className={`text-xs whitespace-nowrap ${Number(cliente.saldo) < 0 ? 'text-orange-500' : 'text-green-500'}`}>
                                      {formatCurrency(Number(cliente.saldo))}
                                    </span>
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}

                        {clienteSelecionado && !searchCliente && (
                          <div className="p-2 rounded-lg bg-absolut-gold/10 border border-absolut-gold/30">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <User className="h-3 w-3 text-absolut-gold flex-shrink-0" />
                                <span className="font-medium text-xs truncate">
                                  {clientes.find(c => c.id === clienteSelecionado)?.nome}
                                </span>
                              </div>
                              <button
                                onClick={() => setClienteSelecionado(null)}
                                className="text-red-500 hover:text-red-400 text-xs flex-shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="pagoAVistaModal"
                                checked={pagoAVista}
                                onChange={(e) => setPagoAVista(e.target.checked)}
                                className="w-3 h-3 rounded"
                              />
                              <Label htmlFor="pagoAVistaModal" className="cursor-pointer text-xs">
                                Pago à vista
                              </Label>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
                        {carrinho.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4 text-xs">
                            Carrinho vazio
                          </p>
                        ) : (
                          carrinho.map((item) => (
                            <div key={item.produtoId} className="p-2 rounded-lg glass-effect">
                              <div className="flex items-start justify-between mb-1 gap-2">
                                <span className="font-medium text-xs flex-1 truncate">{item.nome}</span>
                                <button
                                  onClick={() => removerDoCarrinho(item.produtoId)}
                                  className="text-red-500 hover:text-red-400 flex-shrink-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => alterarQuantidade(item.produtoId, -1)}
                                    className="p-0.5 rounded hover:bg-white/10"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-6 text-center text-xs">{item.quantidade}</span>
                                  <button
                                    onClick={() => alterarQuantidade(item.produtoId, 1)}
                                    className="p-0.5 rounded hover:bg-white/10"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <span className="font-bold text-xs">{formatCurrency(item.subtotal)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="border-t border-white/10 pt-2 space-y-1.5 flex-shrink-0">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-[11px]">Total:</span>
                          <span className="gradient-primary bg-clip-text text-transparent text-sm">
                            {formatCurrency(totalCarrinho)}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          className="w-full h-7 text-[10px]"
                          onClick={finalizarPedido}
                          disabled={loadingPedido || carrinho.length === 0}
                        >
                          {loadingPedido ? 'Finalizando...' : 'Finalizar'}
                        </Button>
                        <Link href="/pedidos" className="block">
                          <Button variant="outline" size="sm" className="w-full h-6 text-[10px]">
                            Completo
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
