const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestDataSimple() {
  console.log('\n📦 Criando comandas de teste simples para garçom "teste"...\n')

  try {
    const garcomId = 8

    // Verificar garçom
    const garcom = await prisma.usuario.findUnique({ where: { id: garcomId } })
    if (!garcom) {
      console.log('❌ Garçom não encontrado!')
      return
    }

    console.log(`✅ Garçom: ${garcom.nome}`)

    // Pegar clientes
    const clientes = await prisma.cliente.findMany({ take: 3 })
    if (clientes.length === 0) {
      console.log('❌ Nenhum cliente!')
      return
    }

    // Pegar produtos
    const produtos = await prisma.produto.findMany({ take: 3 })
    if (produtos.length === 0) {
      console.log('❌ Nenhum produto!')
      return
    }

    console.log(`📋 ${clientes.length} clientes, ${produtos.length} produtos`)

    const hoje = new Date()
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)

    // Comanda 1 - Aberta hoje com preço fixo
    const c1 = await prisma.comanda.create({
      data: {
        cliente: { connect: { id: clientes[0].id } },
        garcomId: garcomId,
        status: 'aberta',
        dataAbertura: hoje,
        valorTotal: 20,
      }
    })

    await prisma.itemComanda.create({
      data: {
        comanda: { connect: { id: c1.id } },
        produto: { connect: { id: produtos[0].id } },
        quantidade: 2,
        precoUnitario: 10,
        subtotal: 20
      }
    })

    console.log(`✅ Comanda #${c1.id} - R$ 20.00 (Aberta - Hoje)`)

    // Comanda 2 - Fechada hoje
    const c2 = await prisma.comanda.create({
      data: {
        cliente: { connect: { id: clientes[1].id } },
        garcomId: garcomId,
        status: 'fechada',
        dataAbertura: hoje,
        dataFechamento: new Date(),
        formaPagamento: 'dinheiro',
        valorTotal: 35,
      }
    })

    await prisma.itemComanda.createMany({
      data: [
        {
          comandaId: c2.id,
          produtoId: produtos[0].id,
          quantidade: 1,
          precoUnitario: 15,
          subtotal: 15
        },
        {
          comandaId: c2.id,
          produtoId: produtos[1].id,
          quantidade: 2,
          precoUnitario: 10,
          subtotal: 20
        }
      ]
    })

    console.log(`✅ Comanda #${c2.id} - R$ 35.00 (Fechada - Hoje)`)

    // Comanda 3 - Fechada ontem
    const c3 = await prisma.comanda.create({
      data: {
        cliente: { connect: { id: clientes[2].id } },
        garcomId: garcomId,
        status: 'fechada',
        dataAbertura: ontem,
        dataFechamento: ontem,
        formaPagamento: 'pix',
        valorTotal: 45,
      }
    })

    await prisma.itemComanda.create({
      data: {
        comandaId: c3.id,
        produtoId: produtos[2].id,
        quantidade: 3,
        precoUnitario: 15,
        subtotal: 45
      }
    })

    console.log(`✅ Comanda #${c3.id} - R$ 45.00 (Fechada - Ontem)`)

    // Comanda 4 - Aberta hoje
    const c4 = await prisma.comanda.create({
      data: {
        cliente: { connect: { id: clientes[0].id } },
        garcomId: garcomId,
        status: 'aberta',
        dataAbertura: hoje,
        valorTotal: 30,
      }
    })

    await prisma.itemComanda.createMany({
      data: [
        {
          comandaId: c4.id,
          produtoId: produtos[0].id,
          quantidade: 1,
          precoUnitario: 10,
          subtotal: 10
        },
        {
          comandaId: c4.id,
          produtoId: produtos[1].id,
          quantidade: 2,
          precoUnitario: 10,
          subtotal: 20
        }
      ]
    })

    console.log(`✅ Comanda #${c4.id} - R$ 30.00 (Aberta - Hoje)`)

    // Verificar totais
    const total = await prisma.comanda.count({ where: { garcomId } })
    const vendido = await prisma.comanda.aggregate({
      _sum: { valorTotal: true },
      where: { garcomId, status: 'fechada' }
    })

    console.log('\n📊 Totais:')
    console.log(`   Comandas: ${total}`)
    console.log(`   Vendido: R$ ${Number(vendido._sum.valorTotal || 0).toFixed(2)}`)
    console.log('\n✅ Concluído!')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTestDataSimple()
