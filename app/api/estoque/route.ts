import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { produtoId, tipo, quantidade, observacao } = body

    // Atualizar estoque do produto
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
    })

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar se o produto controla estoque
    if (produto.estoqueAtual === null) {
      return NextResponse.json({ error: 'Este produto não controla estoque' }, { status: 400 })
    }

    const novoEstoque = tipo === 'entrada'
      ? produto.estoqueAtual + quantidade
      : produto.estoqueAtual - quantidade

    if (novoEstoque < 0) {
      return NextResponse.json({ error: 'Estoque insuficiente' }, { status: 400 })
    }

    // Atualizar produto
    await prisma.produto.update({
      where: { id: produtoId },
      data: {
        estoqueAtual: novoEstoque,
      },
    })

    // Registrar movimentação
    const movimentacao = await prisma.estoqueMovimentacao.create({
      data: {
        produtoId,
        tipo,
        quantidade,
        observacao,
      },
    })

    return NextResponse.json(movimentacao, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error)
    return NextResponse.json({ error: 'Erro ao registrar movimentação' }, { status: 500 })
  }
}
