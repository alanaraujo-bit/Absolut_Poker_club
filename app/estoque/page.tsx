"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertTriangle, Package, FileDown, Trash2, Edit, X, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { generateEstoquePDF } from '@/lib/pdf-generator'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'

interface Produto {
  id: number
  nome: string
  precoVenda: number
  precoCusto: number
  estoqueAtual: number
  estoqueMinimo: number
  ativo: boolean
}

export default function EstoquePage() {
  const router = useRouter()
  const { usuario, isAdmin } = useAuth()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    precoVenda: '',
    precoCusto: '',
    estoqueInicial: '',
    estoqueMinimo: '',
  })
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [entradaEstoque, setEntradaEstoque] = useState<{ [key: number]: string }>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchProdutos()
    
    // Atualização automática a cada 10 segundos (pausada quando modais estão abertos)
    const interval = setInterval(() => {
      if (!mostrarFormulario && !produtoEditando) {
        fetchProdutos()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [mostrarFormulario, produtoEditando])

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

  async function criarProduto(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoProduto.nome,
          precoVenda: parseFloat(novoProduto.precoVenda),
          precoCusto: parseFloat(novoProduto.precoCusto),
          estoqueAtual: parseInt(novoProduto.estoqueInicial),
          estoqueMinimo: parseInt(novoProduto.estoqueMinimo),
        }),
      })

      if (res.ok) {
        toast({
          title: "Produto cadastrado!",
          description: `${novoProduto.nome} foi adicionado ao estoque`,
        })
        setNovoProduto({
          nome: '',
          precoVenda: '',
          precoCusto: '',
          estoqueInicial: '',
          estoqueMinimo: '',
        })
        setMostrarFormulario(false)
        fetchProdutos()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o produto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function adicionarEstoque(produtoId: number) {
    const quantidade = parseInt(entradaEstoque[produtoId] || '0')
    
    if (quantidade <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Digite uma quantidade maior que zero",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId,
          tipo: 'entrada',
          quantidade,
          observacao: 'Entrada manual',
        }),
      })

      if (res.ok) {
        toast({
          title: "Estoque atualizado!",
          description: `${quantidade} unidades adicionadas`,
        })
        setEntradaEstoque({ ...entradaEstoque, [produtoId]: '' })
        fetchProdutos()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estoque",
        variant: "destructive",
      })
    }
  }

  async function excluirProduto(id: number, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: data.message,
        })
        fetchProdutos()
      } else {
        throw new Error(data.error || 'Erro ao excluir')
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o produto",
        variant: "destructive",
      })
    }
  }

  async function editarProduto(e: React.FormEvent) {
    e.preventDefault()
    if (!produtoEditando) return

    setLoading(true)

    try {
      const res = await fetch(`/api/produtos/${produtoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: produtoEditando.nome,
          precoVenda: Number(produtoEditando.precoVenda),
          precoCusto: Number(produtoEditando.precoCusto),
          estoqueMinimo: Number(produtoEditando.estoqueMinimo),
        }),
      })

      if (res.ok) {
        toast({
          title: "Produto atualizado!",
          description: `${produtoEditando.nome} foi atualizado com sucesso`,
        })
        setProdutoEditando(null)
        fetchProdutos()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o produto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const produtosComEstoqueBaixo = produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo)

  // Handlers estáveis
  const handleNovoProdutoChange = useCallback((field: string, value: string) => {
    setNovoProduto(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleCloseModal = useCallback(() => {
    setMostrarFormulario(false)
  }, [])

  const handleCloseProdutoEditando = useCallback(() => {
    setProdutoEditando(null)
  }, [])

  // Componente de Modal Novo Produto (Reutilizável)
  const ModalNovoProduto = useMemo(() => {
    if (!mostrarFormulario) return null
    
    return (
      <div 
        className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        onClick={handleCloseModal}
      >
        <div
          className="bg-card rounded-t-3xl sm:rounded-xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 glass-dark border-b border-primary/20 p-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-xl">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              <h2 className="font-bold gold-text">Novo Produto</h2>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCloseModal}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={criarProduto} className="p-4 space-y-4">
            <div>
              <Label htmlFor="nome">Nome do Produto</Label>
              <Input
                id="nome"
                value={novoProduto.nome}
                onChange={(e) => handleNovoProdutoChange('nome', e.target.value)}
                required
                placeholder="Ex: Cerveja Heineken"
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="precoVenda">Preço de Venda</Label>
                <Input
                  id="precoVenda"
                  type="number"
                  step="0.01"
                  value={novoProduto.precoVenda}
                  onChange={(e) => handleNovoProdutoChange('precoVenda', e.target.value)}
                  required
                  placeholder="0.00"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="precoCusto">Preço de Custo</Label>
                <Input
                  id="precoCusto"
                  type="number"
                  step="0.01"
                  value={novoProduto.precoCusto}
                  onChange={(e) => handleNovoProdutoChange('precoCusto', e.target.value)}
                  required
                  placeholder="0.00"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="estoqueInicial">Estoque Inicial</Label>
                <Input
                  id="estoqueInicial"
                  type="number"
                  value={novoProduto.estoqueInicial}
                  onChange={(e) => handleNovoProdutoChange('estoqueInicial', e.target.value)}
                  required
                  placeholder="0"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
                <Input
                  id="estoqueMinimo"
                  type="number"
                  value={novoProduto.estoqueMinimo}
                  onChange={(e) => handleNovoProdutoChange('estoqueMinimo', e.target.value)}
                  required
                  placeholder="0"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }, [mostrarFormulario, novoProduto, loading, handleCloseModal, handleNovoProdutoChange, criarProduto])

  // Componente de Modal Editar Produto (Reutilizável)
  const ModalEditarProduto = useMemo(() => {
    if (!produtoEditando) return null
    
    return (
      <div 
        className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        onClick={handleCloseProdutoEditando}
      >
        <div
          className="bg-card rounded-t-3xl sm:rounded-xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 glass-dark border-b border-primary/20 p-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-xl">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              <h2 className="font-bold gold-text">Editar Produto</h2>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCloseProdutoEditando}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={editarProduto} className="p-4 space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome do Produto</Label>
              <Input
                id="edit-nome"
                value={produtoEditando.nome}
                onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                required
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-precoVenda">Preço de Venda</Label>
                <Input
                  id="edit-precoVenda"
                  type="number"
                  step="0.01"
                  value={produtoEditando.precoVenda}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, precoVenda: parseFloat(e.target.value) })}
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="edit-precoCusto">Preço de Custo</Label>
                <Input
                  id="edit-precoCusto"
                  type="number"
                  step="0.01"
                  value={produtoEditando.precoCusto}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, precoCusto: parseFloat(e.target.value) })}
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-estoqueAtual">Estoque Atual</Label>
              <Input
                id="edit-estoqueAtual"
                type="number"
                value={produtoEditando.estoqueAtual}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use "Adicionar" para alterar o estoque
              </p>
            </div>
            <div>
              <Label htmlFor="edit-estoqueMinimo">Estoque Mínimo</Label>
              <Input
                id="edit-estoqueMinimo"
                type="number"
                value={produtoEditando.estoqueMinimo}
                onChange={(e) => setProdutoEditando({ ...produtoEditando, estoqueMinimo: parseInt(e.target.value) })}
                required
                autoComplete="off"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCloseProdutoEditando}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }, [produtoEditando, loading, handleCloseProdutoEditando, editarProduto])

  // Renderização para Admin (com Sidebar)
  if (isAdmin) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        
        <main className="flex-1 lg:ml-80 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <PageHeader 
              title="Estoque"
              description="Controle de produtos e movimentações"
              icon={Package}
              actions={
                <Button 
                  onClick={() => generateEstoquePDF(produtos)}
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <FileDown className="h-5 w-5" />
                  <span className="hidden sm:inline">Exportar PDF</span>
                </Button>
              }
            />

            {/* Alerta de Estoque Baixo */}
            {produtosComEstoqueBaixo.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="border-orange-500/50 bg-orange-500/10">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-orange-500" />
                      <div>
                        <CardTitle>Atenção: {produtosComEstoqueBaixo.length} produto(s) com estoque baixo</CardTitle>
                        <CardDescription>Verifique os itens marcados abaixo</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            )}

            {/* Botão Novo Produto */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Button
                onClick={() => setMostrarFormulario(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Novo Produto
              </Button>
            </motion.div>

            {/* Lista de Produtos - Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {produtos.map((produto, index) => (
                <motion.div
                  key={produto.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={produto.estoqueAtual <= produto.estoqueMinimo ? 'border-l-4 border-l-orange-500' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="truncate">{produto.nome}</CardTitle>
                          {produto.estoqueAtual <= produto.estoqueMinimo && (
                            <div className="flex items-center gap-1 text-xs text-orange-500 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              Estoque baixo
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProdutoEditando(produto)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => excluirProduto(produto.id, produto.nome)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-background/30 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Venda</p>
                          <p className="font-bold text-primary text-sm">
                            {formatCurrency(Number(produto.precoVenda))}
                          </p>
                        </div>
                        <div className="bg-background/30 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Custo</p>
                          <p className="font-bold text-sm">
                            {formatCurrency(Number(produto.precoCusto))}
                          </p>
                        </div>
                        <div className="bg-background/30 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Estoque</p>
                          <p className="font-bold text-lg gold-text">
                            {produto.estoqueAtual}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Mín: {produto.estoqueMinimo}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Quantidade"
                          value={entradaEstoque[produto.id] || ''}
                          onChange={(e) => setEntradaEstoque({ ...entradaEstoque, [produto.id]: e.target.value })}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => adicionarEstoque(produto.id)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {produtos.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nenhum produto cadastrado</p>
              </div>
            )}

            {/* Modais */}
            {ModalNovoProduto}
            {ModalEditarProduto}
          </div>
        </main>
      </div>
    )
  }

  // Renderização para Garçom (Mobile-First)
  return (
    <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark pb-20">
      {/* Header Mobile */}
      <header className="glass-dark border-b border-primary/20 p-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/garcom')}
              className="p-2 rounded-lg hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-bold gold-text">Estoque</h1>
              </div>
              <p className="text-xs text-muted-foreground">{produtos.length} produto(s)</p>
            </div>
          </div>
          <Button 
            onClick={() => generateEstoquePDF(produtos)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Alerta de Estoque Baixo */}
        {produtosComEstoqueBaixo.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-poker border border-orange-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-orange-400">Atenção!</p>
                <p className="text-sm text-muted-foreground">
                  {produtosComEstoqueBaixo.length} produto(s) com estoque baixo
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Botão Novo Produto */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setMostrarFormulario(true)}
          className="w-full glass-poker rounded-xl p-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-bold gold-text">Novo Produto</p>
              <p className="text-sm text-muted-foreground">Cadastrar item no estoque</p>
            </div>
          </div>
        </motion.button>

        {/* Lista de Produtos */}
        <div className="space-y-3">
          {produtos.map((produto, index) => (
            <motion.div
              key={produto.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass-poker rounded-xl p-4 ${
                produto.estoqueAtual <= produto.estoqueMinimo 
                  ? 'border-l-4 border-l-orange-500' 
                  : ''
              }`}
            >
              <div className="space-y-3">
                {/* Cabeçalho do Produto */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold gold-text truncate">{produto.nome}</h3>
                    {produto.estoqueAtual <= produto.estoqueMinimo && (
                      <div className="flex items-center gap-1 text-xs text-orange-400 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        Estoque baixo
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setProdutoEditando(produto)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => excluirProduto(produto.id, produto.nome)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Info do Produto */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-background/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Venda</p>
                    <p className="font-bold text-primary text-sm">
                      {formatCurrency(Number(produto.precoVenda))}
                    </p>
                  </div>
                  <div className="bg-background/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Custo</p>
                    <p className="font-bold text-sm">
                      {formatCurrency(Number(produto.precoCusto))}
                    </p>
                  </div>
                  <div className="bg-background/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Estoque</p>
                    <p className="font-bold text-lg gold-text">
                      {produto.estoqueAtual}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mín: {produto.estoqueMinimo}
                    </p>
                  </div>
                </div>

                {/* Adicionar Estoque */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Quantidade"
                    value={entradaEstoque[produto.id] || ''}
                    onChange={(e) => setEntradaEstoque({ ...entradaEstoque, [produto.id]: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => adicionarEstoque(produto.id)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {produtos.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum produto cadastrado</p>
          </div>
        )}
      </div>

      {/* Modais */}
      {ModalNovoProduto}
      {ModalEditarProduto}
    </div>
  )
}
