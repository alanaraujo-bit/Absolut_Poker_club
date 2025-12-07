import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Função simples de hash (em produção, use bcrypt)
function hashPassword(password: string): string {
  // Em produção, use: await bcrypt.hash(password, 10)
  // Por simplicidade, usando Buffer.from().toString('base64')
  return Buffer.from(password).toString('base64')
}

function verifyPassword(password: string, hash: string): boolean {
  return Buffer.from(password).toString('base64') === hash
}

// POST - Login
export async function POST(request: Request) {
  try {
    const { username, senha } = await request.json()

    console.log('🔐 Tentativa de login:', { username, senha })

    if (!username || !senha) {
      return NextResponse.json(
        { error: 'Username e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { username },
      select: {
        id: true,
        nome: true,
        username: true,
        senha: true,
        tipo: true,
        ativo: true,
      },
    })

    console.log('👤 Usuário encontrado:', usuario ? 'SIM' : 'NÃO')

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos' },
        { status: 401 }
      )
    }

    if (!usuario.ativo) {
      return NextResponse.json(
        { error: 'Usuário inativo' },
        { status: 403 }
      )
    }

    // Verificar senha
    const senhaHash = Buffer.from(senha).toString('base64')
    console.log('🔑 Senha digitada (hash):', senhaHash)
    console.log('🔑 Senha no banco (hash):', usuario.senha)
    console.log('✅ Senhas coincidem?', senhaHash === usuario.senha)

    if (!verifyPassword(senha, usuario.senha)) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos' },
        { status: 401 }
      )
    }

    // Retornar dados do usuário (sem a senha)
    const { senha: _, ...usuarioSemSenha } = usuario

    return NextResponse.json({
      success: true,
      usuario: usuarioSemSenha,
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
