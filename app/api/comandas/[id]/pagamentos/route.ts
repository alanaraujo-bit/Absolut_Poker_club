import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar pagamentos parciais da comanda
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comandaId = parseInt(id)

    // TODO: Descomentar após regenerar Prisma Client
    // const pagamentos = await prisma.pagamentoParcial.findMany({
    //   where: { comandaId },
    //   orderBy: { dataPagamento: 'desc' },
    // })

    // return NextResponse.json(
    //   pagamentos.map(p => ({
    //     ...p,
    //     valor: Number(p.valor),
    //     itens: JSON.parse(p.itensJson),
    //   }))
    // )
    
    // Retorno temporário até regenerar Prisma
    return NextResponse.json([])
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error)
    return NextResponse.json({ error: 'Erro ao listar pagamentos' }, { status: 500 })
  }
}
