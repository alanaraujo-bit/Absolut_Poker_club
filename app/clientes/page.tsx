"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, DollarSign, AlertCircle, Check, X } from 'lucide-react'
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
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    telefone: '',
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
        setNovoCliente({ nome: '', telefone: '' })
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

  const clientesDevedores = clientes.filter(c => c.saldo < 0)
  const totalDevido = clientesDevedores.reduce((sum, c) => sum + Math.abs(c.saldo), 0)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 lg:ml-80 p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader 
            title="Clientes"
            description="Gerencie clientes e controle de pagamentos"
            icon={Users}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold gold-text mb-2">Clientes</h1>
            <p className="text-muted-foreground">Gerenciar clientes e contas correntes</p>
          </motion.div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Clientes
                  </CardTitle>
                  <Users className="h-5 w-5 text-absolut-gold" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{clientes.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Clientes Devedores
                  </CardTitle>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500">{clientesDevedores.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total a Receber
                  </CardTitle>
                  <DollarSign className="h-5 w-5 text-absolut-gold" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold gold-text">{formatCurrency(totalDevido)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Botão Adicionar Cliente */}
          <div className="mb-6">
            <Button onClick={() => setShowForm(!showForm)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              {showForm ? 'Cancelar' : 'Novo Cliente'}
            </Button>
          </div>

          {/* Formulário de Novo Cliente */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Cadastrar Novo Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCriarCliente} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome">Nome *</Label>
                        <Input
                          id="nome"
                          value={novoCliente.nome}
                          onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={novoCliente.telefone}
                          onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                          placeholder="(99) 99999-9999"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tabela de Clientes */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Clique em "Receber" para registrar pagamento</CardDescription>
            </CardHeader>
            <CardContent>
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
                        {cliente.saldo < 0 && (
                          pagamentoAberto === cliente.id ? (
                            <div className="flex items-center gap-2 justify-end">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Valor"
                                className="w-28"
                                value={valorPagamento}
                                onChange={(e) => setValorPagamento(e.target.value)}
                              />
                              <Button
                                size="sm"
                                onClick={() => handlePagar(cliente.id)}
                                disabled={!valorPagamento || loading}
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
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setPagamentoAberto(cliente.id)}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Receber
                            </Button>
                          )
                        )}
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
