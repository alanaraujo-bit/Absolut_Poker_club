import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const garcomId = searchParams.get('garcomId')

    if (!garcomId) {
      return NextResponse.json({ error: 'ID do garçom é obrigatório' }, { status: 400 })
    }

    const garcomIdNum = parseInt(garcomId)

    // Total de comandas fechadas
    const totalComandas = await prisma.comanda.count({
      where: {
        garcomId: garcomIdNum,
        status: 'fechada'
      }
    })

    // Total vendido (soma de todas as comandas fechadas)
    const result = await prisma.comanda.aggregate({
      _sum: {
        valorTotal: true
      },
      where: {
        garcomId: garcomIdNum,
        status: 'fechada'
      }
    })

    const totalVendido = Number(result._sum.valorTotal || 0)

    // Comandas de hoje (abertas e fechadas)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const comandasHoje = await prisma.comanda.count({
      where: {
        garcomId: garcomIdNum,
        dataAbertura: {
          gte: hoje
        }
      }
    })

    // Primeira comanda (para calcular dias trabalhados)
    const primeiraComanda = await prisma.comanda.findFirst({
      where: {
        garcomId: garcomIdNum
      },
      orderBy: {
        dataAbertura: 'asc'
      },
      select: {
        dataAbertura: true
      }
    })

    return NextResponse.json({
      totalComandas,
      totalVendido,
      comandasHoje,
      primeiraComanda: primeiraComanda?.dataAbertura || null
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas do perfil:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
