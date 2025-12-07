import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { valor } = body
    const clienteId = parseInt(params.id)

    // Atualizar saldo do cliente (pagamento manual/ajuste)
    const clienteAtualizado = await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        saldo: {
          increment: parseFloat(valor)
        }
      }
    })

    return NextResponse.json(clienteAtualizado)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 })
  }
}
