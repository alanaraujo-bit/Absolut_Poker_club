import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json()

    console.log('🔐 Tentativa de login DEV:', { email })

    // Buscar desenvolvedor
    const devUser = await prisma.devUser.findUnique({
      where: { email },
    })

    if (!devUser) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    if (!devUser.ativo) {
      return NextResponse.json(
        { error: 'Conta desativada' },
        { status: 403 }
      )
    }

    // Verificar senha (hash simples - em produção use bcrypt)
    const senhaHash = Buffer.from(senha).toString('base64')

    if (devUser.senha !== senhaHash) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Atualizar último login
    await prisma.devUser.update({
      where: { id: devUser.id },
      data: { lastLogin: new Date() },
    })

    console.log('✅ Login DEV bem-sucedido:', devUser.email)

    return NextResponse.json({
      devUser: {
        id: devUser.id,
        email: devUser.email,
        nome: devUser.nome,
        tipo: 'developer',
      },
      token: 'DEV_ABSOLUT_POKER_2025'
    })
  } catch (error) {
    console.error('❌ Erro no login DEV:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
