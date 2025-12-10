"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Filter, Download, ChevronDown, ChevronUp, Calendar, User, DollarSign, PackageCheck, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'
import { generateRelatorioComandasPDF } from '@/lib/pdf-generator'

interface Produto {
  id: number
  nome: string
}

interface ItemComanda {
  id: number
  quantidade: number
  precoUnitario: number
  subtotal: number
  produto: Produto
  dataHora: string
}

interface Cliente {
  id: number
  nome: string
  telefone: string | null
}

interface Garcom {
  id: number
  nome: string
}

interface Comanda {
  id: number
  dataAbertura: string
  dataFechamento: string | null
  status: string
  valorTotal: number
  formaPagamento: string | null
  observacao: string | null
  cliente: Cliente
  garcom: Garcom | null
  itens: ItemComanda[]
  totalItens: number
  quantidadeTotal: number
}

interface Estatisticas {
  totalComandas: number
  comandasAbertas: number
  comandasFechadas: number
  valorTotal: number
  valorMedio: number
}

interface TopProduto {
  id: number
  nome: string
  quantidade: number
  valorTotal: number
}

interface VendaPorGarcom {
  id: number
  nome: string
  comandas: number
  valorTotal: number
}

interface VendaPorDia {
  data: string
  comandas: number
  valorTotal: number
}

interface RelatorioData {
  comandas: Comanda[]
  estatisticas: Estatisticas
  topProdutos: TopProduto[]
  vendasPorGarcom: VendaPorGarcom[]
  vendasPorDia: VendaPorDia[]
}

