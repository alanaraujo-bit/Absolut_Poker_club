import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Estornar pagamento parcial
// TODO: Funcionalidade será habilitada após regenerar Prisma Client (npx prisma generate)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; pagamentoId: string }> }
) {
  try {
    const { id, pagamentoId } = await params
    
    return NextResponse.json({ 
      error: 'Funcionalidade temporariamente desabilitada. Pare o servidor e execute: npx prisma generate' 
    }, { status: 503 })
  } catch (error) {
    console.error('Erro ao estornar pagamento:', error)
    return NextResponse.json({ error: 'Erro ao estornar pagamento' }, { status: 500 })
  }
}

