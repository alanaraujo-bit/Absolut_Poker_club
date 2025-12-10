const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestData() {
  console.log('\n📦 Criando dados de teste para o garçom "teste"...\n')

  try {
    // ID do garçom teste
    const garcomId = 8

    // Verificar se o garçom existe
    const garcom = await prisma.usuario.findUnique({
      where: { id: garcomId }
    })

    if (!garcom) {
      console.log('❌ Garçom teste (ID: 8) não encontrado!')
      return
    }

    console.log(`✅ Garçom encontrado: ${garcom.nome} (${garcom.username})`)

    // Buscar alguns clientes existentes
    const clientes = await prisma.cliente.findMany({
      take: 5
    })

    if (clientes.length === 0) {
      console.log('❌ Nenhum cliente encontrado no banco!')
      return
    }

    console.log(`📋 Encontrados ${clientes.length} clientes`)

    // Buscar alguns produtos existentes
    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true
      },
      take: 5
    })

    if (produtos.length === 0) {
      console.log('❌ Nenhum produto encontrado no banco!')
      return
    }

    console.log(`📋 Encontrados ${produtos.length} produtos`)
    produtos.forEach(p => {
      console.log(`   - ${p.nome}: R$ ${Number(p.preco).toFixed(2)}`)
    })

    // Criar comandas de teste
    const hoje = new Date()
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)

    // Comanda 1 - Aberta hoje
    const valorComanda1 = Number(produtos[0].preco) * 2
    const comanda1 = await prisma.comanda.create({
      data: {
        clienteId: clientes[0].id,
        garcomId: garcomId,
        status: 'aberta',
        dataAbertura: hoje,
        valorTotal: valorComanda1,
        itens: {
          create: [
            {
              produto: {
                connect: { id: produtos[0].id }
              },
              quantidade: 2,
              precoUnitario: Number(produtos[0].preco),
              subtotal: valorComanda1
            }
          ]
        }
      }
    })

    console.log(`✅ Comanda #${comanda1.id} criada (Aberta - Hoje) - R$ ${valorComanda1.toFixed(2)}`)

    // Comanda 2 - Fechada hoje
    const valorComanda2 = Number(produtos[1].preco) + Number(produtos[2].preco)
    const comanda2 = await prisma.comanda.create({
      data: {
        clienteId: clientes[1].id,
        garcomId: garcomId,
        status: 'fechada',
        dataAbertura: hoje,
        dataFechamento: new Date(),
        formaPagamento: 'dinheiro',
        valorTotal: valorComanda2,
        itens: {
          create: [
            {
              produto: {
                connect: { id: produtos[1].id }
              },
              quantidade: 1,
              precoUnitario: Number(produtos[1].preco),
              subtotal: Number(produtos[1].preco)
            },
            {
              produto: {
                connect: { id: produtos[2].id }
              },
              quantidade: 1,
              precoUnitario: Number(produtos[2].preco),
              subtotal: Number(produtos[2].preco)
            }
          ]
        }
      }
    })

    console.log(`✅ Comanda #${comanda2.id} criada (Fechada - Hoje) - R$ ${valorComanda2.toFixed(2)}`)

    // Comanda 3 - Fechada ontem
    const valorComanda3 = Number(produtos[3].preco) * 3
    const comanda3 = await prisma.comanda.create({
      data: {
        clienteId: clientes[2].id,
        garcomId: garcomId,
        status: 'fechada',
        dataAbertura: ontem,
        dataFechamento: ontem,
        formaPagamento: 'pix',
        valorTotal: valorComanda3,
        itens: {
          create: [
            {
              produto: {
                connect: { id: produtos[3].id }
              },
              quantidade: 3,
              precoUnitario: Number(produtos[3].preco),
              subtotal: valorComanda3
            }
          ]
        }
      }
    })

    console.log(`✅ Comanda #${comanda3.id} criada (Fechada - Ontem) - R$ ${valorComanda3.toFixed(2)}`)

    // Comanda 4 - Aberta hoje
    const valorComanda4 = Number(produtos[0].preco) + (Number(produtos[1].preco) * 2)
    const comanda4 = await prisma.comanda.create({
      data: {
        clienteId: clientes[3].id,
        garcomId: garcomId,
        status: 'aberta',
        dataAbertura: hoje,
        valorTotal: valorComanda4,
        itens: {
          create: [
            {
              produto: {
                connect: { id: produtos[0].id }
              },
              quantidade: 1,
              precoUnitario: Number(produtos[0].preco),
              subtotal: Number(produtos[0].preco)
            },
            {
              produto: {
                connect: { id: produtos[1].id }
              },
              quantidade: 2,
              precoUnitario: Number(produtos[1].preco),
              subtotal: Number(produtos[1].preco) * 2
            }
          ]
        }
      }
    })

    console.log(`✅ Comanda #${comanda4.id} criada (Aberta - Hoje) - R$ ${valorComanda4.toFixed(2)}`)

    // Verificar resultado final
    const totalComandas = await prisma.comanda.count({
      where: { garcomId: garcomId }
    })

    const totalVendido = await prisma.comanda.aggregate({
      _sum: { valorTotal: true },
      where: {
        garcomId: garcomId,
        status: 'fechada'
      }
    })

    console.log('\n📊 Resultado final:')
    console.log(`   Total de comandas: ${totalComandas}`)
    console.log(`   Total vendido: R$ ${Number(totalVendido._sum.valorTotal || 0).toFixed(2)}`)
    console.log('\n✅ Dados de teste criados com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()
