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

    // Converter Decimal para number
    const produtosFormatados = produtos.map(p => ({
      ...p,
      precoVenda: Number(p.precoVenda),
      precoCusto: p.precoCusto ? Number(p.precoCusto) : null,
    }))

    return NextResponse.json(produtosFormatados)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, precoVenda, precoCusto, unidadeMedida, estoqueAtual, estoqueMinimo } = body

    const produto = await prisma.produto.create({
      data: {
        nome,
        precoVenda,
        precoCusto: precoCusto || null,
        unidadeMedida: unidadeMedida || 'unidade',
        estoqueAtual: estoqueAtual !== null ? estoqueAtual : null,
        estoqueMinimo: estoqueMinimo !== null ? estoqueMinimo : null,
      },
    })

    // Registrar entrada inicial de estoque se houver e não for produto sem controle
    if (estoqueAtual > 0 && estoqueAtual !== null) {
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
