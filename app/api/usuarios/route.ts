import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os usuários
export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        username: true,
        tipo: true,
        ativo: true,
        createdAt: true,
      },
      orderBy: {
        nome: 'asc',
      },
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}

// POST - Criar novo usuário
export async function POST(request: Request) {
  try {
    const { nome, username, senha, tipo } = await request.json()

    if (!nome || !username || !senha || !tipo) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (tipo !== 'admin' && tipo !== 'garcom') {
      return NextResponse.json(
        { error: 'Tipo deve ser "admin" ou "garcom"' },
        { status: 400 }
      )
    }

    // Verificar se username já existe
    const existente = await prisma.usuario.findUnique({
      where: { username },
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Username já está em uso' },
        { status: 409 }
      )
    }

    // Hash da senha (em produção, use bcrypt)
    const senhaHash = Buffer.from(senha).toString('base64')

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        username,
        senha: senhaHash,
        tipo,
      },
      select: {
        id: true,
        nome: true,
        username: true,
        tipo: true,
        ativo: true,
        createdAt: true,
      },
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
