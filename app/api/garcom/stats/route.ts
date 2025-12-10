import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const garcomId = searchParams.get('garcomId')
    
    console.log('[API Stats Garçom] Request recebido para garcomId:', garcomId)
    
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const where: any = {
      dataAbertura: {
        gte: hoje,
      },
    }

    if (garcomId) {
      where.garcomId = parseInt(garcomId)
    }

    // Comandas de hoje
    const comandasHoje = await prisma.comanda.findMany({
      where,
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
        },
      },
      orderBy: {
        dataAbertura: 'desc',
      },
    })

    // Estatísticas
    const comandasAbertas = comandasHoje.filter(c => c.status === 'aberta').length
    const comandasFechadas = comandasHoje.filter(c => c.status === 'fechada').length
    
    const totalVendido = comandasHoje
      .filter(c => c.status === 'fechada')
      .reduce((sum, c) => sum + Number(c.valorTotal), 0)

    const totalItens = comandasHoje.reduce((sum, c) => sum + c.itens.length, 0)

    // Produtos mais vendidos hoje
    const produtosCount: any = {}
    comandasHoje.forEach(comanda => {
      comanda.itens.forEach(item => {
        const produtoNome = item.produto.nome
        if (!produtosCount[produtoNome]) {
          produtosCount[produtoNome] = 0
        }
        produtosCount[produtoNome] += item.quantidade
      })
    })

    const topProdutos = Object.entries(produtosCount)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 5)

    // Comandas formatadas
    const comandasFormatadas = comandasHoje.map(c => ({
      ...c,
      valorTotal: Number(c.valorTotal),
      itens: c.itens.map(i => ({
        ...i,
        precoUnitario: Number(i.precoUnitario),
        subtotal: Number(i.subtotal),
      })),
    }))

    const response = {
      stats: {
        comandasAbertas,
        comandasFechadas,
        totalVendido,
        totalItens,
      },
      topProdutos,
      comandas: comandasFormatadas,
    }

    console.log('[API Stats Garçom] Dados retornados:', response.stats, 'Top Produtos:', response.topProdutos.length)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
