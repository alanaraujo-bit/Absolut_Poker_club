import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Desabilita cache para esta rota
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Usar timezone UTC-3 (horário de Brasília) para calcular corretamente
    const agora = new Date()
    const offsetBrasilia = -3 * 60 // UTC-3 em minutos
    const offsetLocal = agora.getTimezoneOffset()
    const diffMinutos = offsetBrasilia - offsetLocal
    
    const agoraBrasilia = new Date(agora.getTime() + diffMinutos * 60 * 1000)
    
    // Início do dia atual em Brasília
    const hoje = new Date(Date.UTC(
      agoraBrasilia.getFullYear(),
      agoraBrasilia.getMonth(),
      agoraBrasilia.getDate(),
      3, 0, 0 // 00:00 em Brasília = 03:00 UTC
    ))
    
    const amanha = new Date(hoje)
    amanha.setUTCDate(amanha.getUTCDate() + 1)

    // Início da semana (domingo)
    const diaSemana = agoraBrasilia.getDay()
    const inicioSemana = new Date(Date.UTC(
      agoraBrasilia.getFullYear(),
      agoraBrasilia.getMonth(),
      agoraBrasilia.getDate() - diaSemana,
      3, 0, 0
    ))
    const fimSemana = new Date(inicioSemana)
    fimSemana.setUTCDate(fimSemana.getUTCDate() + 7)

    // Início do mês
    const inicioMes = new Date(Date.UTC(
      agoraBrasilia.getFullYear(),
      agoraBrasilia.getMonth(),
      1,
      3, 0, 0
    ))
    const fimMes = new Date(Date.UTC(
      agoraBrasilia.getFullYear(),
      agoraBrasilia.getMonth() + 1,
      1,
      3, 0, 0
    ))

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

    // Log para debug
    console.log('Relatório de Vendas:', {
      dataHoraBrasilia: agoraBrasilia.toLocaleString('pt-BR'),
      hoje: hoje.toISOString(),
      amanha: amanha.toISOString(),
      comandasHoje: comandasHoje.length,
      vendasHoje,
      comandasSemana: comandasSemana.length,
      vendasSemana,
      comandasMes: comandasMes.length,
      vendasMes,
    })

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
