import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
      include: {
        comandas: {
          orderBy: { dataAbertura: 'desc' },
          take: 10,
          include: {
            itens: {
              include: {
                produto: true
              }
            }
          }
        }
      }
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome, telefone, cpf, ativo } = body

    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: {
        nome,
        telefone,
        cpf,
        ativo
      }
    })

    return NextResponse.json(cliente)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}
