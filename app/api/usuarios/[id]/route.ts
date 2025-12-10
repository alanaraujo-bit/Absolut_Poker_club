import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar usuário específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        username: true,
        tipo: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const { nome, username, senha, tipo, ativo } = await request.json()

    const data: any = {}
    
    if (nome) data.nome = nome
    if (username) data.username = username
    if (senha) data.senha = Buffer.from(senha).toString('base64')
    if (tipo) data.tipo = tipo
    if (typeof ativo === 'boolean') data.ativo = ativo

    const usuario = await prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        username: true,
        tipo: true,
        ativo: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}

// DELETE - Desativar usuário
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    await prisma.usuario.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao desativar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao desativar usuário' },
      { status: 500 }
    )
  }
}
