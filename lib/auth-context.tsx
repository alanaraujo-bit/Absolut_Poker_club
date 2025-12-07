'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type Usuario = {
  id: number
  nome: string
  username?: string
  tipo: 'admin' | 'garcom' | 'developer'
  ativo?: boolean
  email?: string
}

type AuthContextType = {
  usuario: Usuario | null
  loading: boolean
  login: (usuario: Usuario) => void
  logout: () => void
  isAdmin: boolean
  isGarcom: boolean
  isDeveloper: boolean
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAdmin: false,
  isGarcom: false,
  isDeveloper: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Carregar usuário do localStorage (compatível com 'usuario' e 'user')
    const usuarioSalvo = localStorage.getItem('usuario') || localStorage.getItem('user')
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo))
      } catch (error) {
        console.error('Erro ao carregar usuário:', error)
        localStorage.removeItem('usuario')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Proteção de rotas
    if (!loading && pathname) {
      const rotasPublicas = ['/login']
      const isRotaPublica = rotasPublicas.some(rota => pathname.startsWith(rota))

      if (!usuario && !isRotaPublica) {
        // Não autenticado - redirecionar para login
        router.push('/login')
      } else if (usuario && pathname === '/login') {
        // Já autenticado - redirecionar para página correta
        if (usuario.tipo === 'developer') {
          router.push('/developer')
        } else if (usuario.tipo === 'garcom') {
          router.push('/garcom')
        } else {
          router.push('/')
        }
      } else if (usuario && usuario.tipo === 'garcom' && !pathname.startsWith('/garcom') && !isRotaPublica) {
        // Garçom tentando acessar área admin
        router.push('/garcom')
      } else if (usuario && usuario.tipo === 'developer' && !pathname.startsWith('/developer') && pathname !== '/') {
        // Developer só pode acessar /developer
        router.push('/developer')
      }
    }
  }, [usuario, loading, pathname, router])

  const login = (usuario: Usuario) => {
    setUsuario(usuario)
    localStorage.setItem('usuario', JSON.stringify(usuario))
    // Manter compatibilidade com sistema developer
    if (usuario.tipo === 'developer') {
      localStorage.setItem('user', JSON.stringify(usuario))
    }
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem('usuario')
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        login,
        logout,
        isAdmin: usuario?.tipo === 'admin',
        isGarcom: usuario?.tipo === 'garcom',
        isDeveloper: usuario?.tipo === 'developer',
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
