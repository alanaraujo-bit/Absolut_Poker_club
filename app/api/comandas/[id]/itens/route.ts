import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Adicionar item à comanda
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comandaId = parseInt(id)
    const { produtoId, quantidade } = await request.json()

    // Validar quantidade
    const qtd = typeof quantidade === 'string' ? parseFloat(quantidade) : quantidade
    if (isNaN(qtd) || qtd <= 0) {
      return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400 })
    }

    // Verificar se comanda está aberta
    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
    })

    if (!comanda) {
      return NextResponse.json({ error: 'Comanda não encontrada' }, { status: 404 })
    }

    if (comanda.status !== 'aberta') {
      return NextResponse.json({ error: 'Comanda já está fechada' }, { status: 400 })
    }

    // Buscar produto
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
    })

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const precoUnitario = Number(produto.precoVenda)
    const subtotal = precoUnitario * qtd

    // Adicionar item
    const item = await prisma.itemComanda.create({
      data: {
        comandaId,
        produtoId,
        quantidade: qtd,
        precoUnitario: produto.precoVenda,
        subtotal,
      },
      include: {
        produto: true,
      },
    })

    // Atualizar valor total da comanda
    const novoTotal = Number(comanda.valorTotal) + subtotal

    await prisma.comanda.update({
      where: { id: comandaId },
      data: {
        valorTotal: novoTotal,
      },
    })

    // Baixar estoque apenas se o produto controlar estoque
    const produtoCompleto = produto as any
    if (produtoCompleto.estoqueAtual !== null) {
      await prisma.produto.update({
        where: { id: produtoId },
        data: {
          estoqueAtual: {
            decrement: Math.ceil(qtd),
          },
        },
      })

      // Registrar movimentação de estoque
      await prisma.estoqueMovimentacao.create({
        data: {
          produtoId,
          tipo: 'saida',
          quantidade: Math.ceil(qtd),
          observacao: `Comanda #${comandaId} - Qtd: ${qtd}`,
        },
      })
    }

    return NextResponse.json({
      ...item,
      precoUnitario: Number(item.precoUnitario),
      subtotal: Number(item.subtotal),
      produto: {
        ...item.produto,
        precoVenda: Number(item.produto.precoVenda),
        precoCusto: Number(item.produto.precoCusto),
      },
    })
  } catch (error) {
    console.error('Erro ao adicionar item:', error)
    return NextResponse.json({ error: 'Erro ao adicionar item' }, { status: 500 })
  }
}
