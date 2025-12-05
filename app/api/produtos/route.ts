import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
      },
      orderBy: {
        nome: 'asc',
      },
    })

    return NextResponse.json(produtos)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, precoVenda, precoCusto, estoqueAtual, estoqueMinimo } = body

    const produto = await prisma.produto.create({
      data: {
        nome,
        precoVenda,
        precoCusto,
        estoqueAtual: estoqueAtual || 0,
        estoqueMinimo: estoqueMinimo || 10,
      },
    })

    // Registrar entrada inicial de estoque se houver
    if (estoqueAtual > 0) {
      await prisma.estoqueMovimentacao.create({
        data: {
          produtoId: produto.id,
          tipo: 'entrada',
          quantidade: estoqueAtual,
          observacao: 'Estoque inicial',
        },
      })
    }

    return NextResponse.json(produto, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}
