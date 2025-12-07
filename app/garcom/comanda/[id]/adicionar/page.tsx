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
  estoqueAtual: number
}

type ItemCarrinho = {
  produto: Produto
  quantidade: number
}

export default function AdicionarItensPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    carregarProdutos()
  }, [])

  const carregarProdutos = async () => {
    const res = await fetch('/api/produtos')
    const data = await res.json()
    setProdutos(data)
  }

  const adicionarAoCarrinho = (produto: Produto) => {
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

  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho(prev => {
      const item = prev.find(i => i.produto.id === produtoId)
      if (item && item.quantidade > 1) {
        return prev.map(i =>
          i.produto.id === produtoId
            ? { ...i, quantidade: i.quantidade - 1 }
            : i
        )
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
        const res = await fetch(`/api/comandas/${params.id}/itens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produtoId: item.produto.id,
            quantidade: item.quantidade,
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

  const total = carrinho.reduce(
    (sum, item) => sum + item.produto.precoVenda * item.quantidade,
    0
  )

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
                  <p className="text-sm gold-text">R$ {produto.precoVenda.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Estoque: {produto.estoqueAtual}
                  </p>
                </div>

                {itemCarrinho ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removerDoCarrinho(produto.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{itemCarrinho.quantidade}</span>
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
