'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, UserCheck, UserX, Edit } from 'lucide-react'
import Sidebar from '@/components/sidebar'
import PageHeader from '@/components/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context'

type Usuario = {
  id: number
  nome: string
  username: string
  tipo: 'admin' | 'garcom'
  ativo: boolean
  updatedAt: string
  stats?: {
    totalComandas: number
    totalVendido: number
    comandasHoje: number
  }
}

export default function UsuariosPage() {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    username: '',
    senha: '',
    tipo: 'garcom' as 'admin' | 'garcom',
  })

  useEffect(() => {
    if (isAdmin) {
      carregarUsuarios()
    }
  }, [isAdmin])

  const carregarUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios', { cache: 'no-store' })
      const data = await res.json()
      setUsuarios(data)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const criarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast({
        title: '✅ Usuário criado',
        description: `${formData.nome} foi criado com sucesso`,
      })

      setShowModal(false)
      setFormData({ nome: '', username: '', senha: '', tipo: 'garcom' })
      carregarUsuarios()
    } catch (error: any) {
      toast({
        title: '❌ Erro',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const toggleAtivo = async (id: number, ativo: boolean) => {
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      })

      if (!res.ok) throw new Error('Erro ao atualizar')

      toast({
        title: '✅ Status atualizado',
        description: `Usuário ${!ativo ? 'ativado' : 'desativado'}`,
      })

      carregarUsuarios()
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: 'Erro ao atualizar usuário',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 lg:ml-72 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <PageHeader
              title="Usuários"
              description="Gerenciar usuários do sistema"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)}
              className="btn-poker-primary px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Novo Usuário</span>
            </motion.button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"/>
              <p className="mt-4 text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            <>
              {/* Desktop - Tabela */}
              <div className="hidden md:block">
                <div className="glass-poker rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-primary/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold gold-text">Nome</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold gold-text">Usuário</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold gold-text">Tipo</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold gold-text">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold gold-text">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario, i) => (
                        <motion.tr
                          key={usuario.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-t border-primary/10 hover:bg-primary/5"
                        >
                          <td className="px-6 py-4">{usuario.nome}</td>
                          <td className="px-6 py-4 font-mono text-sm">{usuario.username}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              usuario.tipo === 'admin' 
                                ? 'bg-purple-500/20 text-purple-400' 
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {usuario.tipo === 'admin' ? '👑 Admin' : '🍺 Garçom'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              usuario.ativo 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {usuario.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleAtivo(usuario.id, usuario.ativo)}
                              className={`p-2 rounded-lg transition-all ${
                                usuario.ativo
                                  ? 'hover:bg-red-500/20 text-red-400'
                                  : 'hover:bg-green-500/20 text-green-400'
                              }`}
                              title={usuario.ativo ? 'Desativar' : 'Ativar'}
                            >
                              {usuario.ativo ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile - Cards */}
              <div className="md:hidden space-y-3">
                {usuarios.map((usuario, i) => (
                  <motion.div
                    key={usuario.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="poker-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{usuario.nome}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{usuario.username}</p>
                      </div>
                      <button
                        onClick={() => toggleAtivo(usuario.id, usuario.ativo)}
                        className={`p-2 rounded-lg ${
                          usuario.ativo
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {usuario.ativo ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        usuario.tipo === 'admin' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {usuario.tipo === 'admin' ? '👑 Admin' : '🍺 Garçom'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        usuario.ativo 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal Novo Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-poker rounded-2xl p-6 w-full max-w-md neon-border-gold"
          >
            <h2 className="text-2xl font-bold gold-text mb-6">Novo Usuário</h2>
            
            <form onSubmit={criarUsuario} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="João Silva"
                  required
                />
              </div>

              <div>
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="joao.silva"
                  required
                />
              </div>

              <div>
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo de Usuário</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'admin' | 'garcom' })}
                  className="w-full h-10 px-3 rounded-lg bg-poker-green/30 border border-primary/30 text-foreground"
                >
                  <option value="garcom">🍺 Garçom</option>
                  <option value="admin">👑 Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFormData({ nome: '', username: '', senha: '', tipo: 'garcom' })
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-primary/30 hover:bg-primary/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-poker-primary px-4 py-3 rounded-xl"
                >
                  Criar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
