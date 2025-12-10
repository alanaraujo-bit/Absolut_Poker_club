import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Desabilita cache para esta rota
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { ativo: true },
      include: {
        _count: {
          select: { comandas: true }
        },
        comandas: {
          take: 1,
          orderBy: { dataAbertura: 'desc' },
          select: { dataAbertura: true }
        }
      }
    })
    
    // Converter Decimal para number e ordenar
    const clientesFormatados = clientes
      .map(c => ({
        ...c,
        saldo: Number(c.saldo),
        ultimaComanda: c.comandas[0]?.dataAbertura || null
      }))
      .sort((a, b) => {
        // Primeiro: clientes com comandas
        const aTemComandas = a._count.comandas > 0
        const bTemComandas = b._count.comandas > 0
        
        if (aTemComandas && !bTemComandas) return -1
        if (!aTemComandas && bTemComandas) return 1
        
        // Segundo: entre os que têm comandas, ordenar por mais recente
        if (aTemComandas && bTemComandas) {
          if (a.ultimaComanda && b.ultimaComanda) {
            return new Date(b.ultimaComanda).getTime() - new Date(a.ultimaComanda).getTime()
          }
        }
        
        // Terceiro: ordem alfabética
        return a.nome.localeCompare(b.nome)
      })
    
    return NextResponse.json(clientesFormatados, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, telefone, cpf } = body

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: nome.trim(),
        telefone: telefone?.trim() || null,
        cpf: cpf?.trim() || null
      }
    })

    return NextResponse.json({
      ...cliente,
      saldo: Number(cliente.saldo)
    })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
