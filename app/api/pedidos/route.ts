import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itens, clienteId, pago } = body

    // Calcular valor total
    const valorTotal = itens.reduce((sum: number, item: any) => sum + item.subtotal, 0)

    // Criar pedido com transaction
    const result = await prisma.$transaction(async (tx) => {
      // Criar pedido
      const pedido = await tx.pedido.create({
        data: {
          valorTotal,
          clienteId: clienteId || null,
          pago: pago || false,
        },
      })

      // Criar itens do pedido e atualizar estoque
      for (const item of itens) {
        // Criar item do pedido
        await tx.itemPedido.create({
          data: {
            pedidoId: pedido.id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.subtotal,
          },
        })

        // Atualizar estoque
        const produto = await tx.produto.findUnique({
          where: { id: item.produtoId },
        })

        if (produto) {
          await tx.produto.update({
            where: { id: item.produtoId },
            data: {
              estoqueAtual: produto.estoqueAtual - item.quantidade,
            },
          })

          // Registrar saída de estoque
          await tx.estoqueMovimentacao.create({
            data: {
              produtoId: item.produtoId,
              tipo: 'saida',
              quantidade: item.quantidade,
              observacao: `Pedido #${pedido.id}`,
            },
          })
        }
      }

      return pedido
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: {
        dataPedido: 'desc',
      },
      take: 50,
      include: {
        itens: {
          include: {
            produto: true,
          },
        },
      },
    })

    // Converter Decimal para Number
    const pedidosFormatados = pedidos.map(pedido => ({
      ...pedido,
      valorTotal: Number(pedido.valorTotal),
      itens: pedido.itens.map(item => ({
        ...item,
        precoUnitario: Number(item.precoUnitario),
        subtotal: Number(item.subtotal),
        produto: {
          ...item.produto,
          precoVenda: Number(item.produto.precoVenda),
          precoCusto: Number(item.produto.precoCusto),
        }
      }))
    }))

    return NextResponse.json(pedidosFormatados)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}
