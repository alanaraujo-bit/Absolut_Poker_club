import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const garcomId = searchParams.get('garcomId')

    console.log('[API Perfil Garçom] Request recebido para garcomId:', garcomId)

    if (!garcomId) {
      console.log('[API Perfil Garçom] Erro: ID do garçom não fornecido')
      return NextResponse.json({ error: 'ID do garçom é obrigatório' }, { status: 400 })
    }

    const garcomIdNum = parseInt(garcomId)

    // Data de hoje
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Total de comandas (todas, independente do status)
    const totalComandas = await prisma.comanda.count({
      where: {
        garcomId: garcomIdNum
      }
    })

    // Total vendido (soma de todas as comandas fechadas - lifetime)
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

    const response = {
      totalComandas,
      totalVendido,
      comandasHoje,
      primeiraComanda: primeiraComanda?.dataAbertura || null
    }

    console.log('[API Perfil Garçom] Dados retornados:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar estatísticas do perfil:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
