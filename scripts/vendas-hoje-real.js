const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function vendasReaisDeHoje() {
  console.log('=== VENDAS REAIS DE HOJE ===\n')

  // Pegar a data de hoje no timezone local
  const agoraLocal = new Date()
  const hoje = new Date(agoraLocal.getFullYear(), agoraLocal.getMonth(), agoraLocal.getDate())
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  console.log('Hoje (início):', hoje.toLocaleString('pt-BR'))
  console.log('Amanhã (início):', amanha.toLocaleString('pt-BR'))
  console.log('Hora atual:', agoraLocal.toLocaleString('pt-BR'))
  console.log('\n')

  // Buscar todas as comandas (abertas e fechadas) de hoje
  const todasComandasHoje = await prisma.comanda.findMany({
    where: {
      dataAbertura: {
        gte: hoje,
        lt: amanha,
      },
    },
    include: {
      cliente: true,
      itens: {
        include: {
          produto: true,
        },
      },
    },
    orderBy: {
      dataAbertura: 'desc',
    },
  })

  console.log(`Total de comandas abertas HOJE: ${todasComandasHoje.length}\n`)

  let totalAbertas = 0
  let totalFechadas = 0
  let comandasAbertas = []
  let comandasFechadas = []

  todasComandasHoje.forEach(c => {
    const valor = Number(c.valorTotal)
    if (c.status === 'aberta') {
      totalAbertas += valor
      comandasAbertas.push(c)
    } else {
      totalFechadas += valor
      comandasFechadas.push(c)
    }
  })

  console.log('=== COMANDAS ABERTAS HOJE ===')
  console.log(`Total: ${comandasAbertas.length}`)
  comandasAbertas.forEach(c => {
    console.log(`  #${c.id} - ${c.cliente.nome} - R$ ${Number(c.valorTotal).toFixed(2)} - ${new Date(c.dataAbertura).toLocaleString('pt-BR')}`)
  })
  console.log(`Subtotal Abertas: R$ ${totalAbertas.toFixed(2)}\n`)

  console.log('=== COMANDAS FECHADAS HOJE ===')
  console.log(`Total: ${comandasFechadas.length}`)
  comandasFechadas.forEach(c => {
    console.log(`  #${c.id} - ${c.cliente.nome} - R$ ${Number(c.valorTotal).toFixed(2)}`)
    console.log(`    Aberta: ${new Date(c.dataAbertura).toLocaleString('pt-BR')}`)
    if (c.dataFechamento) {
      console.log(`    Fechada: ${new Date(c.dataFechamento).toLocaleString('pt-BR')}`)
    }
    console.log(`    Forma: ${c.formaPagamento || 'N/A'}`)
  })
  console.log(`Subtotal Fechadas: R$ ${totalFechadas.toFixed(2)}\n`)

  console.log('=== TOTAL DO DIA ===')
  console.log(`TOTAL GERAL: R$ ${(totalAbertas + totalFechadas).toFixed(2)}`)
  console.log(`Abertas: R$ ${totalAbertas.toFixed(2)} (${comandasAbertas.length} comandas)`)
  console.log(`Fechadas: R$ ${totalFechadas.toFixed(2)} (${comandasFechadas.length} comandas)`)

  await prisma.$disconnect()
}

vendasReaisDeHoje().catch(console.error)
