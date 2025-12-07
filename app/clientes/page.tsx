"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, DollarSign, AlertCircle, Check, X, Edit } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'
import { useToast } from '@/components/ui/use-toast'

interface Cliente {
  id: number
  nome: string
  telefone: string | null
  cpf?: string | null
  saldo: number
  ativo: boolean
  _count?: {
    pedidos: number
  }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    telefone: '',
    cpf: '',
  })
  const [pagamentoAberto, setPagamentoAberto] = useState<number | null>(null)
  const [valorPagamento, setValorPagamento] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchClientes()
  }, [])

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

  async function handleCriarCliente(e: React.FormEvent) {
    e.preventDefault()
    if (!novoCliente.nome.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente),
      })

      if (res.ok) {
        toast({
          title: "Cliente cadastrado!",
          description: `${novoCliente.nome} foi adicionado com sucesso.`,
        })
        setNovoCliente({ nome: '', telefone: '', cpf: '' })
        setShowForm(false)
        fetchClientes()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o cliente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handlePagar(clienteId: number) {
    if (!valorPagamento) return

    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/${clienteId}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          valor: parseFloat(valorPagamento),
          descricao: 'Pagamento recebido'
        }),
      })

      if (res.ok) {
        toast({
          title: "Pagamento registrado!",
          description: `Valor de ${formatCurrency(parseFloat(valorPagamento))} recebido.`,
        })
        setValorPagamento('')
        setPagamentoAberto(null)
        fetchClientes()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleEditarCliente(e: React.FormEvent) {
    e.preventDefault()
    if (!editando || !editando.nome.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editando.nome,
          telefone: editando.telefone || null,
          cpf: editando.cpf || null,
        }),
      })

      if (res.ok) {
        toast({
          title: "Cliente atualizado!",
          description: `${editando.nome} foi atualizado com sucesso.`,
        })
        setEditando(null)
        fetchClientes()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function abrirEdicao(cliente: Cliente) {
    setEditando({ ...cliente })
    setShowForm(false)
    setPagamentoAberto(null)
  }

  const clientesDevedores = clientes.filter(c => c.saldo < 0)
  const totalDevido = clientesDevedores.reduce((sum, c) => sum + Math.abs(c.saldo), 0)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 lg:ml-72 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <PageHeader 
            title="Clientes"
            description="Gerencie clientes e controle de pagamentos"
            icon={Users}
          />

          {/* Cards de Resumo - Mobile optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            <Card className="poker-card">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Total de Clientes
                  </CardTitle>
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl md:text-3xl font-bold gold-text">{clientes.length}</div>
              </CardContent>
            </Card>

            <Card className="poker-card">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Clientes Devedores
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl md:text-3xl font-bold text-orange-500">{clientesDevedores.length}</div>
              </CardContent>
            </Card>

            <Card className="poker-card sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Total a Receber
                  </CardTitle>
                  <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl md:text-3xl font-bold gold-text">{formatCurrency(totalDevido)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Botão Adicionar Cliente */}
          <div>
            <Button 
              onClick={() => setShowForm(!showForm)} 
              className="gap-2 btn-poker-primary w-full sm:w-auto"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              {showForm ? 'Cancelar' : 'Novo Cliente'}
            </Button>
          </div>

          {/* Formulário de Novo Cliente */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="poker-card">
                <CardHeader className="px-4 pt-4 pb-3">
                  <CardTitle className="text-base md:text-lg">Cadastrar Novo Cliente</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <form onSubmit={handleCriarCliente} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome" className="text-sm">Nome *</Label>
                        <Input
                          id="nome"
                          value={novoCliente.nome}
                          onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                          required
                          className="h-11"
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf" className="text-sm">CPF</Label>
                        <Input
                          id="cpf"
                          value={novoCliente.cpf}
                          onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone" className="text-sm">Telefone</Label>
                        <Input
                          id="telefone"
                          value={novoCliente.telefone}
                          onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                          placeholder="(99) 99999-9999"
                          className="h-11"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto btn-poker-primary">
                      {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Formulário de Edição */}
          {editando && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="poker-card border-primary/50">
                <CardHeader className="px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base md:text-lg">Editar Cliente</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditando(null)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <form onSubmit={handleEditarCliente} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-nome" className="text-sm">Nome *</Label>
                        <Input
                          id="edit-nome"
                          value={editando.nome}
                          onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                          required
                          className="h-11"
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-cpf" className="text-sm">CPF</Label>
                        <Input
                          id="edit-cpf"
                          value={editando.cpf || ''}
                          onChange={(e) => setEditando({ ...editando, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-telefone" className="text-sm">Telefone</Label>
                        <Input
                          id="edit-telefone"
                          value={editando.telefone || ''}
                          onChange={(e) => setEditando({ ...editando, telefone: e.target.value })}
                          placeholder="(99) 99999-9999"
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading} className="btn-poker-primary">
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setEditando(null)}
                        className="btn-poker-outline"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Lista de Clientes - Mobile Card Layout */}
          <Card className="poker-card">
            <CardHeader className="px-4 pt-4 pb-3">
              <CardTitle className="text-base md:text-lg">Lista de Clientes</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {clientes.length > 0 ? 'Toque em "Receber" para registrar pagamento' : 'Nenhum cliente cadastrado ainda'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 md:px-4 pb-4">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Pedidos</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => (
                      <TableRow key={cliente.id} className={cliente.saldo < 0 ? 'border-l-4 border-l-orange-500' : ''}>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell>{cliente.telefone || '-'}</TableCell>
                        <TableCell>{cliente._count?.pedidos || 0}</TableCell>
                        <TableCell className="text-right">
                          <span className={cliente.saldo < 0 ? 'text-orange-500 font-bold' : 'text-green-500'}>
                            {formatCurrency(Math.abs(cliente.saldo))}
                            {cliente.saldo < 0 && ' (deve)'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirEdicao(cliente)}
                              className="h-9"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {cliente.saldo < 0 && (
                              pagamentoAberto === cliente.id ? (
                                <>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Valor"
                                    className="w-28 h-9"
                                    value={valorPagamento}
                                    onChange={(e) => setValorPagamento(e.target.value)}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handlePagar(cliente.id)}
                                    disabled={!valorPagamento || loading}
                                    className="h-9"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setPagamentoAberto(null)
                                      setValorPagamento('')
                                    }}
                                    className="h-9"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => setPagamentoAberto(cliente.id)}
                                  className="h-9"
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Receber
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {clientes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum cliente cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {clientes.map((cliente) => (
                  <motion.div
                    key={cliente.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg glass-poker border transition-all ${
                      cliente.saldo < 0 
                        ? 'border-orange-500/50 bg-orange-500/5' 
                        : 'border-primary/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{cliente.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cliente.telefone || 'Sem telefone'} • {cliente._count?.pedidos || 0} pedidos
                        </p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <div className={`text-base font-bold ${cliente.saldo < 0 ? 'text-orange-500' : 'text-green-500'}`}>
                          {formatCurrency(Math.abs(cliente.saldo))}
                        </div>
                        {cliente.saldo < 0 && (
                          <span className="text-xs text-orange-500">deve</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-primary/20 space-y-2">
                      <Button
                        onClick={() => abrirEdicao(cliente)}
                        variant="outline"
                        className="w-full h-11 btn-poker-outline"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Informações
                      </Button>

                      {cliente.saldo < 0 && (
                        <>
                          {pagamentoAberto === cliente.id ? (
                            <div className="space-y-2">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Valor do pagamento"
                                className="w-full h-11"
                                value={valorPagamento}
                                onChange={(e) => setValorPagamento(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handlePagar(cliente.id)}
                                  disabled={!valorPagamento || loading}
                                  className="flex-1 h-11 btn-poker-primary"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  {loading ? 'Processando...' : 'Confirmar'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setPagamentoAberto(null)
                                    setValorPagamento('')
                                  }}
                                  className="h-11 btn-poker-outline"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setPagamentoAberto(cliente.id)}
                              className="w-full h-11 btn-poker-primary"
                            >
                              <DollarSign className="h-5 w-5 mr-2" />
                              Receber Pagamento
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {clientes.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground text-sm">Nenhum cliente cadastrado</p>
                    <p className="text-xs text-muted-foreground mt-1">Clique em "Novo Cliente" para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
