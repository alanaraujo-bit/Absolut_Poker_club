import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar comanda específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
          orderBy: {
            dataHora: 'asc',
          },
        },
      },
    })

    if (!comanda) {
      return NextResponse.json({ error: 'Comanda não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      ...comanda,
      valorTotal: Number(comanda.valorTotal),
      itens: comanda.itens.map(i => ({
        ...i,
        precoUnitario: Number(i.precoUnitario),
        subtotal: Number(i.subtotal),
        produto: {
          ...i.produto,
          precoVenda: Number(i.produto.precoVenda),
          precoCusto: Number(i.produto.precoCusto),
        },
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar comanda:', error)
    return NextResponse.json({ error: 'Erro ao buscar comanda' }, { status: 500 })
  }
}

// PUT - Atualizar comanda (observação, etc)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const { observacao } = await request.json()

    const comanda = await prisma.comanda.update({
      where: { id },
      data: { observacao },
    })

    return NextResponse.json({
      ...comanda,
      valorTotal: Number(comanda.valorTotal),
    })
  } catch (error) {
    console.error('Erro ao atualizar comanda:', error)
    return NextResponse.json({ error: 'Erro ao atualizar comanda' }, { status: 500 })
  }
}

// DELETE - Excluir comanda
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    // Verificar se a comanda existe
    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: { itens: true },
    })

    if (!comanda) {
      return NextResponse.json({ error: 'Comanda não encontrada' }, { status: 404 })
    }

    // Verificar se a comanda está fechada
    if (comanda.status === 'fechada') {
      return NextResponse.json(
        { error: 'Não é possível excluir uma comanda fechada' },
        { status: 400 }
      )
    }

    // Excluir itens da comanda primeiro (por causa da relação)
    await prisma.itemComanda.deleteMany({
      where: { comandaId: id },
    })

    // Excluir a comanda
    await prisma.comanda.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Comanda excluída com sucesso',
    })
  } catch (error) {
    console.error('Erro ao excluir comanda:', error)
    return NextResponse.json({ error: 'Erro ao excluir comanda' }, { status: 500 })
  }
}
