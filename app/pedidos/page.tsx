"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus, Trash2, ShoppingCart, FileDown, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'
import { useToast } from '@/components/ui/use-toast'
import { generatePedidoPDF } from '@/lib/pdf-generator'

interface Produto {
  id: number
  nome: string
  precoVenda: number
  unidadeMedida: string
  estoqueAtual: number
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
  unidadeMedida: string
  quantidade: number
  subtotal: number
}

export default function PedidosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchCliente, setSearchCliente] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<number | null>(null)
  const [pagoAVista, setPagoAVista] = useState(true)
  const [ultimoPedido, setUltimoPedido] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchProdutos()
    fetchClientes()
    
    // Atualização automática a cada 10 segundos
    const interval = setInterval(() => {
      fetchProdutos()
      fetchClientes()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

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
    const itemExistente = carrinho.find(item => item.produtoId === produto.id)
    
    if (itemExistente) {
      if (itemExistente.quantidade >= produto.estoqueAtual) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${produto.estoqueAtual} unidades disponíveis`,
          variant: "destructive",
        })
        return
      }
      
      setCarrinho(carrinho.map(item =>
        item.produtoId === produto.id
          ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.precoUnitario }
          : item
      ))
    } else {
      setCarrinho([...carrinho, {
        produtoId: produto.id,
        nome: produto.nome,
        precoUnitario: Number(produto.precoVenda),
        unidadeMedida: produto.unidadeMedida,
        quantidade: 1,
        subtotal: Number(produto.precoVenda),
      }])
    }
  }

  function alterarQuantidade(produtoId: number, delta: number) {
    const produto = produtos.find(p => p.id === produtoId)
    const item = carrinho.find(i => i.produtoId === produtoId)
    
    if (!produto || !item) return
    
    const novaQuantidade = item.quantidade + delta
    
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId)
      return
    }
    
    if (novaQuantidade > produto.estoqueAtual) {
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
    if (carrinho.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao pedido antes de finalizar",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
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
        const pedidoData = await res.json()
        
        // Salvar dados do pedido para gerar PDF
        setUltimoPedido({
          id: pedidoData.id,
          total: totalCarrinho,
          itens: carrinho
        })
        
        const statusPagamento = pagoAVista ? "à vista" : "fiado"
        const clienteInfo = clienteSelecionado 
          ? ` - Jogador: ${clientes.find(c => c.id === clienteSelecionado)?.nome}` 
          : ""
        
        toast({
          title: "Pedido finalizado!",
          description: `Total: ${formatCurrency(totalCarrinho)} (${statusPagamento})${clienteInfo}`,
        })
        
        setCarrinho([])
        setClienteSelecionado(null)
        setSearchCliente('')
        setPagoAVista(true)
        fetchProdutos()
        fetchClientes()
      } else {
        throw new Error('Erro ao finalizar pedido')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o pedido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function gerarComprovante() {
    if (ultimoPedido) {
      generatePedidoPDF(ultimoPedido, ultimoPedido.itens)
    }
  }

  const totalCarrinho = carrinho.reduce((sum, item) => sum + item.subtotal, 0)
  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 lg:ml-80 p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader 
            title="Novo Pedido"
            description="Selecione produtos e finalize a venda"
            icon={ShoppingCart}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold gold-text mb-2">Novo Pedido</h1>
            <p className="text-muted-foreground">Selecione os produtos para adicionar ao pedido</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Produtos */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Disponíveis</CardTitle>
                  <CardDescription>Clique para adicionar ao pedido</CardDescription>
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-4"
                  />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {produtosFiltrados.map((produto) => (
                      <motion.div
                        key={produto.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          onClick={() => adicionarAoCarrinho(produto)}
                          className="p-4 rounded-lg glass-effect neon-border cursor-pointer hover:bg-white/5 transition-all"
                        >
                          <h3 className="font-semibold mb-2">{produto.nome}</h3>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                                {formatCurrency(Number(produto.precoVenda))}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">/{produto.unidadeMedida}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Estoque: {produto.estoqueAtual}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carrinho */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Carrinho
                  </CardTitle>
                  <CardDescription>{carrinho.length} item(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-4">
                    {carrinho.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Carrinho vazio
                      </p>
                    ) : (
                      carrinho.map((item) => (
                        <div key={item.produtoId} className="p-3 rounded-lg glass-effect">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-medium text-sm">{item.nome}</span>
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(item.precoUnitario)}/{item.unidadeMedida}
                              </div>
                            </div>
                            <button
                              onClick={() => removerDoCarrinho(item.produtoId)}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => alterarQuantidade(item.produtoId, -1)}
                                className="p-1 rounded hover:bg-white/10"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center">{item.quantidade}</span>
                              <button
                                onClick={() => alterarQuantidade(item.produtoId, 1)}
                                className="p-1 rounded hover:bg-white/10"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-4 mb-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="gradient-primary bg-clip-text text-transparent">
                        {formatCurrency(totalCarrinho)}
                      </span>
                    </div>
                  </div>

                  {/* Seleção de Jogador */}
                  <div className="space-y-3 mb-4 pb-4 border-b border-white/10">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      Jogador (Opcional)
                    </Label>
                    
                    {/* Campo de busca */}
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Buscar jogador ou venda sem jogador..."
                        value={searchCliente}
                        onChange={(e) => setSearchCliente(e.target.value)}
                        className="w-full bg-white/5 border-white/10 focus:border-absolut-gold"
                      />
                    </div>

                    {/* Lista de jogadores filtrados */}
                    {searchCliente && (
                      <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded-lg bg-white/5 border border-white/10">
                        <button
                          onClick={() => {
                            setClienteSelecionado(null)
                            setSearchCliente('')
                          }}
                          className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors text-sm"
                        >
                          <span className="text-muted-foreground">Venda sem jogador</span>
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
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{cliente.nome}</span>
                                <span className={`text-xs ${Number(cliente.saldo) < 0 ? 'text-orange-500' : 'text-green-500'}`}>
                                  {formatCurrency(Number(cliente.saldo))}
                                </span>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}

                    {/* Jogador selecionado */}
                    {clienteSelecionado && !searchCliente && (
                      <div className="p-3 rounded-lg bg-absolut-gold/10 border border-absolut-gold/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-absolut-gold" />
                            <span className="font-medium text-sm">
                              {clientes.find(c => c.id === clienteSelecionado)?.nome}
                            </span>
                          </div>
                          <button
                            onClick={() => setClienteSelecionado(null)}
                            className="text-red-500 hover:text-red-400 text-xs"
                          >
                            Remover
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <input
                            type="checkbox"
                            id="pagoAVista"
                            checked={pagoAVista}
                            onChange={(e) => setPagoAVista(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-absolut-gold focus:ring-absolut-gold"
                          />
                          <Label htmlFor="pagoAVista" className="cursor-pointer text-sm">
                            Pago à vista
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={finalizarPedido}
                      disabled={loading || carrinho.length === 0}
                    >
                      {loading ? 'Finalizando...' : 'Finalizar Pedido'}
                    </Button>
                    
                    {ultimoPedido && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={gerarComprovante}
                      >
                        <FileDown className="h-5 w-5" />
                        Gerar Comprovante PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
