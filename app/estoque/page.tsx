"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertTriangle, Package, FileDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'
import { useToast } from '@/components/ui/use-toast'
import { generateEstoquePDF } from '@/lib/pdf-generator'

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
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    precoVenda: '',
    precoCusto: '',
    estoqueInicial: '',
    estoqueMinimo: '',
  })
  const [entradaEstoque, setEntradaEstoque] = useState<{ [key: number]: string }>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchProdutos()
    
    // Atualização automática a cada 10 segundos
    const interval = setInterval(() => {
      fetchProdutos()
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

  const produtosComEstoqueBaixo = produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 lg:ml-80 p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader 
            title="Estoque"
            description="Controle de produtos e movimentações"
            icon={Package}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold gold-text mb-2">Gerenciar Estoque</h1>
                <p className="text-muted-foreground">Controle de produtos e movimentações</p>
              </div>
              <Button 
                onClick={() => generateEstoquePDF(produtos)}
                size="lg"
                variant="outline"
                className="gap-2"
              >
                <FileDown className="h-5 w-5" />
                Exportar PDF
              </Button>
            </div>
          </motion.div>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cadastro de Produto */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Novo Produto
                  </CardTitle>
                  <CardDescription>Cadastrar novo item no estoque</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={criarProduto} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome do Produto</Label>
                      <Input
                        id="nome"
                        value={novoProduto.nome}
                        onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="precoVenda">Preço de Venda</Label>
                      <Input
                        id="precoVenda"
                        type="number"
                        step="0.01"
                        value={novoProduto.precoVenda}
                        onChange={(e) => setNovoProduto({ ...novoProduto, precoVenda: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="precoCusto">Preço de Custo</Label>
                      <Input
                        id="precoCusto"
                        type="number"
                        step="0.01"
                        value={novoProduto.precoCusto}
                        onChange={(e) => setNovoProduto({ ...novoProduto, precoCusto: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="estoqueInicial">Estoque Inicial</Label>
                      <Input
                        id="estoqueInicial"
                        type="number"
                        value={novoProduto.estoqueInicial}
                        onChange={(e) => setNovoProduto({ ...novoProduto, estoqueInicial: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
                      <Input
                        id="estoqueMinimo"
                        type="number"
                        value={novoProduto.estoqueMinimo}
                        onChange={(e) => setNovoProduto({ ...novoProduto, estoqueMinimo: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Cadastrando...' : 'Cadastrar Produto'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Produtos */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produtos em Estoque
                  </CardTitle>
                  <CardDescription>{produtos.length} produto(s) cadastrado(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Adicionar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtos.map((produto) => (
                        <TableRow
                          key={produto.id}
                          className={produto.estoqueAtual <= produto.estoqueMinimo ? 'border-l-4 border-l-orange-500' : ''}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{produto.nome}</div>
                              {produto.estoqueAtual <= produto.estoqueMinimo && (
                                <div className="flex items-center gap-1 text-xs text-orange-500 mt-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Estoque baixo
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-bold">{formatCurrency(Number(produto.precoVenda))}</div>
                              <div className="text-xs text-muted-foreground">
                                Custo: {formatCurrency(Number(produto.precoCusto))}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-lg">
                              {produto.estoqueAtual}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Mín: {produto.estoqueMinimo}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Qtd"
                                value={entradaEstoque[produto.id] || ''}
                                onChange={(e) => setEntradaEstoque({ ...entradaEstoque, [produto.id]: e.target.value })}
                                className="w-20"
                              />
                              <Button
                                size="sm"
                                onClick={() => adicionarEstoque(produto.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
