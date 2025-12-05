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

      // Se tem cliente e não foi pago à vista, registrar débito
      if (clienteId && !pago) {
        await tx.movimentacaoCliente.create({
          data: {
            clienteId,
            tipo: 'debito',
            valor: parseFloat(valorTotal.toString()),
            descricao: `Pedido #${pedido.id}`,
          },
        })

        // Atualizar saldo do cliente (negativo = deve)
        await tx.cliente.update({
          where: { id: clienteId },
          data: {
            saldo: {
              decrement: parseFloat(valorTotal.toString())
            }
          }
        })
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
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
        },
      },
    })

    return NextResponse.json(pedidos)
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}