export default function ComandasDetalhadasPage() {
  const [dados, setDados] = useState<RelatorioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [comandaExpandida, setComandaExpandida] = useState<number | null>(null)
  
  // Filtros
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [garcomSelecionado, setGarcomSelecionado] = useState('todos')
  const [statusSelecionado, setStatusSelecionado] = useState('todas')
  const [clienteSelecionado, setClienteSelecionado] = useState('todos')
  const [mostrarFiltros, setMostrarFiltros] = useState(true)
  
  // Listas para selects
  const [garcons, setGarcons] = useState<Garcom[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  function getDataLocal(data: Date): string {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  useEffect(() => {
    // Definir data padrão: hoje
    const hoje = new Date()
    
    setDataInicio(getDataLocal(hoje))
    setDataFim(getDataLocal(hoje))
    
    buscarGarcons()
    buscarClientes()
  }, [])

  useEffect(() => {
    if (dataInicio || dataFim) {
      buscarDados()
    }
  }, [dataInicio, dataFim, garcomSelecionado, statusSelecionado, clienteSelecionado])

  async function buscarGarcons() {
    try {
      const res = await fetch('/api/usuarios')
      if (res.ok) {
        const data = await res.json()
        setGarcons(data.filter((u: any) => u.tipo === 'garcom'))
      }
    } catch (error) {
      console.error('Erro ao buscar garçons:', error)
    }
  }

  async function buscarClientes() {
    try {
      const res = await fetch('/api/clientes')
      if (res.ok) {
        const data = await res.json()
        setClientes(data)
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  async function buscarDados() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dataInicio) params.append('dataInicio', dataInicio)
      if (dataFim) params.append('dataFim', dataFim)
      if (garcomSelecionado !== 'todos') params.append('garcomId', garcomSelecionado)
      if (statusSelecionado !== 'todas') params.append('status', statusSelecionado)
      if (clienteSelecionado !== 'todos') params.append('clienteId', clienteSelecionado)
      
      console.log('Filtros aplicados:', {
        dataInicio,
        dataFim,
        garcomSelecionado,
        statusSelecionado,
        clienteSelecionado
      })
      
      const res = await fetch(`/api/relatorios/comandas-detalhadas?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('Dados recebidos:', data.comandas.length, 'comandas')
        setDados(data)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  function limparFiltros() {
    const hoje = new Date()
    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(hoje.getDate() - 7)
    
    setDataInicio(getDataLocal(seteDiasAtras))
    setDataFim(getDataLocal(hoje))
    setGarcomSelecionado('todos')
    setStatusSelecionado('todas')
    setClienteSelecionado('todos')
  }

  function aplicarFiltroRapido(tipo: string) {
    const hoje = new Date()
    let inicio = new Date()
    
    switch (tipo) {
      case 'hoje':
        inicio = hoje
        break
      case 'ontem':
        inicio = new Date()
        inicio.setDate(hoje.getDate() - 1)
        break
      case 'semana':
        inicio = new Date()
        inicio.setDate(hoje.getDate() - 7)
        break
      case 'mes':
        inicio = new Date()
        inicio.setMonth(hoje.getMonth() - 1)
        break
    }
    
    setDataInicio(getDataLocal(inicio))
    setDataFim(getDataLocal(hoje))
  }

  function toggleComanda(id: number) {
    setComandaExpandida(comandaExpandida === id ? null : id)
  }

  function formatarDataBrasilia(dataISO: string): string {
    // Extrair a data do ISO
    const dataStr = dataISO.split('T')[0]
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  function formatarDataHoraBrasilia(dataISO: string): string {
    const data = new Date(dataISO)
    // Ajustar para horário de Brasília (UTC-3)
    data.setHours(data.getHours() - 3)
    return data.toLocaleString('pt-BR', { timeZone: 'UTC' })
  }

  function exportarPDF() {
    if (!dados) return
    
    const inicio = dataInicio ? formatarDataBrasilia(dataInicio + 'T00:00:00') : ''
    const fim = dataFim ? formatarDataBrasilia(dataFim + 'T00:00:00') : ''
    const periodo = inicio && fim ? `${inicio} a ${fim}` : 'Todos os períodos'
    
    generateRelatorioComandasPDF({
      ...dados,
      periodo
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 lg:ml-72 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <PageHeader 
              title="Relatório de Comandas"
              description="Análise detalhada de todas as comandas"
              icon={ClipboardList}
            />
          </div>

          {/* Filtros */}
          <Card className="poker-card border-primary/50">
            <CardHeader className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base md:text-lg">Filtros</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                >
                  {mostrarFiltros ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            
            {mostrarFiltros && (
              <CardContent className="px-4 pb-4 space-y-4">
                {/* Filtros Rápidos */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Período Rápido</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'Hoje', value: 'hoje' },
                      { label: 'Ontem', value: 'ontem' },
                      { label: 'Últimos 7 dias', value: 'semana' },
                      { label: 'Último mês', value: 'mes' }
                    ].map((filtro) => (
                      <Button
                        key={filtro.value}
                        size="sm"
                        variant="outline"
                        onClick={() => aplicarFiltroRapido(filtro.value)}
                        className="btn-poker-outline"
                      >
                        {filtro.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Filtros Personalizados */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data Início</label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="input-poker"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Data Fim</label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="input-poker"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Garçom</label>
                    <select
                      value={garcomSelecionado}
                      onChange={(e) => setGarcomSelecionado(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-background border border-input text-sm"
                    >
                      <option value="todos">Todos</option>
                      {garcons.map((garcom) => (
                        <option key={garcom.id} value={garcom.id}>
                          {garcom.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <select
                      value={statusSelecionado}
                      onChange={(e) => setStatusSelecionado(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-background border border-input text-sm"
                    >
                      <option value="todas">Todas</option>
                      <option value="aberta">Abertas</option>
                      <option value="fechada">Fechadas</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={limparFiltros}
                    className="gap-2 btn-poker-outline"
                  >
                    <X className="h-4 w-4" />
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Estatísticas */}
          {!loading && dados && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg glass-poker border border-primary/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-2xl font-bold gold-text">{dados.estatisticas.totalComandas}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-lg glass-poker border border-green-500/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <PackageCheck className="h-4 w-4 text-green-500" />
                  <div className="text-xs text-muted-foreground">Fechadas</div>
                </div>
                <div className="text-2xl font-bold text-green-500">{dados.estatisticas.comandasFechadas}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-lg glass-poker border border-orange-500/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <div className="text-xs text-muted-foreground">Abertas</div>
                </div>
                <div className="text-2xl font-bold text-orange-500">{dados.estatisticas.comandasAbertas}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-lg glass-poker border border-primary/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div className="text-xs text-muted-foreground">Valor Total</div>
                </div>
                <div className="text-2xl font-bold gold-text">{formatCurrency(dados.estatisticas.valorTotal)}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-lg glass-poker border border-primary/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div className="text-xs text-muted-foreground">Ticket Médio</div>
                </div>
                <div className="text-2xl font-bold gold-text">{formatCurrency(dados.estatisticas.valorMedio)}</div>
              </motion.div>
            </div>
          )}

          {/* Lista de Comandas */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-sm text-muted-foreground mt-4">Carregando comandas...</p>
            </div>
          ) : dados && dados.comandas.length > 0 ? (
            <Card className="poker-card">
              <CardHeader className="px-4 pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base md:text-lg">Comandas Encontradas</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      {dados.comandas.length} comanda(s) no período selecionado
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportarPDF}
                    className="gap-2 btn-poker-outline"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Exportar PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {dados.comandas.map((comanda, index) => (
                    <motion.div
                      key={comanda.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-primary/20 rounded-lg overflow-hidden"
                    >
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-primary/5 transition-colors"
                        onClick={() => toggleComanda(comanda.id)}
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <div className="text-sm font-medium">Comanda #{comanda.id}</div>
                            <div className="text-xs text-muted-foreground">{comanda.cliente.nome}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Abertura</div>
                            <div className="text-sm">{formatarDataBrasilia(comanda.dataAbertura)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Garçom</div>
                            <div className="text-sm">{comanda.garcom?.nome || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Valor</div>
                            <div className="text-lg font-bold gold-text">{formatCurrency(comanda.valorTotal)}</div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {comandaExpandida === comanda.id ? (
                            <ChevronUp className="h-5 w-5 text-primary" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Detalhes da Comanda */}
                      {comandaExpandida === comanda.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-primary/20 bg-background/50"
                        >
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <span className={`ml-2 font-medium ${comanda.status === 'aberta' ? 'text-orange-500' : 'text-green-500'}`}>
                                  {comanda.status === 'aberta' ? 'Aberta' : 'Fechada'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Fechamento:</span>
                                <span className="ml-2">
                                  {comanda.dataFechamento ? formatarDataBrasilia(comanda.dataFechamento) : '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Pagamento:</span>
                                <span className="ml-2">{comanda.formaPagamento || '-'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Itens:</span>
                                <span className="ml-2 font-medium">{comanda.totalItens}</span>
                              </div>
                            </div>

                            {comanda.observacao && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Observação:</span>
                                <p className="mt-1 text-sm">{comanda.observacao}</p>
                              </div>
                            )}

                            <div>
                              <div className="text-sm font-medium mb-2">Itens da Comanda</div>
                              <div className="space-y-2">
                                {comanda.itens.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between p-2 rounded bg-background/80 border border-primary/10"
                                  >
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">{item.produto.nome}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {item.quantidade}x {formatCurrency(item.precoUnitario)}
                                      </div>
                                    </div>
                                    <div className="text-sm font-bold gold-text">
                                      {formatCurrency(item.subtotal)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="poker-card">
              <CardContent className="p-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Nenhuma comanda encontrada</p>
                <p className="text-sm text-muted-foreground">
                  Ajuste os filtros para buscar comandas em outros períodos
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
