import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Desabilita cache para esta rota
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'hoje' // hoje, ontem, semana, mes
    
    console.log('🔄 API Dashboard Stats chamada:', new Date().toLocaleTimeString(), 'Período:', periodo)
    
    // Usar timezone UTC-3 (horário de Brasília)
    const agora = new Date()
    const offsetBrasilia = -3 * 60
    const offsetLocal = agora.getTimezoneOffset()
    const diffMinutos = offsetBrasilia - offsetLocal
    
    const agoraBrasilia = new Date(agora.getTime() + diffMinutos * 60 * 1000)
    
    // Início do dia HOJE em Brasília
    const inicioHoje = new Date(Date.UTC(
      agoraBrasilia.getFullYear(),
      agoraBrasilia.getMonth(),
      agoraBrasilia.getDate(),
      3, 0, 0
    ))

    // Início do dia ONTEM
    const inicioOntem = new Date(inicioHoje)
    inicioOntem.setDate(inicioOntem.getDate() - 1)

    // Início da SEMANA (domingo)
    const inicioSemana = new Date(inicioHoje)
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())

    // Início do MÊS
    const inicioMes = new Date(Date.UTC(
      agoraBrasilia.getFullYear(),
      agoraBrasilia.getMonth(),
      1,
      3, 0, 0
    ))

    // Definir período de análise baseado no filtro
    let inicioPeriodo: Date
    let fimPeriodo: Date = agora

    switch (periodo) {
      case 'ontem':
        inicioPeriodo = inicioOntem
        fimPeriodo = inicioHoje
        break
      case 'semana':
        inicioPeriodo = inicioSemana
        break
      case 'mes':
        inicioPeriodo = inicioMes
        break
      case 'hoje':
      default:
        inicioPeriodo = inicioHoje
        break
    }

    // ========== COMANDAS FECHADAS NO PERÍODO ==========
    // Usando dataFechamento - todas as comandas FECHADAS no período
    const comandasFechadas = await prisma.comanda.findMany({
      where: {
        status: 'fechada',
        dataFechamento: {
          gte: inicioPeriodo,
          ...(periodo === 'ontem' ? { lt: fimPeriodo } : {}),
        },
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
        },
      },
      orderBy: {
        dataFechamento: 'desc',
      },
    })

    const totalFechadas = comandasFechadas.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    // ========== COMANDAS ABERTAS NO PERÍODO ==========
    // Todas as comandas ABERTAS no período (independente se já foram fechadas)
    const comandasAbertas = await prisma.comanda.findMany({
      where: {
        dataAbertura: {
          gte: inicioPeriodo,
          ...(periodo === 'ontem' ? { lt: fimPeriodo } : {}),
        },
      },
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

    const totalAbertas = comandasAbertas.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    // ========== VENDAS POR HORA (últimas 24h para hoje, ou por dia para outros períodos) ==========
    const vendasPorHora: { hora: string; valor: number; comandas: number }[] = []
    
    if (periodo === 'hoje' || periodo === 'ontem') {
      // Por hora - usando dataFechamento para comandas fechadas
      for (let h = 0; h < 24; h++) {
        const horaStr = `${h.toString().padStart(2, '0')}:00`
        const comandasNaHora = comandasFechadas.filter(c => {
          if (!c.dataFechamento) return false
          const hora = new Date(c.dataFechamento).getHours()
          return hora === h
        })
        
        vendasPorHora.push({
          hora: horaStr,
          valor: comandasNaHora.reduce((sum, c) => sum + Number(c.valorTotal), 0),
          comandas: comandasNaHora.length,
        })
      }
    } else {
      // Por dia da semana ou do mês
      const dias = periodo === 'semana' ? 7 : 30
      for (let d = 0; d < dias; d++) {
        const dia = new Date(inicioPeriodo)
        dia.setDate(dia.getDate() + d)
        
        const inicioDia = new Date(dia)
        inicioDia.setHours(0, 0, 0, 0)
        const fimDia = new Date(dia)
        fimDia.setHours(23, 59, 59, 999)
        
        const comandasNoDia = comandasFechadas.filter(c => {
          if (!c.dataFechamento) return false
          const dataFechamento = new Date(c.dataFechamento)
          return dataFechamento >= inicioDia && dataFechamento <= fimDia
        })
        
        vendasPorHora.push({
          hora: dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          valor: comandasNoDia.reduce((sum, c) => sum + Number(c.valorTotal), 0),
          comandas: comandasNoDia.length,
        })
      }
    }

    // ========== TOP 10 PRODUTOS MAIS VENDIDOS ==========
    const produtosMap = new Map<number, { 
      nome: string
      quantidade: number
      valor: number
      categoria: string
      unidadeMedida: string
      precoVenda: number
    }>()
    
    const todosItens = [...comandasFechadas, ...comandasAbertas].flatMap(c => c.itens)
    
    todosItens.forEach(item => {
      const key = item.produtoId
      if (produtosMap.has(key)) {
        const existing = produtosMap.get(key)!
        existing.quantidade += Number(item.quantidade)
        existing.valor += Number(item.subtotal)
      } else {
        produtosMap.set(key, {
          nome: item.produto.nome,
          quantidade: Number(item.quantidade),
          valor: Number(item.subtotal),
          categoria: item.produto.categoria,
          unidadeMedida: item.produto.unidadeMedida,
          precoVenda: Number(item.produto.precoVenda),
        })
      }
    })

    const topProdutos = Array.from(produtosMap.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)

    // ========== VENDAS POR CATEGORIA ==========
    const vendasPorCategoria = new Map<string, number>()
    
    // Usar todos os produtos vendidos, não só o top 10
    Array.from(produtosMap.values()).forEach(produto => {
      const categoria = produto.categoria || 'Outros'
      vendasPorCategoria.set(
        categoria,
        (vendasPorCategoria.get(categoria) || 0) + produto.valor
      )
    })

    const categorias = Array.from(vendasPorCategoria.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)

    // ========== TICKET MÉDIO ==========
    const ticketMedio = comandasFechadas.length > 0 
      ? totalFechadas / comandasFechadas.length 
      : 0

    // ========== COMPARATIVO COM PERÍODO ANTERIOR ==========
    let inicioPeriodoAnterior: Date
    let fimPeriodoAnterior: Date

    switch (periodo) {
      case 'ontem':
        inicioPeriodoAnterior = new Date(inicioOntem)
        inicioPeriodoAnterior.setDate(inicioPeriodoAnterior.getDate() - 1)
        fimPeriodoAnterior = inicioOntem
        break
      case 'semana':
        inicioPeriodoAnterior = new Date(inicioSemana)
        inicioPeriodoAnterior.setDate(inicioPeriodoAnterior.getDate() - 7)
        fimPeriodoAnterior = inicioSemana
        break
      case 'mes':
        inicioPeriodoAnterior = new Date(inicioMes)
        inicioPeriodoAnterior.setMonth(inicioPeriodoAnterior.getMonth() - 1)
        fimPeriodoAnterior = inicioMes
        break
      case 'hoje':
      default:
        inicioPeriodoAnterior = inicioOntem
        fimPeriodoAnterior = inicioHoje
        break
    }

    const comandasPeriodoAnterior = await prisma.comanda.findMany({
      where: {
        status: 'fechada',
        dataFechamento: {
          gte: inicioPeriodoAnterior,
          lt: fimPeriodoAnterior,
        },
      },
    })

    const totalPeriodoAnterior = comandasPeriodoAnterior.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    const variacao = totalPeriodoAnterior > 0
      ? ((totalFechadas - totalPeriodoAnterior) / totalPeriodoAnterior) * 100
      : 0

    // ========== TOTAL MÊS ATUAL ==========
    const comandasMesAtual = await prisma.comanda.findMany({
      where: {
        status: 'fechada',
        dataFechamento: {
          gte: inicioMes,
        },
      },
    })

    const totalMesAtual = comandasMesAtual.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    // ========== ESTOQUES BAIXOS ==========
    const estoquesBaixos = await prisma.produto.count({
      where: {
        ativo: true,
        estoqueAtual: {
          not: null,
        },
        AND: [
          {
            estoqueAtual: {
              lte: prisma.produto.fields.estoqueMinimo,
            },
          },
          {
            estoqueMinimo: {
              not: null,
            },
          },
        ],
      },
    })

    // ========== ÚLTIMAS COMANDAS FECHADAS ==========
    const ultimasComandasFechadas = comandasFechadas.slice(0, 5).map(c => ({
      id: c.id,
      cliente: c.cliente.nome,
      valorTotal: Number(c.valorTotal),
      dataFechamento: c.dataFechamento,
      itens: c.itens.length,
    }))

    // ========== COMANDAS ABERTAS AGORA ==========
    const comandasAbertasAgora = await prisma.comanda.count({
      where: {
        status: 'aberta',
      },
    })

    const resultado = {
      periodo,
      
      // Totais do período
      totalFechadas,
      qtdFechadas: comandasFechadas.length,
      totalAbertas,
      qtdAbertas: comandasAbertas.length,
      
      // Métricas
      ticketMedio,
      comandasAbertasAgora,
      
      // Comparativo
      totalPeriodoAnterior,
      variacao,
      
      // Mês atual
      totalMesAtual,
      qtdMesAtual: comandasMesAtual.length,
      
      // Gráficos
      vendasPorHora,
      topProdutos,
      categorias,
      
      // Últimas comandas
      ultimasComandasFechadas,
      
      // Estoque
      estoquesBaixos,
    }
    
    console.log('📤 Retornando stats completas:', {
      periodo,
      totalFechadas,
      qtdFechadas: comandasFechadas.length,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
    })

    return NextResponse.json(resultado, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
