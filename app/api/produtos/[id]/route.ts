import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// DELETE - Excluir produto
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const produtoId = parseInt(id)

    // Verificar se o produto existe
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: {
        _count: {
          select: {
            itensPedido: true,
            itensComanda: true,
          }
        }
      },
    })

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o produto tem dependências
    const temDependencias = produto._count.itensPedido > 0 || produto._count.itensComanda > 0

    if (temDependencias) {
      // Se tem dependências, apenas desativa
      await prisma.produto.update({
        where: { id: produtoId },
        data: { ativo: false },
      })

      return NextResponse.json({ 
        message: 'Produto desativado com sucesso (possui histórico de vendas)' 
      })
    }

    // Se não tem dependências, excluir movimentações de estoque primeiro
    await prisma.estoqueMovimentacao.deleteMany({
      where: { produtoId: produtoId }
    })

    // Agora pode excluir o produto
    await prisma.produto.delete({
      where: { id: produtoId },
    })

    return NextResponse.json({ message: 'Produto excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    return NextResponse.json(
      { error: 'Não foi possível excluir o produto' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const produtoId = parseInt(id)
    const body = await request.json()

    const produto = await prisma.produto.update({
      where: { id: produtoId },
      data: body,
    })

    return NextResponse.json(produto)
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    )
  }
}
