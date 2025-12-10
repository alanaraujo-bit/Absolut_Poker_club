import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const garcomId = searchParams.get('garcomId')
    const periodo = searchParams.get('periodo') || 'hoje' // hoje, ontem, semana, mes

    if (!garcomId) {
      return NextResponse.json({ error: 'garcomId é obrigatório' }, { status: 400 })
    }

    const garcomIdInt = parseInt(garcomId)

    // Calcular datas baseado no período
    const agora = new Date()
    let dataInicio: Date
    let dataFim: Date = new Date()

    switch (periodo) {
      case 'ontem':
        dataInicio = new Date(agora)
        dataInicio.setDate(agora.getDate() - 1)
        dataInicio.setHours(0, 0, 0, 0)
        dataFim = new Date(agora)
        dataFim.setDate(agora.getDate() - 1)
        dataFim.setHours(23, 59, 59, 999)
        break

      case 'semana':
        dataInicio = new Date(agora)
        dataInicio.setDate(agora.getDate() - 7)
        dataInicio.setHours(0, 0, 0, 0)
        break

      case 'mes':
        dataInicio = new Date(agora)
        dataInicio.setDate(agora.getDate() - 30)
        dataInicio.setHours(0, 0, 0, 0)
        break

      case 'hoje':
      default:
        dataInicio = new Date(agora)
        dataInicio.setHours(0, 0, 0, 0)
        break
    }

    // Buscar comandas do período
    const comandas = await prisma.comanda.findMany({
      where: {
        garcomId: garcomIdInt,
        dataAbertura: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                precoVenda: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataAbertura: 'desc',
      },
    })

    // Estatísticas
    const totalComandas = comandas.length
    const comandasAbertas = comandas.filter(c => c.status === 'aberta').length
    const comandasFechadas = comandas.filter(c => c.status === 'fechada').length
    
    const totalVendido = comandas
      .filter(c => c.status === 'fechada')
      .reduce((sum, c) => sum + Number(c.valorTotal), 0)

    const totalItensVendidos = comandas
      .filter(c => c.status === 'fechada')
      .reduce((sum, c) => {
        return sum + c.itens.reduce((itemSum, item) => itemSum + Number(item.quantidade), 0)
      }, 0)

    // Produtos mais vendidos
    const produtosCount: { [key: string]: { quantidade: number; valor: number; nome: string } } = {}
    
    comandas.forEach(comanda => {
      if (comanda.status === 'fechada') {
        comanda.itens.forEach(item => {
          const key = item.produto.nome
          if (!produtosCount[key]) {
            produtosCount[key] = {
              nome: item.produto.nome,
              quantidade: 0,
              valor: 0,
            }
          }
          produtosCount[key].quantidade += Number(item.quantidade)
          produtosCount[key].valor += Number(item.subtotal)
        })
      }
    })

    const topProdutos = Object.values(produtosCount)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)

    // Vendas por dia (para gráfico)
    const vendasPorDia: { [key: string]: number } = {}
    
    comandas.forEach(comanda => {
      if (comanda.status === 'fechada') {
        const data = new Date(comanda.dataFechamento || comanda.dataAbertura)
        const dataKey = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        
        if (!vendasPorDia[dataKey]) {
          vendasPorDia[dataKey] = 0
        }
        vendasPorDia[dataKey] += Number(comanda.valorTotal)
      }
    })

    // Formas de pagamento
    const formasPagamento: { [key: string]: { count: number; valor: number } } = {}
    
    comandas.forEach(comanda => {
      if (comanda.status === 'fechada' && comanda.formaPagamento) {
        const forma = comanda.formaPagamento
        if (!formasPagamento[forma]) {
          formasPagamento[forma] = { count: 0, valor: 0 }
        }
        formasPagamento[forma].count++
        formasPagamento[forma].valor += Number(comanda.valorTotal)
      }
    })

    return NextResponse.json({
      periodo,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
      stats: {
        totalComandas,
        comandasAbertas,
        comandasFechadas,
        totalVendido,
        totalItensVendidos,
        ticketMedio: comandasFechadas > 0 ? totalVendido / comandasFechadas : 0,
      },
      topProdutos,
      vendasPorDia: Object.entries(vendasPorDia).map(([data, valor]) => ({ data, valor })),
      formasPagamento: Object.entries(formasPagamento).map(([forma, data]) => ({
        forma,
        count: data.count,
        valor: data.valor,
      })),
      comandas: comandas.map(c => ({
        id: c.id,
        cliente: c.cliente.nome,
        status: c.status,
        dataAbertura: c.dataAbertura,
        dataFechamento: c.dataFechamento,
        valorTotal: Number(c.valorTotal),
        formaPagamento: c.formaPagamento,
        itens: c.itens.length,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar dashboard do garçom:', error)
    return NextResponse.json({ error: 'Erro ao buscar dashboard' }, { status: 500 })
  }
}
