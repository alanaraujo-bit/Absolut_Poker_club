import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Remover item da comanda
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const comandaId = parseInt(id)
    const itemIdInt = parseInt(itemId)

    // Buscar o item
    const item = await prisma.itemComanda.findUnique({
      where: { id: itemIdInt },
      include: {
        comanda: true,
        produto: true,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    // Verificar se o item pertence à comanda
    if (item.comandaId !== comandaId) {
      return NextResponse.json({ error: 'Item não pertence a esta comanda' }, { status: 400 })
    }

    // Verificar se comanda está aberta
    if (item.comanda.status !== 'aberta') {
      return NextResponse.json({ error: 'Não é possível remover itens de uma comanda fechada' }, { status: 400 })
    }

    const subtotal = Number(item.subtotal)
    const quantidade = Number(item.quantidade)

    // Remover o item
    await prisma.itemComanda.delete({
      where: { id: itemIdInt },
    })

    // Atualizar valor total da comanda
    const novoTotal = Number(item.comanda.valorTotal) - subtotal

    await prisma.comanda.update({
      where: { id: comandaId },
      data: {
        valorTotal: Math.max(0, novoTotal), // Garantir que não fique negativo
      },
    })

    // Devolver ao estoque apenas se o produto controlar estoque
    const produtoCompleto = item.produto as any
    if (produtoCompleto.estoqueAtual !== null) {
      await prisma.produto.update({
        where: { id: item.produtoId },
        data: {
          estoqueAtual: {
            increment: Math.ceil(quantidade),
          },
        },
      })

      // Registrar movimentação de estoque
      await prisma.estoqueMovimentacao.create({
        data: {
          produtoId: item.produtoId,
          tipo: 'entrada',
          quantidade: Math.ceil(quantidade),
          observacao: `Remoção de item da Comanda #${comandaId} - Qtd: ${quantidade}`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Item removido com sucesso',
      novoTotal: Math.max(0, novoTotal),
    })
  } catch (error) {
    console.error('Erro ao remover item:', error)
    return NextResponse.json({ error: 'Erro ao remover item' }, { status: 500 })
  }
}
