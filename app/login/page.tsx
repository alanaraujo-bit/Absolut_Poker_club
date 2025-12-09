'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, User, X, Trash2, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context'

type SavedLogin = {
  username: string
  nome: string
  tipo: string
  isDev?: boolean
  lastLogin: string
  senha?: string
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [savedLogins, setSavedLogins] = useState<SavedLogin[]>([])
  const [showSavedLogins, setShowSavedLogins] = useState(true)

  useEffect(() => {
    loadSavedLogins()
    // Limpa logins antigos sem senha na primeira carga
    const cleanOldLogins = () => {
      try {
        const saved = localStorage.getItem('savedLogins')
        if (saved) {
          const logins: SavedLogin[] = JSON.parse(saved)
          const validLogins = logins.filter(l => l.senha && l.senha.length > 0)
          if (validLogins.length !== logins.length) {
            localStorage.setItem('savedLogins', JSON.stringify(validLogins))
            setSavedLogins(validLogins)
            console.log('🧹 Limpeza: Removidos', logins.length - validLogins.length, 'logins sem senha')
          }
        }
      } catch (error) {
        console.error('Erro ao limpar logins:', error)
      }
    }
    cleanOldLogins()
  }, [])

  const loadSavedLogins = () => {
    try {
      const saved = localStorage.getItem('savedLogins')
      if (saved) {
        const logins = JSON.parse(saved)
        setSavedLogins(logins)
        setShowSavedLogins(logins.length > 0)
      }
    } catch (error) {
      console.error('Erro ao carregar logins salvos:', error)
    }
  }

  const saveLogin = (username: string, nome: string, tipo: string, isDev: boolean = false, senha: string = '') => {
    try {
      const saved = localStorage.getItem('savedLogins')
      let logins: SavedLogin[] = saved ? JSON.parse(saved) : []
      
      logins = logins.filter(l => l.username !== username)
      
      const encodedSenha = btoa(senha) // Encode senha em base64
      
      logins.unshift({
        username,
        nome,
        tipo,
        isDev,
        senha: encodedSenha,
        lastLogin: new Date().toISOString()
      })
      
      logins = logins.slice(0, 5)
      
      localStorage.setItem('savedLogins', JSON.stringify(logins))
      setSavedLogins(logins)
      
      console.log('💾 Login salvo:', { username, nome, tipo, temSenha: !!senha })
    } catch (error) {
      console.error('Erro ao salvar login:', error)
    }
  }

  const removeSavedLogin = (username: string) => {
    try {
      const saved = localStorage.getItem('savedLogins')
      if (saved) {
        let logins: SavedLogin[] = JSON.parse(saved)
        logins = logins.filter(l => l.username !== username)
        localStorage.setItem('savedLogins', JSON.stringify(logins))
        setSavedLogins(logins)
        
        toast({
          title: '🗑️ Login removido',
          description: 'Login salvo foi excluído',
        })
      }
    } catch (error) {
      console.error('Erro ao remover login:', error)
    }
  }

  const quickLogin = async (savedLogin: SavedLogin) => {
    console.log('🚀 Quick Login chamado:', savedLogin)
    
    // Se não tem senha salva, preenche o form
    if (!savedLogin.senha) {
      console.log('⚠️ Sem senha salva, redirecionando para formulário')
      setUsername(savedLogin.username)
      setDevMode(savedLogin.isDev || false)
      setShowSavedLogins(false)
      setTimeout(() => {
        document.getElementById('senha')?.focus()
      }, 100)
      return
    }

    console.log('🔐 Tentando login automático...')
    setLoading(true)
    try {
      const decodedSenha = atob(savedLogin.senha)
      const isDeveloper = savedLogin.isDev || savedLogin.username.includes('@')
      const endpoint = isDeveloper ? '/api/dev/auth' : '/api/auth/login'
      const body = isDeveloper 
        ? { email: savedLogin.username, senha: decodedSenha }
        : { username: savedLogin.username, senha: decodedSenha }

      console.log('📤 Enviando requisição:', { endpoint, username: savedLogin.username, temSenha: !!decodedSenha })

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      console.log('📥 Resposta recebida:', { status: res.status, ok: res.ok })

      if (!res.ok) {
        const error = await res.json()
        console.error('❌ Erro no login automático:', error)
        throw new Error(error.error || 'Erro ao fazer login')
      }

      const data = await res.json()
      console.log('✅ Login automático bem-sucedido:', data)
      
      if (isDeveloper && data.devUser) {
        const devUserData = {
          ...data.devUser,
          tipo: 'developer' as const
        }
        
        login(devUserData)
        
        toast({
          title: '🔧 Acesso Desenvolvedor',
          description: `Bem-vindo, ${data.devUser.nome}!`,
        })
        
        console.log('🚀 Redirecionando para /developer')
        router.push('/developer')
        return
      }
      
      login(data.usuario)

      toast({
        title: '✅ Login realizado',
        description: `Bem-vindo, ${data.usuario.nome}!`,
      })

      if (data.usuario.tipo === 'garcom') {
        console.log('🚀 Redirecionando para /garcom')
        router.push('/garcom')
      } else {
        console.log('🚀 Redirecionando para /')
        router.push('/')
      }
    } catch (error: any) {
      console.error('❌ Erro no quick login:', error)
      toast({
        title: '❌ Erro no login',
        description: 'Credenciais inválidas. Faça login novamente.',
        variant: 'destructive',
      })
      // Remove o login salvo inválido
      removeSavedLogin(savedLogin.username)
      setShowSavedLogins(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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
      
      if (isDeveloper && data.devUser) {
        const devUserData = {
          ...data.devUser,
          tipo: 'developer' as const
        }
        
        login(devUserData)
        saveLogin(username, data.devUser.nome, 'developer', true, senha)
        
        toast({
          title: '🔧 Acesso Desenvolvedor',
          description: `Bem-vindo, ${data.devUser.nome}!`,
        })
        
        router.push('/developer')
        return
      }
      
      login(data.usuario)
      saveLogin(username, data.usuario.nome, data.usuario.tipo, false, senha)

      toast({
        title: '✅ Login realizado',
        description: `Bem-vindo, ${data.usuario.nome}!`,
      })

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-poker-green via-poker-green-dark to-black relative overflow-hidden">
      {/* Efeitos de fundo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 20 L50 20 L37.5 29 L42.5 44 L30 35 L17.5 44 L22.5 29 L10 20 L25 20 Z' fill='%23D4AF37'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}/>
      </div>
      
      <div className="absolute top-20 left-20 w-64 h-64 bg-poker-gold/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="glass-poker rounded-3xl overflow-hidden shadow-2xl border border-poker-gold/30">
          {/* Header Compacto */}
          <div className="relative bg-gradient-to-r from-poker-gold/5 to-amber-600/5 px-6 py-5 border-b border-poker-gold/10">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-poker-gold to-amber-600 flex items-center justify-center shadow-lg"
              >
                <svg className="w-7 h-7 text-poker-green-dark" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.5 8.5L22 9.5L17 14.5L18.5 21L12 17.5L5.5 21L7 14.5L2 9.5L8.5 8.5L12 2Z"/>
                </svg>
              </motion.div>
              <div className="flex-1">
                <h1 className="text-xl font-bold gold-text">Absolute Poker</h1>
                <p className="text-[10px] text-poker-gold/50">Sistema de Gerenciamento</p>
              </div>
              {devMode && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-1 bg-poker-red/20 border border-poker-red/40 rounded-md"
                >
                  <p className="text-[9px] text-poker-red font-bold">🔧 DEV</p>
                </motion.div>
              )}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {showSavedLogins && savedLogins.length > 0 ? (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-poker-gold/70">Acesso Rápido</p>
                    <button
                      type="button"
                      onClick={() => setShowSavedLogins(false)}
                      className="text-[10px] text-poker-gold/40 hover:text-poker-gold flex items-center gap-1 transition-colors"
                    >
                      Outro <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                    {savedLogins.map((saved, index) => (
                      <motion.div
                        key={saved.username}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="group relative"
                      >
                        <button
                          type="button"
                          onClick={() => quickLogin(saved)}
                          disabled={loading}
                          className="w-full flex items-center gap-3 p-3 bg-poker-green/10 border border-poker-gold/20 rounded-2xl hover:bg-poker-green/20 hover:border-poker-gold/40 hover:shadow-lg hover:shadow-poker-gold/5 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-poker-gold to-amber-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform relative">
                            <span className="text-poker-green-dark font-bold">
                              {saved.nome.charAt(0).toUpperCase()}
                            </span>
                            {saved.senha && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-poker-green-dark rounded-full" title="Login automático disponível"></div>
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{saved.nome}</p>
                            <p className="text-[10px] text-poker-gold/50 flex items-center gap-1">
                              {saved.isDev ? '🔧 Dev' : saved.tipo === 'garcom' ? '👔 Garçom' : '👤 User'}
                              {saved.senha && <span className="text-green-400">• Auto</span>}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-poker-gold/30 group-hover:text-poker-gold group-hover:translate-x-1 transition-all" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSavedLogin(saved.username)
                          }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  {savedLogins.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowSavedLogins(true)}
                      className="text-[11px] text-poker-gold/50 hover:text-poker-gold transition-colors mb-2"
                    >
                      ← Logins salvos
                    </button>
                  )}
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-poker-gold/80 text-[11px] font-medium">
                      {devMode ? 'E-mail' : 'Usuário'}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-poker-gold/30" />
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={devMode ? "email@example.com" : "Digite seu usuário"}
                        className="pl-10 h-11 bg-poker-green/10 border-poker-gold/20 text-white placeholder:text-poker-gold/20 rounded-xl focus:border-poker-gold focus:ring-2 focus:ring-poker-gold/10 transition-all text-sm"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="senha" className="text-poker-gold/80 text-[11px] font-medium">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-poker-gold/30" />
                      <Input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 h-11 bg-poker-green/10 border-poker-gold/20 text-white placeholder:text-poker-gold/20 rounded-xl focus:border-poker-gold focus:ring-2 focus:ring-poker-gold/10 transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-poker-gold via-amber-500 to-amber-600 hover:from-poker-gold/90 hover:via-amber-500/90 hover:to-amber-600/90 text-poker-green-dark h-11 text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-poker-gold/20 transition-all mt-5"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Entrando...
                      </span>
                    ) : (
                      'Entrar'
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="px-6 pb-4">
            <button
              type="button"
              onClick={() => setDevMode(!devMode)}
              className="w-full py-1.5 text-[9px] text-poker-gold/20 hover:text-poker-gold/50 transition-all"
            >
              {devMode ? '🔧 Dev Mode' : '• • •'}
            </button>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-4 text-poker-gold/20 text-[10px]"
        >
          © 2025 Absolute Poker Club
        </motion.p>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(212, 175, 55, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.5);
        }
      `}</style>
    </div>
  )
}
