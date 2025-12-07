'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [devMode, setDevMode] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Detectar se é login de desenvolvedor
      const isDeveloper = devMode || username.includes('@')
      const endpoint = isDeveloper ? '/api/dev/auth' : '/api/auth/login'
      const body = isDeveloper 
        ? { email: username, senha }
        : { username, senha }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao fazer login')
      }

      const data = await res.json()
      
      // Se for desenvolvedor, redirecionar para painel dev
      if (isDeveloper && data.devUser) {
        const devUserData = {
          ...data.devUser,
          tipo: 'developer' as const
        }
        
        console.log('💾 Salvando desenvolvedor...')
        login(devUserData)
        
        toast({
          title: '🔧 Acesso Desenvolvedor',
          description: `Bem-vindo, ${data.devUser.nome}!`,
        })
        
        console.log('🚀 Redirecionando para /developer...')
        router.push('/developer')
        return
      }
      
      // Usar o método login do contexto para usuários normais
      login(data.usuario)

      toast({
        title: '✅ Login realizado',
        description: `Bem-vindo, ${data.usuario.nome}!`,
      })

      // Redirecionar baseado no tipo
      if (data.usuario.tipo === 'garcom') {
        router.push('/garcom')
      } else {
        router.push('/')
      }
    } catch (error: any) {
      toast({
        title: '❌ Erro no login',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-poker-green to-poker-green-dark">
      {/* Padrão de fundo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 20 L50 20 L37.5 29 L42.5 44 L30 35 L17.5 44 L22.5 29 L10 20 L25 20 Z' fill='%23D4AF37'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px'
        }}/>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card de Login */}
        <div className="glass-poker neon-border-gold rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Logo/Ícone */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-poker-gold to-amber-600 flex items-center justify-center shadow-xl">
              <svg className="w-12 h-12 text-poker-green-dark" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.5 8.5L22 9.5L17 14.5L18.5 21L12 17.5L5.5 21L7 14.5L2 9.5L8.5 8.5L12 2Z"/>
              </svg>
            </div>
          </motion.div>

          {/* Título */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold gold-text mb-2">Absolute Poker</h1>
            <p className="text-poker-gold/70 text-sm">Sistema de Gerenciamento</p>
            {devMode && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-3 px-3 py-1.5 bg-poker-red/20 border border-poker-red/50 rounded-lg"
              >
                <p className="text-xs text-poker-red font-semibold flex items-center justify-center gap-2">
                  <span>🔧</span>
                  Modo Desenvolvedor Ativo
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="username" className="text-poker-gold/90 mb-2 block text-sm font-medium">
                {devMode ? 'E-mail Desenvolvedor' : 'Usuário'}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-poker-gold/50" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={devMode ? "seu-email@outlook.com" : "Digite seu usuário"}
                  className="pl-11 bg-poker-green/30 border-poker-gold/30 text-white placeholder:text-poker-gold/40 h-12 rounded-xl focus:border-poker-gold focus:ring-poker-gold/20"
                  required
                  autoFocus
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="senha" className="text-poker-gold/90 mb-2 block text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-poker-gold/50" />
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-11 bg-poker-green/30 border-poker-gold/30 text-white placeholder:text-poker-gold/40 h-12 rounded-xl focus:border-poker-gold focus:ring-poker-gold/20"
                  required
                />
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              type="submit"
              disabled={loading}
              className="w-full btn-poker-primary h-12 text-lg font-semibold rounded-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </motion.button>
          </form>

          {/* Credenciais padrão - apenas para desenvolvimento */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 pt-6 border-t border-poker-gold/20"
          >
            <p className="text-xs text-poker-gold/50 text-center">
              Usuário padrão: <span className="text-poker-gold/70 font-mono">admin</span> / Senha: <span className="text-poker-gold/70 font-mono">admin123</span>
            </p>
          </motion.div>

          {/* Botão Secreto de Desenvolvedor */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: devMode ? 1 : 0.3 }}
            transition={{ delay: 0.8 }}
            type="button"
            onClick={() => setDevMode(!devMode)}
            className="mt-4 w-full py-2 text-xs text-poker-gold/30 hover:text-poker-red transition-colors"
          >
            {devMode ? '🔧 Modo Desenvolvedor Ativo' : '• • •'}
          </motion.button>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 text-poker-gold/40 text-sm"
        >
          © 2024 Absolute Poker Club
        </motion.p>
      </motion.div>
    </div>
  )
}
