import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay())

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    // Vendas de hoje
    const pedidosHoje = await prisma.pedido.findMany({
      where: {
        dataPedido: { gte: hoje },
      },
    })

    const vendasHoje = pedidosHoje.reduce(
      (sum, pedido) => sum + Number(pedido.valorTotal),
      0
    )

    // Vendas da semana
    const pedidosSemana = await prisma.pedido.findMany({
      where: {
        dataPedido: { gte: inicioSemana },
      },
    })

    const vendasSemana = pedidosSemana.reduce(
      (sum, pedido) => sum + Number(pedido.valorTotal),
      0
    )

    // Vendas do mês
    const pedidosMes = await prisma.pedido.findMany({
      where: {
        dataPedido: { gte: inicioMes },
      },
    })

    const vendasMes = pedidosMes.reduce(
      (sum, pedido) => sum + Number(pedido.valorTotal),
      0
    )

    return NextResponse.json({
      hoje: vendasHoje,
      semana: vendasSemana,
      mes: vendasMes,
    })
  } catch (error) {
    console.error('Erro ao buscar relatório de vendas:', error)
    return NextResponse.json({ error: 'Erro ao buscar relatório' }, { status: 500 })
  }
}
