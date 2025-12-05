import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { valor, descricao } = body
    const clienteId = parseInt(params.id)

    // Registrar pagamento (crédito)
    await prisma.$transaction([
      prisma.movimentacaoCliente.create({
        data: {
          clienteId,
          tipo: 'credito',
          valor: parseFloat(valor),
          descricao: descricao || 'Pagamento recebido'
        }
      }),
      prisma.cliente.update({
        where: { id: clienteId },
        data: {
          saldo: {
            increment: parseFloat(valor)
          }
        }
      })
    ])

    const clienteAtualizado = await prisma.cliente.findUnique({
      where: { id: clienteId }
    })

    return NextResponse.json(clienteAtualizado)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 })
  }
}
