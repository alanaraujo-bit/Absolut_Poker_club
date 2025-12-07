import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    // Buscar itens de comandas fechadas do mês
    const itens = await prisma.itemComanda.findMany({
      where: {
        comanda: {
          status: 'fechada',
          dataFechamento: {
            gte: inicioMes,
          },
        },
      },
      include: {
        produto: true,
      },
    })

    // Agrupar por produto
    const produtosMap = new Map()

    itens.forEach((item) => {
      const produtoId = item.produtoId
      if (produtosMap.has(produtoId)) {
        const existing = produtosMap.get(produtoId)
        existing.quantidade += item.quantidade
        existing.total += Number(item.subtotal)
      } else {
        produtosMap.set(produtoId, {
          nome: item.produto.nome,
          quantidade: item.quantidade,
          total: Number(item.subtotal),
        })
      }
    })

    // Converter para array e ordenar
    const topProdutos = Array.from(produtosMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return NextResponse.json(topProdutos, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar top produtos:', error)
    return NextResponse.json({ error: 'Erro ao buscar top produtos' }, { status: 500 })
  }
}
