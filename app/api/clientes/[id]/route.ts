import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        pedidos: {
          orderBy: { dataPedido: 'desc' },
          take: 10,
          include: {
            itens: {
              include: {
                produto: true
              }
            }
          }
        },
        movimentacoes: {
          orderBy: { dataMovimento: 'desc' },
          take: 20
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nome, telefone, ativo } = body

    const cliente = await prisma.cliente.update({
      where: { id: parseInt(params.id) },
      data: {
        nome,
        telefone,
        ativo
      }
    })

    return NextResponse.json(cliente)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}
