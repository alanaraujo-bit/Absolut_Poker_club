import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'mes' // hoje, semana, mes, todos
    
    let dataInicio: Date
    const dataFim = new Date()
    
    switch (periodo) {
      case 'hoje':
        dataInicio = new Date()
        dataInicio.setHours(0, 0, 0, 0)
        break
      case 'semana':
        dataInicio = new Date()
        dataInicio.setDate(dataInicio.getDate() - 7)
        break
      case 'mes':
        dataInicio = new Date()
        dataInicio.setMonth(dataInicio.getMonth() - 1)
        break
      default:
        dataInicio = new Date(0) // Todos os registros
    }

    // Buscar informações do cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
      include: {
        comandas: {
          where: {
            dataFechamento: {
              gte: dataInicio,
              lte: dataFim
            }
          },
          include: {
            itens: {
              include: {
                produto: true
              }
            }
          },
          orderBy: {
            dataFechamento: 'desc'
          }
        }
      }
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Calcular estatísticas
    const totalComandas = cliente.comandas.length
    const totalGasto = cliente.comandas.reduce((sum, c) => sum + Number(c.valorTotal), 0)
    const ticketMedio = totalComandas > 0 ? totalGasto / totalComandas : 0

    // Produtos mais comprados
    const produtosMap = new Map<string, { nome: string; quantidade: number; total: number }>()
    
    cliente.comandas.forEach(comanda => {
      comanda.itens.forEach(item => {
        const key = item.produto.nome
        if (produtosMap.has(key)) {
          const existing = produtosMap.get(key)!
          existing.quantidade += Number(item.quantidade)
          existing.total += Number(item.subtotal)
        } else {
          produtosMap.set(key, {
            nome: item.produto.nome,
            quantidade: Number(item.quantidade),
            total: Number(item.subtotal)
          })
        }
      })
    })

    const produtosMaisComprados = Array.from(produtosMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Comandas por período
    const comandasPorDia = new Map<string, number>()
    cliente.comandas.forEach(comanda => {
      if (comanda.dataFechamento) {
        const dia = new Date(comanda.dataFechamento).toLocaleDateString('pt-BR')
        comandasPorDia.set(dia, (comandasPorDia.get(dia) || 0) + Number(comanda.valorTotal))
      }
    })

    const historicoComandas = Array.from(comandasPorDia.entries())
      .map(([data, total]) => ({ data, total }))
      .sort((a, b) => new Date(a.data.split('/').reverse().join('-')).getTime() - 
                       new Date(b.data.split('/').reverse().join('-')).getTime())

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        cpf: cliente.cpf,
        saldo: Number(cliente.saldo),
        ativo: cliente.ativo
      },
      periodo,
      estatisticas: {
        totalComandas,
        totalGasto,
        ticketMedio,
        saldoAtual: Number(cliente.saldo)
      },
      produtosMaisComprados,
      historicoComandas,
      comandasDetalhadas: cliente.comandas.map(comanda => ({
        id: comanda.id,
        dataAbertura: comanda.dataAbertura,
        dataFechamento: comanda.dataFechamento,
        valorTotal: Number(comanda.valorTotal),
        formaPagamento: comanda.formaPagamento,
        itens: comanda.itens.map(item => ({
          produto: item.produto.nome,
          quantidade: Number(item.quantidade),
          precoUnitario: Number(item.precoUnitario),
          subtotal: Number(item.subtotal)
        }))
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar relatório do cliente:', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}
