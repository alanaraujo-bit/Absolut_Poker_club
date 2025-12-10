import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Pagamento parcial da comanda
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comandaId = parseInt(id)
    const { itensPagamento, formaPagamento, observacao } = await request.json()

    // Verificar se comanda existe e está aberta
    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
        },
      },
    })

    if (!comanda) {
      return NextResponse.json({ error: 'Comanda não encontrada' }, { status: 404 })
    }

    if (comanda.status !== 'aberta') {
      return NextResponse.json({ error: 'Comanda já está fechada' }, { status: 400 })
    }

    let valorPago = 0
    const itensPagosDetalhes: any[] = []

    // Processar cada item do pagamento parcial
    for (const itemPag of itensPagamento) {
      const itemOriginal = comanda.itens.find(i => i.id === itemPag.itemId)
      
      if (!itemOriginal) {
        return NextResponse.json(
          { error: `Item ${itemPag.itemId} não encontrado na comanda` },
          { status: 400 }
        )
      }

      const quantidadeOriginal = Number(itemOriginal.quantidade)
      const quantidadePagar = Number(itemPag.quantidade)

      if (quantidadePagar <= 0 || quantidadePagar > quantidadeOriginal) {
        return NextResponse.json(
          { error: `Quantidade inválida para ${itemOriginal.produto.nome}` },
          { status: 400 }
        )
      }

      const precoUnitario = Number(itemOriginal.precoUnitario)
      const subtotalPago = precoUnitario * quantidadePagar
      valorPago += subtotalPago

      // Guardar detalhes do item pago para o histórico
      itensPagosDetalhes.push({
        itemId: itemOriginal.id,
        produtoId: itemOriginal.produtoId,
        produtoNome: itemOriginal.produto.nome,
        quantidade: quantidadePagar,
        quantidadeOriginal: quantidadeOriginal,
        precoUnitario: precoUnitario,
        subtotal: subtotalPago,
      })

      // Se pagar quantidade parcial, criar novo item e ajustar o original
      if (quantidadePagar < quantidadeOriginal) {
        // Reduzir quantidade do item original
        const novaQuantidade = quantidadeOriginal - quantidadePagar
        const novoSubtotal = precoUnitario * novaQuantidade

        await prisma.itemComanda.update({
          where: { id: itemOriginal.id },
          data: {
            quantidade: novaQuantidade,
            subtotal: novoSubtotal,
          },
        })
      } else {
        // Se pagar tudo, deletar o item
        await prisma.itemComanda.delete({
          where: { id: itemOriginal.id },
        })
      }
    }

    // Atualizar valor total da comanda original
    const novoValorTotal = Number(comanda.valorTotal) - valorPago

    await prisma.comanda.update({
      where: { id: comandaId },
      data: {
        valorTotal: Math.max(0, novoValorTotal),
      },
    })

    // Criar uma nova comanda fechada com os itens pagos
    const comandaFechada = await prisma.comanda.create({
      data: {
        clienteId: comanda.clienteId,
        garcomId: comanda.garcomId,
        status: 'fechada',
        dataAbertura: comanda.dataAbertura,
        dataFechamento: new Date(),
        valorTotal: valorPago,
        formaPagamento,
        observacao: `Pagamento parcial da Comanda #${comandaId}`,
      },
    })

    // Criar os itens na comanda fechada
    for (const itemPago of itensPagosDetalhes) {
      await prisma.itemComanda.create({
        data: {
          comandaId: comandaFechada.id,
          produtoId: itemPago.produtoId,
          quantidade: itemPago.quantidade,
          precoUnitario: itemPago.precoUnitario,
          subtotal: itemPago.subtotal,
        },
      })
    }

    // Registrar pagamento parcial no histórico
    // TODO: Descomentar após regenerar Prisma Client
    // const pagamentoParcial = await prisma.pagamentoParcial.create({
    //   data: {
    //     comandaId,
    //     valor: valorPago,
    //     formaPagamento,
    //     itensJson: JSON.stringify(itensPagosDetalhes),
    //     observacao: `Comanda fechada #${comandaFechada.id} criada`,
    //   },
    // })

    // Se a comanda original ficou zerada, fechar ela também
    if (novoValorTotal <= 0) {
      await prisma.comanda.update({
        where: { id: comandaId },
        data: {
          status: 'fechada',
          dataFechamento: new Date(),
          formaPagamento,
          observacao: `Totalmente paga via pagamentos parciais`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      valorPago,
      valorRestante: Math.max(0, novoValorTotal),
      comandaFechada: novoValorTotal <= 0,
      comandaFechadaId: comandaFechada.id,
      pagamentoId: 0, // pagamentoParcial.id,
      mensagem: novoValorTotal <= 0 
        ? 'Comanda totalmente paga - Todos os itens foram pagos'
        : `Pagamento realizado. Restam R$ ${novoValorTotal.toFixed(2)} para pagar`,
    })
  } catch (error) {
    console.error('Erro ao processar pagamento parcial:', error)
    return NextResponse.json({ error: 'Erro ao processar pagamento parcial' }, { status: 500 })
  }
}
