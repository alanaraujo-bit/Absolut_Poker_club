import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filtros
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const garcomId = searchParams.get('garcomId')
    const status = searchParams.get('status') // 'aberta', 'fechada', 'todas'
    const clienteId = searchParams.get('clienteId')
    
    console.log('========================================')
    console.log('Filtros recebidos na API:', {
      dataInicio,
      dataFim,
      garcomId,
      status,
      clienteId
    })
    console.log('Data/Hora servidor:', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
    
    // Construir filtros
    const where: any = {}
    
    // Filtro de data (ajustado para horário de Brasília UTC-3)
    if (dataInicio || dataFim) {
      where.dataAbertura = {}
      
      if (dataInicio) {
        // Criar data local no início do dia (00:00:00) e adicionar 3 horas para UTC
        const [ano, mes, dia] = dataInicio.split('-')
        const inicio = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 0, 0, 0)
        // Converter para UTC adicionando 3 horas (horário de Brasília é UTC-3)
        inicio.setHours(inicio.getHours() + 3)
        where.dataAbertura.gte = inicio
      }
      
      if (dataFim) {
        // Criar data local no final do dia (23:59:59) e adicionar 3 horas para UTC
        const [ano, mes, dia] = dataFim.split('-')
        const fim = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 23, 59, 59, 999)
        // Converter para UTC adicionando 3 horas (horário de Brasília é UTC-3)
        fim.setHours(fim.getHours() + 3)
        where.dataAbertura.lte = fim
      }
    }
    
    // Filtro de garçom
    if (garcomId && garcomId !== 'todos') {
      where.garcomId = parseInt(garcomId)
    }
    
    // Filtro de status
    if (status && status !== 'todas') {
      if (status === 'aberta') {
        where.dataFechamento = null
      } else if (status === 'fechada') {
        where.dataFechamento = { not: null }
      }
    }
    
    // Filtro de cliente
    if (clienteId && clienteId !== 'todos') {
      where.clienteId = parseInt(clienteId)
    }
    
    console.log('Filtros WHERE aplicados:', JSON.stringify(where, null, 2))
    if (where.dataAbertura) {
      if (where.dataAbertura.gte) {
        console.log('Data início (gte):', where.dataAbertura.gte.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
      }
      if (where.dataAbertura.lte) {
        console.log('Data fim (lte):', where.dataAbertura.lte.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
      }
    }
    console.log('========================================')
    
    // Buscar comandas
    const comandas = await prisma.comanda.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true
          }
        },
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true
              }
            }
          },
          orderBy: {
            dataHora: 'asc'
          }
        }
      },
      orderBy: {
        dataAbertura: 'desc'
      }
    })
    
    console.log(`Comandas encontradas: ${comandas.length}`)
    if (comandas.length > 0) {
      console.log('Primeira comanda:', {
        id: comandas[0].id,
        dataAbertura: comandas[0].dataAbertura,
        clienteId: comandas[0].clienteId,
        garcomId: comandas[0].garcomId
      })
    }
    
    // Buscar informações de garçom separadamente
    const garcomIds = Array.from(new Set(comandas.map(c => c.garcomId).filter(Boolean)))
    const garcons = await prisma.usuario.findMany({
      where: {
        id: { in: garcomIds as number[] }
      },
      select: {
        id: true,
        nome: true
      }
    })
    const garcomMapData = new Map(garcons.map(g => [g.id, g]))
    
    // Formatar dados
    const comandasFormatadas = comandas.map(comanda => ({
      id: comanda.id,
      dataAbertura: comanda.dataAbertura.toISOString(),
      dataFechamento: comanda.dataFechamento?.toISOString() || null,
      status: comanda.dataFechamento ? 'fechada' : 'aberta',
      valorTotal: Number(comanda.valorTotal),
      formaPagamento: comanda.formaPagamento,
      observacao: comanda.observacao,
      cliente: comanda.cliente,
      garcom: comanda.garcomId ? garcomMapData.get(comanda.garcomId) : null,
      itens: comanda.itens.map(item => ({
        id: item.id,
        quantidade: Number(item.quantidade),
        precoUnitario: Number(item.precoUnitario),
        subtotal: Number(item.subtotal),
        produto: item.produto,
        dataHora: item.dataHora.toISOString()
      })),
      totalItens: comanda.itens.length,
      quantidadeTotal: comanda.itens.reduce((sum, item) => sum + Number(item.quantidade), 0)
    }))
    
    // Estatísticas gerais
    const totalComandas = comandasFormatadas.length
    const comandasAbertas = comandasFormatadas.filter(c => c.status === 'aberta').length
    const comandasFechadas = comandasFormatadas.filter(c => c.status === 'fechada').length
    const valorTotal = comandasFormatadas.reduce((sum, c) => sum + c.valorTotal, 0)
    const valorMedio = totalComandas > 0 ? valorTotal / totalComandas : 0
    
    // Produtos mais vendidos no período
    const produtosMap = new Map<number, {
      id: number
      nome: string
      quantidade: number
      valorTotal: number
    }>()
    comandasFormatadas.forEach(comanda => {
      comanda.itens.forEach(item => {
        const produtoId = item.produto.id
        if (!produtosMap.has(produtoId)) {
          produtosMap.set(produtoId, {
            id: produtoId,
            nome: item.produto.nome,
            quantidade: 0,
            valorTotal: 0
          })
        }
        const produto = produtosMap.get(produtoId)!
        produto.quantidade += item.quantidade
        produto.valorTotal += item.subtotal
      })
    })
    
    const topProdutos = Array.from(produtosMap.values())
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 10)
    
    // Vendas por garçom
    const garcomVendasMap = new Map<number, {
      id: number
      nome: string
      comandas: number
      valorTotal: number
    }>()
    comandasFormatadas.forEach(comanda => {
      if (comanda.garcom) {
        const garcomId = comanda.garcom.id
        if (!garcomVendasMap.has(garcomId)) {
          garcomVendasMap.set(garcomId, {
            id: garcomId,
            nome: comanda.garcom.nome,
            comandas: 0,
            valorTotal: 0
          })
        }
        const garcom = garcomVendasMap.get(garcomId)!
        garcom.comandas += 1
        garcom.valorTotal += comanda.valorTotal
      }
    })
    
    const vendasPorGarcom = Array.from(garcomVendasMap.values())
      .sort((a, b) => b.valorTotal - a.valorTotal)
    
    // Vendas por dia
    const vendasPorDiaMap = new Map()
    comandasFormatadas.forEach(comanda => {
      const data = new Date(comanda.dataAbertura)
      const dataKey = data.toISOString().split('T')[0]
      
      if (!vendasPorDiaMap.has(dataKey)) {
        vendasPorDiaMap.set(dataKey, {
          data: dataKey,
          comandas: 0,
          valorTotal: 0
        })
      }
      
      const dia = vendasPorDiaMap.get(dataKey)
      dia.comandas += 1
      dia.valorTotal += comanda.valorTotal
    })
    
    const vendasPorDia = Array.from(vendasPorDiaMap.values())
      .sort((a, b) => a.data.localeCompare(b.data))
    
    console.log('Retornando resultado:', {
      totalComandas,
      comandasAbertas,
      comandasFechadas,
      valorTotal,
      topProdutos: topProdutos.length,
      vendasPorGarcom: vendasPorGarcom.length,
      vendasPorDia: vendasPorDia.length
    })
    
    return NextResponse.json({
      comandas: comandasFormatadas,
      estatisticas: {
        totalComandas,
        comandasAbertas,
        comandasFechadas,
        valorTotal,
        valorMedio
      },
      topProdutos,
      vendasPorGarcom,
      vendasPorDia
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar comandas detalhadas:', error)
    return NextResponse.json({ error: 'Erro ao buscar comandas' }, { status: 500 })
  }
}
