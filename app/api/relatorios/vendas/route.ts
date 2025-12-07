import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Desabilita cache para esta rota
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay())

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    // Vendas de hoje (comandas fechadas)
    const comandasHoje = await prisma.comanda.findMany({
      where: {
        status: 'fechada',
        dataFechamento: { gte: hoje },
      },
    })

    const comandasAbertasHoje = await prisma.comanda.findMany({
      where: {
        status: 'aberta',
        dataAbertura: { gte: hoje },
      },
    })

    const vendasHoje = comandasHoje.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    ) + comandasAbertasHoje.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    // Vendas da semana
    const comandasSemana = await prisma.comanda.findMany({
      where: {
        status: 'fechada',
        dataFechamento: { gte: inicioSemana },
      },
    })

    const comandasAbertasSemana = await prisma.comanda.findMany({
      where: {
        status: 'aberta',
        dataAbertura: { gte: inicioSemana },
      },
    })

    const vendasSemana = comandasSemana.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    ) + comandasAbertasSemana.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    // Vendas do mês
    const comandasMes = await prisma.comanda.findMany({
      where: {
        status: 'fechada',
        dataFechamento: { gte: inicioMes },
      },
    })

    const comandasAbertasMes = await prisma.comanda.findMany({
      where: {
        status: 'aberta',
        dataAbertura: { gte: inicioMes },
      },
    })

    const vendasMes = comandasMes.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    ) + comandasAbertasMes.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    return NextResponse.json({
      hoje: vendasHoje,
      semana: vendasSemana,
      mes: vendasMes,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar relatório de vendas:', error)
    return NextResponse.json({ error: 'Erro ao buscar relatório' }, { status: 500 })
  }
}
