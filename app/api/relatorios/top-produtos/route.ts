import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Usar timezone UTC-3 (horário de Brasília)
    const agora = new Date()
    const offsetBrasilia = -3 * 60
    const offsetLocal = agora.getTimezoneOffset()
    const diffMinutos = offsetBrasilia - offsetLocal
    
    const agoraBrasilia = new Date(agora.getTime() + diffMinutos * 60 * 1000)
    
    // Início do mês em Brasília
    const inicioMes = new Date(Date.UTC(
      agoraBrasilia.getFullYear(),
      agoraBrasilia.getMonth(),
      1,
      3, 0, 0
    ))

    // Buscar itens de TODAS as comandas abertas no mês (abertas e fechadas)
    const itens = await prisma.itemComanda.findMany({
      where: {
        comanda: {
          dataAbertura: {
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
      const qtd = Number(item.quantidade)
      const subtotal = Number(item.subtotal)
      
      if (produtosMap.has(produtoId)) {
        const existing = produtosMap.get(produtoId)
        existing.quantidade += qtd
        existing.total += subtotal
      } else {
        produtosMap.set(produtoId, {
          nome: item.produto.nome,
          quantidade: qtd,
          total: subtotal,
        })
      }
    })

    // Converter para array e ordenar por valor total vendido
    const topProdutos = Array.from(produtosMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Log para debug
    console.log('Top Produtos:', {
      dataHoraBrasilia: agoraBrasilia.toLocaleString('pt-BR'),
      inicioMes: inicioMes.toISOString(),
      totalItens: itens.length,
      produtosUnicos: produtosMap.size,
      top5: topProdutos.slice(0, 5).map(p => ({ 
        nome: p.nome, 
        quantidade: p.quantidade,
        total: p.total 
      })),
    })

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
