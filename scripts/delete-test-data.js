const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function deleteTestData() {
  console.log('\n🗑️  Removendo dados de teste do garçom "teste"...\n')

  try {
    const garcomId = 8

    // Buscar comandas do garçom teste
    const comandas = await prisma.comanda.findMany({
      where: { garcomId },
      include: { itens: true }
    })

    if (comandas.length === 0) {
      console.log('✅ Nenhum dado de teste encontrado.')
      return
    }

    console.log(`📋 Encontradas ${comandas.length} comandas do garçom "teste"`)

    // Deletar itens primeiro (relação)
    for (const comanda of comandas) {
      if (comanda.itens.length > 0) {
        await prisma.itemComanda.deleteMany({
          where: { comandaId: comanda.id }
        })
        console.log(`   - Removidos ${comanda.itens.length} itens da comanda #${comanda.id}`)
      }
    }

    // Deletar comandas
    const result = await prisma.comanda.deleteMany({
      where: { garcomId }
    })

    console.log(`\n✅ ${result.count} comandas removidas com sucesso!`)
    console.log('✅ Dados de teste do garçom "teste" foram apagados.\n')

  } catch (error) {
    console.error('❌ Erro ao remover dados:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

deleteTestData()
