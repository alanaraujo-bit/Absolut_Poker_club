import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ordenarPorPopularidade = searchParams.get('ordenarPorPopularidade') === 'true'

    if (ordenarPorPopularidade) {
      // Buscar produtos com contagem de itens de comanda
      const produtos = await prisma.produto.findMany({
        where: {
          ativo: true,
        },
        include: {
          _count: {
            select: {
              itensComanda: true
            }
          }
        }
      })

      // Ordenar por popularidade (mais pedidos primeiro)
      const produtosOrdenados = produtos.sort((a, b) => {
        return b._count.itensComanda - a._count.itensComanda
      })

      // Converter Decimal para number e formatar
      const produtosFormatados = produtosOrdenados.map(p => ({
        id: p.id,
        nome: p.nome,
        precoVenda: Number(p.precoVenda),
        precoCusto: p.precoCusto ? Number(p.precoCusto) : null,
        categoria: p.categoria,
        unidadeMedida: p.unidadeMedida,
        estoqueAtual: p.estoqueAtual,
        estoqueMinimo: p.estoqueMinimo,
        ativo: p.ativo,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        _quantidadePedidos: p._count.itensComanda
      }))

      return NextResponse.json(produtosFormatados)
    } else {
      // Ordenação padrão por nome
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
    }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, precoVenda, precoCusto, categoria, unidadeMedida, estoqueAtual, estoqueMinimo } = body

    const produto = await prisma.produto.create({
      data: {
        nome,
        precoVenda,
        precoCusto: precoCusto || null,
        categoria: categoria || 'Outros',
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
