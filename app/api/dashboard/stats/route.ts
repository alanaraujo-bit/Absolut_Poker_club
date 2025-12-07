import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Total vendido hoje (comandas fechadas)
    const comandasHoje = await prisma.comanda.findMany({
      where: {
        status: 'fechada',
        dataFechamento: {
          gte: hoje,
        },
      },
    })

    const totalVendidoHoje = comandasHoje.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    // Comandas abertas hoje (em andamento)
    const comandasAbertasHoje = await prisma.comanda.findMany({
      where: {
        status: 'aberta',
        dataAbertura: {
          gte: hoje,
        },
      },
    })

    const totalAbertasHoje = comandasAbertasHoje.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    // Total = Fechadas + Abertas
    const totalGeralHoje = totalVendidoHoje + totalAbertasHoje

    const totalPedidosHoje = comandasHoje.length + comandasAbertasHoje.length

    // Produto mais vendido (geral, de todas as comandas)
    const itensMaisVendidos = await prisma.itemComanda.groupBy({
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
      totalVendidoHoje: totalGeralHoje,
      totalPedidosHoje,
      produtoMaisVendido,
      estoquesBaixos,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
