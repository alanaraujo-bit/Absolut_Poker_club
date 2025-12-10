import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Desabilita cache para esta rota
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Usar timezone local para calcular o início do dia corretamente
    const agoraLocal = new Date()
    const hoje = new Date(agoraLocal.getFullYear(), agoraLocal.getMonth(), agoraLocal.getDate())
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay())
    const fimSemana = new Date(inicioSemana)
    fimSemana.setDate(fimSemana.getDate() + 7)

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)

    // Vendas de hoje - buscar por dataAbertura (todas as comandas abertas hoje)
    const comandasHoje = await prisma.comanda.findMany({
      where: {
        dataAbertura: {
          gte: hoje,
          lt: amanha,
        },
      },
    })

    const vendasHoje = comandasHoje.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    // Vendas da semana - todas as comandas abertas esta semana
    const comandasSemana = await prisma.comanda.findMany({
      where: {
        dataAbertura: {
          gte: inicioSemana,
          lt: fimSemana,
        },
      },
    })

    const vendasSemana = comandasSemana.reduce(
      (sum, comanda) => sum + Number(comanda.valorTotal),
      0
    )

    // Vendas do mês - todas as comandas abertas este mês
    const comandasMes = await prisma.comanda.findMany({
      where: {
        dataAbertura: {
          gte: inicioMes,
          lt: fimMes,
        },
      },
    })

    const vendasMes = comandasMes.reduce(
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
