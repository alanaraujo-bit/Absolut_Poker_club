import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Fechar comanda
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const comandaId = parseInt(params.id)
    const { formaPagamento, observacao } = await request.json()

    // Verificar se comanda existe e está aberta
    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
    })

    if (!comanda) {
      return NextResponse.json({ error: 'Comanda não encontrada' }, { status: 404 })
    }

    if (comanda.status !== 'aberta') {
      return NextResponse.json({ error: 'Comanda já está fechada' }, { status: 400 })
    }

    // Fechar comanda
    const comandaFechada = await prisma.comanda.update({
      where: { id: comandaId },
      data: {
        status: 'fechada',
        dataFechamento: new Date(),
        formaPagamento,
        observacao: observacao || comanda.observacao,
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...comandaFechada,
      valorTotal: Number(comandaFechada.valorTotal),
      itens: comandaFechada.itens.map(i => ({
        ...i,
        precoUnitario: Number(i.precoUnitario),
        subtotal: Number(i.subtotal),
      })),
    })
  } catch (error) {
    console.error('Erro ao fechar comanda:', error)
    return NextResponse.json({ error: 'Erro ao fechar comanda' }, { status: 500 })
  }
}
