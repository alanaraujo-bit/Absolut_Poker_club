import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar comandas (abertas ou todas)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'aberta', 'fechada' ou null (todas)
    const clienteId = searchParams.get('clienteId')

    const where: any = {}
    if (status) where.status = status
    if (clienteId) where.clienteId = parseInt(clienteId)

    const comandas = await prisma.comanda.findMany({
      where,
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
          orderBy: {
            dataHora: 'desc',
          },
        },
      },
      orderBy: {
        dataAbertura: 'desc',
      },
    })

    // Converter Decimal para number
    const comandasFormatadas = comandas.map(c => ({
      ...c,
      valorTotal: Number(c.valorTotal),
      itens: c.itens.map(i => ({
        ...i,
        precoUnitario: Number(i.precoUnitario),
        subtotal: Number(i.subtotal),
        produto: {
          ...i.produto,
          precoVenda: Number(i.produto.precoVenda),
          precoCusto: Number(i.produto.precoCusto),
        },
      })),
    }))

    return NextResponse.json(comandasFormatadas)
  } catch (error) {
    console.error('Erro ao buscar comandas:', error)
    return NextResponse.json({ error: 'Erro ao buscar comandas' }, { status: 500 })
  }
}

// POST - Abrir nova comanda
export async function POST(request: Request) {
  try {
    const { clienteId, garcomId, observacao } = await request.json()

    // Verificar se já existe comanda aberta para este cliente
    const comandaAberta = await prisma.comanda.findFirst({
      where: {
        clienteId,
        status: 'aberta',
      },
    })

    if (comandaAberta) {
      return NextResponse.json(
        { error: 'Cliente já possui uma comanda aberta', comanda: comandaAberta },
        { status: 400 }
      )
    }

    const comanda = await prisma.comanda.create({
      data: {
        clienteId,
        garcomId,
        observacao,
        status: 'aberta',
        valorTotal: 0,
      },
      include: {
        cliente: true,
      },
    })

    return NextResponse.json({
      ...comanda,
      valorTotal: Number(comanda.valorTotal),
    })
  } catch (error) {
    console.error('Erro ao abrir comanda:', error)
    return NextResponse.json({ error: 'Erro ao abrir comanda' }, { status: 500 })
  }
}
