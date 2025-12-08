'use client'

import { useState, useEffect } from 'react'
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  Server,
  Users,
  Package,
  ShoppingCart,
  LogOut
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface DBStats {
  usuarios: number
  produtos: number
  clientes: number
  comandas: number
  comandasAbertas: number
  comandasFechadas: number
  pedidos: number
  itensComanda: number
  movimentacoesEstoque: number
  totalVendas: { _sum: { valorTotal: number | null } }
}

export default function DeveloperPanel() {
  const [stats, setStats] = useState<DBStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [devToken] = useState('DEV_ABSOLUT_POKER_2025')
  const { toast } = useToast()
  const { usuario, logout, isDeveloper } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Verificar se é developer
    if (!isDeveloper) {
      console.log('❌ Usuário não é developer, redirecionando...')
      router.push('/login')
      return
    }

    console.log('✅ Developer autenticado, carregando stats...')
    loadStats()
    
    // Auto-refresh a cada 5 segundos
    const interval = setInterval(() => {
      loadStats()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [isDeveloper, router])

  async function loadStats() {
    try {
      const res = await fetch('/api/dev/database')
      
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error)
    }
  }

  async function handleClearDatabase() {
    if (!confirm('⚠️ ATENÇÃO! Isso vai DELETAR TODOS OS DADOS do banco de dados. Esta ação é IRREVERSÍVEL! Tem certeza?')) {
      return
    }

    if (!confirm('Confirme novamente: Realmente deseja apagar TODOS os dados?')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/dev/database?action=clear_all', {
        method: 'DELETE',
        headers: { 
          'Authorization': devToken 
        },
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: '✅ Banco Limpo!',
          description: data.message,
        })
        loadStats()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: '❌ Erro',
        description: error.message || 'Erro ao limpar banco',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleClearPedidos() {
    if (!confirm('⚠️ Isso vai DELETAR TODOS OS PEDIDOS. Tem certeza?')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/dev/database?action=clear_pedidos', {
        method: 'DELETE',
        headers: { 
          'Authorization': devToken 
        },
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: '✅ Pedidos Limpos!',
          description: data.message,
        })
        loadStats()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: '❌ Erro',
        description: error.message || 'Erro ao limpar pedidos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleResetDemo() {
    if (!confirm('Resetar banco para dados de demonstração?')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/dev/database?action=reset_demo', {
        method: 'POST',
        headers: { 
          'Authorization': devToken 
        },
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: '✅ Demo Resetado!',
          description: data.message,
        })
        setTimeout(() => loadStats(), 2000)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: '❌ Erro',
        description: error.message || 'Erro ao resetar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
  }

  // Mostrar loading enquanto verifica autenticação
  if (!usuario || !isDeveloper) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950 to-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-red-500">Developer Panel</h1>
              <p className="text-gray-400">Painel de Gerenciamento Avançado</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Warning Banner */}
        <Card className="border-yellow-500 bg-yellow-500/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <div>
                <CardTitle className="text-yellow-500">Área Restrita</CardTitle>
                <CardDescription>
                  Acesso exclusivo para desenvolvedores. Tenha cuidado com as operações realizadas aqui.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} title="Usuários" value={stats.usuarios} color="blue" />
            <StatCard icon={Users} title="Clientes" value={stats.clientes} color="green" />
            <StatCard icon={Package} title="Produtos" value={stats.produtos} color="purple" />
            <StatCard icon={ShoppingCart} title="Comandas" value={stats.comandas} color="orange" />
            <StatCard icon={Database} title="Comandas Abertas" value={stats.comandasAbertas} color="cyan" />
            <StatCard icon={Database} title="Comandas Fechadas" value={stats.comandasFechadas} color="teal" />
            <StatCard icon={BarChart3} title="Pedidos" value={stats.pedidos} color="pink" />
            <StatCard 
              icon={Server} 
              title="Total Vendas" 
              value={`R$ ${Number(stats.totalVendas?._sum?.valorTotal || 0).toFixed(2)}`} 
              color="gold" 
            />
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Management */}
          <Card className="border-red-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <Database className="w-5 h-5" />
                Gerenciamento do Banco
              </CardTitle>
              <CardDescription>Operações perigosas - Use com cuidado!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleClearDatabase}
                disabled={loading}
                variant="destructive"
                className="w-full gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Banco Completamente
              </Button>
              <Button
                onClick={handleClearPedidos}
                disabled={loading}
                className="w-full gap-2 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Apenas Pedidos
              </Button>
              <Button
                onClick={handleResetDemo}
                disabled={loading}
                className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
              >
                <RefreshCw className="w-4 h-4" />
                Resetar para Dados Demo
              </Button>
              <Button
                onClick={loadStats}
                disabled={loading}
                variant="outline"
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar Estatísticas
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Ambiente" value="Produção" />
              <InfoRow label="Banco de Dados" value="MySQL (Railway)" />
              <InfoRow label="Framework" value="Next.js 14" />
              <InfoRow label="ORM" value="Prisma" />
              <InfoRow label="Deploy" value="Vercel" />
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 Dica: Sempre faça backup antes de operações destrutivas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: any
  title: string
  value: number | string
  color: string
}

function StatCard({ icon: Icon, title, value, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    cyan: 'from-cyan-500 to-cyan-600',
    teal: 'from-teal-500 to-teal-600',
    pink: 'from-pink-500 to-pink-600',
    gold: 'from-yellow-500 to-yellow-600',
  }

  return (
    <Card className="relative overflow-hidden hover:scale-105 transition-transform">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-10`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <Icon className="w-8 h-8 opacity-50" />
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
