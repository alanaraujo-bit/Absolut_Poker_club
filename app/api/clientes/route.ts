import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    })
    
    return NextResponse.json(clientes)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, telefone, cpf } = body

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        telefone: telefone || null,
        cpf: cpf || null
      }
    })

    return NextResponse.json(cliente)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
