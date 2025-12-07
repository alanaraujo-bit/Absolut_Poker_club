import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Limpar todos os dados do banco
export async function DELETE(request: Request) {
  try {
    // Validar token do header
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== 'DEV_ABSOLUT_POKER_2025') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Pegar ação da URL
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'clear_all') {
      console.log('🗑️ Iniciando limpeza completa do banco...')

      // Deletar na ordem correta por causa das foreign keys
      await prisma.itemComanda.deleteMany()
      await prisma.comanda.deleteMany()
      await prisma.itemPedido.deleteMany()
      await prisma.pedido.deleteMany()
      await prisma.estoqueMovimentacao.deleteMany()
      await prisma.cliente.deleteMany()
      await prisma.produto.deleteMany()
      await prisma.usuario.deleteMany()
      // Não deletar devUsers

      console.log('✅ Banco limpo com sucesso!')

      return NextResponse.json({
        success: true,
        message: 'Todos os dados foram removidos. Banco resetado!',
      })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('❌ Erro no gerenciamento do banco:', error)
    return NextResponse.json(
      { error: 'Erro ao executar operação' },
      { status: 500 }
    )
  }
}

// Resetar com dados demo
export async function POST(request: Request) {
  try {
    // Validar token do header
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== 'DEV_ABSOLUT_POKER_2025') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Pegar ação da URL
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'reset_demo') {
      console.log('🔄 Resetando para dados demo...')

      // Limpar tudo
      await prisma.itemComanda.deleteMany()
      await prisma.comanda.deleteMany()
      await prisma.itemPedido.deleteMany()
      await prisma.pedido.deleteMany()
      await prisma.estoqueMovimentacao.deleteMany()
      await prisma.cliente.deleteMany()
      await prisma.produto.deleteMany()
      await prisma.usuario.deleteMany()

      // Criar usuários padrão
      await prisma.usuario.createMany({
        data: [
          {
            username: 'admin',
            senha: Buffer.from('admin123').toString('base64'),
            nome: 'Administrador',
            tipo: 'admin',
            ativo: true,
          },
          {
            username: 'garcom',
            senha: Buffer.from('garcom123').toString('base64'),
            nome: 'Garçom 1',
            tipo: 'garcom',
            ativo: true,
          },
        ],
      })

      console.log('✅ Banco resetado para demo!')

      return NextResponse.json({
        success: true,
        message: 'Banco resetado! Dados demo inseridos com sucesso.',
      })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('❌ Erro no gerenciamento do banco:', error)
    return NextResponse.json(
      { error: 'Erro ao executar operação' },
      { status: 500 }
    )
  }
}

// Obter estatísticas do banco
export async function GET() {
  try {
    const stats = {
      usuarios: await prisma.usuario.count(),
      produtos: await prisma.produto.count(),
      clientes: await prisma.cliente.count(),
      comandas: await prisma.comanda.count(),
      comandasAbertas: await prisma.comanda.count({ where: { status: 'aberta' } }),
      comandasFechadas: await prisma.comanda.count({ where: { status: 'fechada' } }),
      pedidos: await prisma.pedido.count(),
      itensComanda: await prisma.itemComanda.count(),
      movimentacoesEstoque: await prisma.estoqueMovimentacao.count(),
      totalVendas: await prisma.comanda.aggregate({
        where: { status: 'fechada' },
        _sum: { valorTotal: true },
      }),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
