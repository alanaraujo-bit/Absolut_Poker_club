const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function diagnosticar() {
  console.log('=== DIAGNÓSTICO DE VENDAS ===\n')

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  console.log('Data de hoje (início):', hoje.toISOString())

  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - hoje.getDay())
  console.log('Início da semana:', inicioSemana.toISOString())

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  console.log('Início do mês:', inicioMes.toISOString())
  console.log('\n')

  // Todas as comandas
  const todasComandas = await prisma.comanda.findMany({
    include: {
      cliente: true,
    },
    orderBy: {
      dataAbertura: 'desc',
    },
  })

  console.log(`Total de comandas no sistema: ${todasComandas.length}\n`)

  // Comandas abertas
  const comandasAbertas = todasComandas.filter(c => c.status === 'aberta')
  console.log('=== COMANDAS ABERTAS ===')
  console.log(`Total: ${comandasAbertas.length}`)
  let totalAbertas = 0
  comandasAbertas.forEach(c => {
    const valor = Number(c.valorTotal)
    totalAbertas += valor
    console.log(`  #${c.id} - ${c.cliente.nome} - R$ ${valor.toFixed(2)} - Aberta em: ${c.dataAbertura.toISOString()}`)
  })
  console.log(`Soma das abertas: R$ ${totalAbertas.toFixed(2)}\n`)

  // Comandas fechadas
  const comandasFechadas = todasComandas.filter(c => c.status === 'fechada')
  console.log('=== COMANDAS FECHADAS ===')
  console.log(`Total: ${comandasFechadas.length}`)
  let totalFechadas = 0
  comandasFechadas.forEach(c => {
    const valor = Number(c.valorTotal)
    totalFechadas += valor
    console.log(`  #${c.id} - ${c.cliente.nome} - R$ ${valor.toFixed(2)}`)
    console.log(`    Aberta em: ${c.dataAbertura.toISOString()}`)
    console.log(`    Fechada em: ${c.dataFechamento ? c.dataFechamento.toISOString() : 'NULL'}`)
    console.log(`    Forma Pgto: ${c.formaPagamento || 'NULL'}`)
  })
  console.log(`Soma das fechadas: R$ ${totalFechadas.toFixed(2)}\n`)

  // Verificar comandas de hoje
  const comandasHojeFechadas = await prisma.comanda.findMany({
    where: {
      status: 'fechada',
      dataFechamento: { gte: hoje },
    },
  })

  const comandasAbertasHoje = await prisma.comanda.findMany({
    where: {
      status: 'aberta',
      dataAbertura: { gte: hoje },
    },
  })

  console.log('=== VENDAS DE HOJE (pela query) ===')
  console.log(`Fechadas hoje: ${comandasHojeFechadas.length}`)
  console.log(`Abertas hoje: ${comandasAbertasHoje.length}`)

  const vendasHoje = comandasHojeFechadas.reduce(
    (sum, c) => sum + Number(c.valorTotal), 0
  ) + comandasAbertasHoje.reduce(
    (sum, c) => sum + Number(c.valorTotal), 0
  )

  console.log(`Total vendas hoje: R$ ${vendasHoje.toFixed(2)}\n`)

  // Vendas da semana
  const comandasSemanaMes = await prisma.comanda.findMany({
    where: {
      OR: [
        {
          status: 'fechada',
          dataFechamento: { gte: inicioSemana },
        },
        {
          status: 'aberta',
          dataAbertura: { gte: inicioSemana },
        },
      ],
    },
  })

  const vendasSemana = comandasSemanaMes.reduce(
    (sum, c) => sum + Number(c.valorTotal), 0
  )

  console.log('=== VENDAS DA SEMANA (pela query) ===')
  console.log(`Total comandas desde ${inicioSemana.toLocaleDateString()}: ${comandasSemanaMes.length}`)
  console.log(`Total vendas semana: R$ ${vendasSemana.toFixed(2)}\n`)

  // Vendas do mês
  const comandasMesMes = await prisma.comanda.findMany({
    where: {
      OR: [
        {
          status: 'fechada',
          dataFechamento: { gte: inicioMes },
        },
        {
          status: 'aberta',
          dataAbertura: { gte: inicioMes },
        },
      ],
    },
  })

  const vendasMes = comandasMesMes.reduce(
    (sum, c) => sum + Number(c.valorTotal), 0
  )

  console.log('=== VENDAS DO MÊS (pela query) ===')
  console.log(`Total comandas desde ${inicioMes.toLocaleDateString()}: ${comandasMesMes.length}`)
  console.log(`Total vendas mês: R$ ${vendasMes.toFixed(2)}\n`)

  console.log('=== RESUMO ===')
  console.log(`Hoje: R$ ${vendasHoje.toFixed(2)}`)
  console.log(`Semana: R$ ${vendasSemana.toFixed(2)}`)
  console.log(`Mês: R$ ${vendasMes.toFixed(2)}`)
  console.log(`\nTotal geral (abertas + fechadas): R$ ${(totalAbertas + totalFechadas).toFixed(2)}`)

  await prisma.$disconnect()
}

diagnosticar().catch(console.error)
