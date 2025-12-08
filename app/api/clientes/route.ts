import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Desabilita cache para esta rota
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    })
    
    // Converter Decimal para number
    const clientesFormatados = clientes.map(c => ({
      ...c,
      saldo: Number(c.saldo)
    }))
    
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
