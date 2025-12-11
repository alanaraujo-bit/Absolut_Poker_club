'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Minus, ShoppingCart, X, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

type Produto = {
  id: number
  nome: string
  precoVenda: number
  estoqueAtual: number | null
  unidadeMedida: string
}

type ItemCarrinho = {
  produto: Produto
  quantidade: number
  peso?: number // Para produtos em kg
}

export default function AdicionarItensPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalPeso, setModalPeso] = useState<{ show: boolean; produto: Produto | null }>({
    show: false,
    produto: null,
  })
  const [pesoInput, setPesoInput] = useState('')

  useEffect(() => {
    carregarProdutos()
  }, [])

  const carregarProdutos = async () => {
    const res = await fetch('/api/produtos?ordenarPorPopularidade=true')
    const data = await res.json()
    setProdutos(data)
  }

  const adicionarAoCarrinho = (produto: Produto) => {
    // Se produto é vendido por kg, abrir modal para input de peso
    if (produto.unidadeMedida === 'kg') {
      setModalPeso({ show: true, produto })
      setPesoInput('')
      return
    }

    // Para produtos de unidade, funciona como antes
    setCarrinho(prev => {
      const item = prev.find(i => i.produto.id === produto.id)
      if (item) {
        return prev.map(i =>
          i.produto.id === produto.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        )
      }
      return [...prev, { produto, quantidade: 1 }]
    })
  }

  const adicionarPorPeso = () => {
    if (!modalPeso.produto) return

    const peso = parseFloat(pesoInput.replace(',', '.'))
    
    if (isNaN(peso) || peso <= 0) {
      toast({
        title: '⚠️ Peso inválido',
        description: 'Digite um peso válido',
        variant: 'destructive',
      })
      return
    }

    setCarrinho(prev => {
      const item = prev.find(i => i.produto.id === modalPeso.produto!.id)
      if (item) {
        // Se já existe, adiciona ao peso
        return prev.map(i =>
          i.produto.id === modalPeso.produto!.id
            ? { ...i, peso: (i.peso || 0) + peso }
            : i
        )
      }
      return [...prev, { produto: modalPeso.produto!, quantidade: 1, peso }]
    })

    setModalPeso({ show: false, produto: null })
    setPesoInput('')
  }

  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho(prev => {
      const item = prev.find(i => i.produto.id === produtoId)
      if (item) {
        // Se é produto por peso, remove completamente
        if (item.produto.unidadeMedida === 'kg') {
          return prev.filter(i => i.produto.id !== produtoId)
        }
        // Se é por unidade e tem mais de 1, decrementa
        if (item.quantidade > 1) {
          return prev.map(i =>
            i.produto.id === produtoId
              ? { ...i, quantidade: i.quantidade - 1 }
              : i
          )
        }
      }
      return prev.filter(i => i.produto.id !== produtoId)
    })
  }

  const finalizarAdicao = async () => {
    if (carrinho.length === 0) {
      toast({
        title: '⚠️ Carrinho vazio',
        description: 'Adicione produtos antes de finalizar',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      // Adicionar cada item à comanda
      for (const item of carrinho) {
        const quantidadeEnviar = item.produto.unidadeMedida === 'kg' ? item.peso : item.quantidade
        
        const res = await fetch(`/api/comandas/${params.id}/itens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produtoId: item.produto.id,
            quantidade: quantidadeEnviar,
          }),
        })

        if (!res.ok) throw new Error('Erro ao adicionar item')
      }

      toast({
        title: '✅ Itens adicionados',
        description: `${carrinho.length} itens adicionados à comanda`,
      })

      router.back()
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: 'Erro ao adicionar itens',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  )

  const total = carrinho.reduce((sum, item) => {
    if (item.produto.unidadeMedida === 'kg' && item.peso) {
      return sum + item.produto.precoVenda * item.peso
    }
    return sum + item.produto.precoVenda * item.quantidade
  }, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark pb-32">
      <header className="glass-dark border-b border-primary/20 p-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-primary/10 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold gold-text">Adicionar Itens</h1>
            <p className="text-xs text-muted-foreground">Comanda #{params.id}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de Produtos */}
        <div className="grid gap-2">
          {produtosFiltrados.map(produto => {
            const itemCarrinho = carrinho.find(i => i.produto.id === produto.id)

            return (
              <motion.div
                key={produto.id}
                whileTap={{ scale: 0.98 }}
                className="poker-card p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium">{produto.nome}</p>
                  <p className="text-sm gold-text">
                    R$ {produto.precoVenda.toFixed(2)}
                    {produto.unidadeMedida === 'kg' && '/kg'}
                  </p>
                  {produto.estoqueAtual !== null && (
                    <p className="text-xs text-muted-foreground">
                      Estoque: {produto.estoqueAtual} {produto.unidadeMedida}
                    </p>
                  )}
                </div>

                {itemCarrinho ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removerDoCarrinho(produto.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center"
                    >
                      {produto.unidadeMedida === 'kg' ? <X className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    </button>
                    <span className="w-12 text-center font-bold text-sm">
                      {produto.unidadeMedida === 'kg' 
                        ? `${itemCarrinho.peso?.toFixed(3)}kg` 
                        : itemCarrinho.quantidade}
                    </span>
                    <button
                      onClick={() => adicionarAoCarrinho(produto)}
                      className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => adicionarAoCarrinho(produto)}
                    className="btn-poker-primary px-4 py-2"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Modal de Peso */}
      {modalPeso.show && modalPeso.produto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="poker-card max-w-sm w-full p-6 space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold gold-text">{modalPeso.produto.nome}</h3>
              <p className="text-sm text-muted-foreground">
                R$ {modalPeso.produto.precoVenda.toFixed(2)}/kg
              </p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Peso em quilogramas (kg)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 0.350"
                value={pesoInput}
                onChange={(e) => setPesoInput(e.target.value)}
                className="text-lg text-center"
                autoFocus
              />
              {pesoInput && !isNaN(parseFloat(pesoInput.replace(',', '.'))) && (
                <p className="text-center mt-2 text-sm gold-text">
                  Total: R$ {(parseFloat(pesoInput.replace(',', '.')) * modalPeso.produto.precoVenda).toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setModalPeso({ show: false, produto: null })
                  setPesoInput('')
                }}
                className="flex-1 py-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarPorPeso}
                className="flex-1 btn-poker-primary py-3 rounded-lg"
              >
                Adicionar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Carrinho Fixo */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 glass-dark border-t border-primary/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{carrinho.length} itens</p>
              <p className="text-2xl font-bold gold-text">R$ {total.toFixed(2)}</p>
            </div>
            <button
              onClick={finalizarAdicao}
              disabled={loading}
              className="btn-poker-primary px-8 py-3 rounded-xl text-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Adicionando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
