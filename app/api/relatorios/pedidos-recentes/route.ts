import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const comandas = await prisma.comanda.findMany({
      where: {
        status: 'fechada'
      },
      orderBy: {
        dataFechamento: 'desc',
      },
      take: 10,
      include: {
        cliente: {
          select: {
            nome: true
          }
        }
      }
    })

    return NextResponse.json(comandas)
  } catch (error) {
    console.error('Erro ao buscar comandas recentes:', error)
    return NextResponse.json({ error: 'Erro ao buscar comandas' }, { status: 500 })
  }
}
