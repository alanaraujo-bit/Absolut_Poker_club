'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Clock, X, Receipt, LogOut, ChevronRight, BarChart3, User, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Produto = {
  id: number
  nome: string
  precoVenda: number
}

type Cliente = {
  id: number
  nome: string
  cpf?: string
  telefone?: string
}

type ItemComanda = {
  id: number
  produto: Produto
  quantidade: number
  precoUnitario: number
  subtotal: number
  dataHora: string
}

type Comanda = {
  id: number
  cliente: Cliente
  status: string
  dataAbertura: string
  valorTotal: number
  itens: ItemComanda[]
}

export default function GarcomPage() {
  const router = useRouter()
  const { usuario, logout } = useAuth()
  const { toast } = useToast()
  
  const [comandasAbertas, setComandasAbertas] = useState<Comanda[]>([])
  const [comandasFechadas, setComandasFechadas] = useState<Comanda[]>([])
  const [comandaSelecionada, setComandaSelecionada] = useState<Comanda | null>(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'comandas' | 'nova-comanda' | 'detalhes'>('comandas')
  const [mostrarFechadas, setMostrarFechadas] = useState(false)
  const [buscaComanda, setBuscaComanda] = useState('')

  useEffect(() => {
    carregarComandasAbertas()
    carregarComandasFechadas()
    
    // Atualização automática a cada 3 segundos
    const interval = setInterval(() => {
      carregarComandasAbertas()
      if (mostrarFechadas) {
        carregarComandasFechadas()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [mostrarFechadas])

  const carregarComandasAbertas = async () => {
    try {
      const res = await fetch('/api/comandas?status=aberta')
      const data = await res.json()
      setComandasAbertas(data)
    } catch (error) {
      console.error('Erro ao carregar comandas:', error)
    }
  }

  const carregarComandasFechadas = async () => {
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const res = await fetch('/api/comandas?status=fechada', {
        cache: 'no-store',
      })
      const data = await res.json()
      
      // Filtrar apenas comandas de hoje
      const comandasHoje = data.filter((c: Comanda) => {
        const dataFechamento = new Date(c.dataAbertura)
        return dataFechamento >= hoje
      })
      
      // Ordenar por mais recente
      comandasHoje.sort((a: Comanda, b: Comanda) => 
        new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime()
      )
      
      setComandasFechadas(comandasHoje.slice(0, 10)) // Últimas 10
    } catch (error) {
      console.error('Erro ao carregar comandas fechadas:', error)
    }
  }

  const abrirComanda = async (clienteId: number) => {
    setLoading(true)
    try {
      const res = await fetch('/api/comandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          garcomId: usuario?.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      const comanda = await res.json()

      toast({
        title: '✅ Comanda aberta',
        description: `Comanda #${comanda.id} para ${comanda.cliente.nome}`,
      })

      carregarComandasAbertas()
      setView('comandas')
    } catch (error: any) {
      toast({
        title: '❌ Erro',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const selecionarComanda = async (comanda: Comanda) => {
    const res = await fetch(`/api/comandas/${comanda.id}`)
    const data = await res.json()
    setComandaSelecionada(data)
    setView('detalhes')
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark pb-20">
      <header className="glass-dark border-b border-primary/20 p-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold gold-text">Absolut Poker</h1>
            <p className="text-xs text-muted-foreground">Garçom: {usuario?.nome}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {view === 'comandas' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold gold-text">Comandas Abertas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {comandasAbertas.length} {comandasAbertas.length === 1 ? 'comanda aberta' : 'comandas abertas'}
              </p>
            </div>
            <button
              onClick={() => setView('nova-comanda')}
              className="btn-poker-primary px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova
            </button>
          </div>

          {/* Campo de Busca */}
          {comandasAbertas.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar jogador..."
                value={buscaComanda}
                onChange={(e) => setBuscaComanda(e.target.value)}
                className="pl-10 bg-poker-green-dark/50 border-primary/20 focus:border-primary"
              />
              {buscaComanda && (
                <button
                  onClick={() => setBuscaComanda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {comandasAbertas.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhuma comanda aberta</p>
              <button
                onClick={() => setView('nova-comanda')}
                className="mt-4 btn-poker-primary px-6 py-3 rounded-xl"
              >
                Abrir Primeira Comanda
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {comandasAbertas
                .filter((comanda) => 
                  comanda.cliente.nome.toLowerCase().includes(buscaComanda.toLowerCase())
                )
                .map((comanda) => (
                <motion.button
                  key={comanda.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selecionarComanda(comanda)}
                  className="poker-card p-4 text-left w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{comanda.cliente.nome}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatarData(comanda.dataAbertura)}
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary/20">
                    <span className="text-sm text-muted-foreground">
                      {comanda.itens?.length || 0} itens
                    </span>
                    <span className="text-xl font-bold gold-text">
                      R$ {comanda.valorTotal.toFixed(2)}
                    </span>
                  </div>
                </motion.button>
              ))}
              {comandasAbertas.filter((comanda) => 
                comanda.cliente.nome.toLowerCase().includes(buscaComanda.toLowerCase())
              ).length === 0 && buscaComanda && (
                <div className="poker-card p-8 text-center">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground">Nenhuma comanda encontrada para "{buscaComanda}"</p>
                  <button
                    onClick={() => setBuscaComanda('')}
                    className="mt-3 text-primary text-sm hover:underline"
                  >
                    Limpar busca
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Vendas Recentes */}
          <div className="mt-8">
            <button
              onClick={() => {
                setMostrarFechadas(!mostrarFechadas)
                if (!mostrarFechadas) {
                  carregarComandasFechadas()
                }
              }}
              className="w-full poker-card p-4 flex items-center justify-between"
            >
              <h3 className="font-bold text-lg gold-text">📊 Vendas Recentes (Hoje)</h3>
              <motion.div
                animate={{ rotate: mostrarFechadas ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-6 h-6 text-primary" />
              </motion.div>
            </button>

            {mostrarFechadas && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3"
              >
                {comandasFechadas.length === 0 ? (
                  <div className="poker-card p-8 text-center">
                    <Receipt className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">
                      Nenhuma venda hoje
                    </p>
                  </div>
                ) : (
                  comandasFechadas.map((comanda) => (
                    <motion.button
                      key={comanda.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selecionarComanda(comanda)}
                      className="poker-card p-4 opacity-75 hover:opacity-100 transition-opacity w-full text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold">{comanda.cliente.nome}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatarData(comanda.dataAbertura)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                            ✓ Fechada
                          </span>
                          <ChevronRight className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/20">
                        <span className="text-sm text-muted-foreground">
                          {comanda.itens?.length || 0} itens
                        </span>
                        <span className="text-lg font-bold text-green-400">
                          R$ {comanda.valorTotal.toFixed(2)}
                        </span>
                      </div>
                    </motion.button>
                  ))
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {view === 'nova-comanda' && (
        <NovaComandaView
          onVoltar={() => setView('comandas')}
          onAbrir={abrirComanda}
          loading={loading}
        />
      )}

      {view === 'detalhes' && comandaSelecionada && (
        <DetalhesComandaView
          comanda={comandaSelecionada}
          onVoltar={() => {
            setView('comandas')
            setComandaSelecionada(null)
            carregarComandasAbertas()
          }}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-dark border-t border-primary/20 p-3 z-40">
        <div className="flex justify-around max-w-md mx-auto">
          <Link href="/garcom" className="flex flex-col items-center gap-1 text-primary">
            <Receipt className="w-6 h-6" />
            <span className="text-xs font-medium">Comandas</span>
          </Link>
          <Link href="/garcom/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          <Link href="/garcom/perfil" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

function NovaComandaView({ onVoltar, onAbrir, loading }: any) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [showCadastro, setShowCadastro] = useState(false)
  const [novoCliente, setNovoCliente] = useState({ nome: '', cpf: '', telefone: '' })
  const [salvando, setSalvando] = useState(false)
  const { toast } = useToast()

  const carregarClientes = () => {
    setLoadingClientes(true)
    fetch('/api/clientes')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClientes(data)
        } else {
          setClientes([])
        }
      })
      .catch(err => {
        console.error('Erro ao carregar clientes:', err)
        setClientes([])
      })
      .finally(() => setLoadingClientes(false))
  }

  useEffect(() => {
    carregarClientes()
  }, [])

  const cadastrarCliente = async () => {
    if (!novoCliente.nome.trim()) {
      toast({
        title: '❌ Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive'
      })
      return
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente)
      })

      if (!res.ok) throw new Error('Erro ao cadastrar')

      const clienteCriado = await res.json()

      toast({
        title: '✅ Cliente cadastrado!',
        description: `${clienteCriado.nome} foi adicionado`
      })

      setNovoCliente({ nome: '', cpf: '', telefone: '' })
      setShowCadastro(false)
      carregarClientes()
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: 'Não foi possível cadastrar o cliente',
        variant: 'destructive'
      })
    } finally {
      setSalvando(false)
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf?.includes(search) ||
    c.telefone?.includes(search)
  )

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <button onClick={onVoltar} className="flex items-center gap-2 text-muted-foreground">
          <X className="w-5 h-5" />
          Voltar
        </button>
        <button
          onClick={() => setShowCadastro(!showCadastro)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Jogador
        </button>
      </div>

      <h2 className="text-lg font-bold gold-text">
        {showCadastro ? 'Cadastrar Novo Jogador' : 'Selecionar Jogador'}
      </h2>

      {showCadastro ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="poker-card p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome *</label>
              <Input
                placeholder="Nome do jogador"
                value={novoCliente.nome}
                onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">CPF</label>
              <Input
                placeholder="000.000.000-00"
                value={novoCliente.cpf}
                onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <Input
                placeholder="(00) 00000-0000"
                value={novoCliente.telefone}
                onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowCadastro(false)
                  setNovoCliente({ nome: '', cpf: '', telefone: '' })
                }}
                className="flex-1 py-3 rounded-lg border border-primary/30 hover:bg-primary/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={cadastrarCliente}
                disabled={salvando || !novoCliente.nome.trim()}
                className="flex-1 py-3 rounded-lg bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {salvando ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar jogador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loadingClientes ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-12 poker-card">
              <p className="text-muted-foreground">
                {search ? 'Nenhum jogador encontrado' : 'Nenhum jogador cadastrado'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {clientesFiltrados.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => onAbrir(cliente.id)}
                  disabled={loading}
                  className="w-full poker-card p-4 text-left hover:bg-primary/10 transition-all disabled:opacity-50"
                >
                  <p className="font-semibold">{cliente.nome}</p>
                  {cliente.cpf && <p className="text-sm text-muted-foreground">CPF: {cliente.cpf}</p>}
                  {cliente.telefone && <p className="text-sm text-muted-foreground">Tel: {cliente.telefone}</p>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ItemComandaCard({ item, comandaFechada, onRemover }: any) {
  const [removendo, setRemovendo] = useState(false)

  const handleRemover = async () => {
    setRemovendo(true)
    try {
      await onRemover()
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <div className="poker-card p-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <p className="font-medium">{item.produto.nome}</p>
          <p className="text-sm text-muted-foreground">
            {item.produto.unidadeMedida === 'kg' 
              ? `${item.quantidade}kg × R$ ${item.precoUnitario.toFixed(2)}/kg`
              : `${item.quantidade}x R$ ${item.precoUnitario.toFixed(2)}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-bold gold-text">R$ {item.subtotal.toFixed(2)}</p>
          {!comandaFechada && (
            <button
              onClick={handleRemover}
              disabled={removendo}
              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remover item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DetalhesComandaView({ comanda, onVoltar }: any) {
  const router = useRouter()
  const { toast } = useToast()
  const [excluindo, setExcluindo] = useState(false)
  const [garcomNome, setGarcomNome] = useState<string | null>(null)
  const comandaFechada = comanda.status === 'fechada'

  useEffect(() => {
    if (comanda.garcomId) {
      fetch(`/api/usuarios/${comanda.garcomId}`)
        .then(res => res.json())
        .then(data => setGarcomNome(data.nome))
        .catch(() => setGarcomNome('Não identificado'))
    }
  }, [comanda.garcomId])

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const excluirComanda = async () => {
    if (!confirm(`Tem certeza que deseja excluir a comanda #${comanda.id} de ${comanda.cliente.nome}?`)) {
      return
    }

    setExcluindo(true)
    try {
      const res = await fetch(`/api/comandas/${comanda.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast({
        title: '✅ Comanda excluída',
        description: `Comanda #${comanda.id} foi excluída com sucesso`,
      })

      onVoltar()
    } catch (error: any) {
      toast({
        title: '❌ Erro',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  const agruparPorData = () => {
    const grupos: any = {}
    comanda.itens.forEach((item: any) => {
      const data = new Date(item.dataHora).toLocaleDateString('pt-BR')
      if (!grupos[data]) grupos[data] = []
      grupos[data].push(item)
    })
    return grupos
  }

  const grupos = agruparPorData()

  const formatarFormaPagamento = (forma: string) => {
    const formas: any = {
      'dinheiro': '💵 Dinheiro',
      'pix': '📱 PIX',
      'cartao': '💳 Cartão',
      'debito': '💳 Débito',
      'credito': '💳 Crédito',
      'saldo': '💰 Saldo',
    }
    return formas[forma] || forma
  }

  return (
    <div className={comandaFechada ? "pb-20" : "pb-40"}>
      <div className="p-4 space-y-4">
        <button onClick={onVoltar} className="flex items-center gap-2 text-muted-foreground">
          <X className="w-5 h-5" />
          Voltar
        </button>

        <div className="glass-poker rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{comanda.cliente.nome}</h2>
              <p className="text-sm text-muted-foreground">
                Comanda #{comanda.id}
              </p>
            </div>
            {comandaFechada && (
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                ✓ Fechada
              </span>
            )}
          </div>
        </div>

        <div className="glass-poker rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-3xl font-bold gold-text">R$ {comanda.valorTotal.toFixed(2)}</p>
        </div>

        {/* Informações da Comanda */}
        <div className="glass-poker rounded-xl p-4 space-y-3">
          <h3 className="font-bold gold-text mb-3">📋 Informações</h3>
          
          <div className="flex items-center justify-between py-2 border-b border-primary/10">
            <span className="text-sm text-muted-foreground">Aberta em:</span>
            <span className="text-sm font-medium">{formatarData(comanda.dataAbertura)}</span>
          </div>

          {comanda.garcomId && (
            <div className="flex items-center justify-between py-2 border-b border-primary/10">
              <span className="text-sm text-muted-foreground">Aberta por:</span>
              <span className="text-sm font-medium">{garcomNome || 'Carregando...'}</span>
            </div>
          )}

          {comandaFechada && comanda.dataFechamento && (
            <div className="flex items-center justify-between py-2 border-b border-primary/10">
              <span className="text-sm text-muted-foreground">Fechada em:</span>
              <span className="text-sm font-medium">{formatarData(comanda.dataFechamento)}</span>
            </div>
          )}

          {comandaFechada && comanda.formaPagamento && (
            <div className="flex items-center justify-between py-2 border-b border-primary/10">
              <span className="text-sm text-muted-foreground">Forma de Pagamento:</span>
              <span className="text-sm font-medium">{formatarFormaPagamento(comanda.formaPagamento)}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Total de Itens:</span>
            <span className="text-sm font-medium">{comanda.itens?.length || 0}</span>
          </div>

          {comanda.observacao && (
            <div className="pt-2 border-t border-primary/10">
              <p className="text-sm text-muted-foreground mb-1">Observação:</p>
              <p className="text-sm">{comanda.observacao}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {Object.entries(grupos).map(([data, itens]: any) => (
            <div key={data} className="space-y-2">
              <h3 className="font-semibold gold-text">{data}</h3>
              {itens.map((item: any) => (
                <ItemComandaCard 
                  key={item.id} 
                  item={item} 
                  comandaFechada={comandaFechada}
                  onRemover={async () => {
                    if (confirm(`Deseja remover ${item.produto.nome} da comanda?`)) {
                      try {
                        const res = await fetch(`/api/comandas/${comanda.id}/itens/${item.id}`, {
                          method: 'DELETE',
                        })

                        if (!res.ok) {
                          const error = await res.json()
                          throw new Error(error.error)
                        }

                        toast({
                          title: '✅ Item removido',
                          description: `${item.produto.nome} foi removido da comanda`,
                        })

                        // Recarregar detalhes da comanda
                        const resComanda = await fetch(`/api/comandas/${comanda.id}`)
                        const dataComanda = await resComanda.json()
                        window.location.reload() // Força reload para atualizar a view
                      } catch (error: any) {
                        toast({
                          title: '❌ Erro',
                          description: error.message,
                          variant: 'destructive',
                        })
                      }
                    }
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {!comandaFechada && (
        <div className="fixed bottom-16 left-0 right-0 glass-dark border-t border-primary/20 p-4 space-y-3 z-30">
          <button
            onClick={() => router.push(`/garcom/comanda/${comanda.id}/adicionar`)}
            className="w-full btn-poker-primary h-12 text-lg font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Itens
          </button>
          <button
            onClick={() => router.push(`/garcom/comanda/${comanda.id}/fechar`)}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            Fechar Comanda
          </button>
          <button
            onClick={excluirComanda}
            disabled={excluindo}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            {excluindo ? 'Excluindo...' : 'Excluir Comanda'}
          </button>
        </div>
      )}
    </div>
  )
}
