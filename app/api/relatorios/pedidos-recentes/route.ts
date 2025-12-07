import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    return NextResponse.json(comandas, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar comandas recentes:', error)
    return NextResponse.json({ error: 'Erro ao buscar comandas' }, { status: 500 })
  }
}
