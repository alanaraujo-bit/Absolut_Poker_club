import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Total vendido hoje
    const pedidosHoje = await prisma.pedido.findMany({
      where: {
        dataPedido: {
          gte: hoje,
        },
      },
    })

    const totalVendidoHoje = pedidosHoje.reduce(
      (sum, pedido) => sum + Number(pedido.valorTotal),
      0
    )

    const totalPedidosHoje = pedidosHoje.length

    // Produto mais vendido (geral)
    const itensMaisVendidos = await prisma.itemPedido.groupBy({
      by: ['produtoId'],
      _sum: {
        quantidade: true,
      },
      orderBy: {
        _sum: {
          quantidade: 'desc',
        },
      },
      take: 1,
    })

    let produtoMaisVendido = '-'
    if (itensMaisVendidos.length > 0) {
      const produto = await prisma.produto.findUnique({
        where: { id: itensMaisVendidos[0].produtoId },
      })
      produtoMaisVendido = produto?.nome || '-'
    }

    // Estoques baixos
    const estoquesBaixos = await prisma.produto.count({
      where: {
        ativo: true,
        estoqueAtual: {
          lte: prisma.produto.fields.estoqueMinimo,
        },
      },
    })

    return NextResponse.json({
      totalVendidoHoje,
      totalPedidosHoje,
      produtoMaisVendido,
      estoquesBaixos,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
