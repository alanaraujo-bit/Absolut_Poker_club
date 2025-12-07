'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type Usuario = {
  id: number
  nome: string
  username: string
  tipo: 'admin' | 'garcom'
  ativo: boolean
}

type AuthContextType = {
  usuario: Usuario | null
  loading: boolean
  login: (usuario: Usuario) => void
  logout: () => void
  isAdmin: boolean
  isGarcom: boolean
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAdmin: false,
  isGarcom: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Carregar usuário do localStorage
    const usuarioSalvo = localStorage.getItem('usuario')
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo))
      } catch (error) {
        console.error('Erro ao carregar usuário:', error)
        localStorage.removeItem('usuario')
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
        if (usuario.tipo === 'garcom') {
          router.push('/garcom')
        } else {
          router.push('/')
        }
      } else if (usuario && usuario.tipo === 'garcom' && !pathname.startsWith('/garcom') && !isRotaPublica) {
        // Garçom tentando acessar área admin
        router.push('/garcom')
      }
    }
  }, [usuario, loading, pathname, router])

  const login = (usuario: Usuario) => {
    setUsuario(usuario)
    localStorage.setItem('usuario', JSON.stringify(usuario))
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem('usuario')
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
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
