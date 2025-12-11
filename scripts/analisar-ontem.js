const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analisarOntem() {
  try {
    const hoje = new Date('2025-12-11T03:00:00.000Z')
    const ontem = new Date('2025-12-10T03:00:00.000Z')
    
    console.log('=== ANÁLISE DE COMANDAS DE ONTEM (10/12/2025) ===\n')
    console.log('Período:', ontem.toLocaleString('pt-BR'), 'até', hoje.toLocaleString('pt-BR'))
    
    console.log('\n--- 1. COMANDAS FECHADAS ONTEM (por dataFechamento) ---')
    const fechadasPorDataFechamento = await prisma.comanda.findMany({
      where: {
        status: 'fechada',
        dataFechamento: {
          gte: ontem,
          lt: hoje
        }
      },
      include: { cliente: true },
      orderBy: { id: 'asc' }
    })
    
    console.log('Total encontrado:', fechadasPorDataFechamento.length)
    fechadasPorDataFechamento.forEach(c => {
      const aberta = new Date(c.dataAbertura).toLocaleString('pt-BR')
      const fechada = c.dataFechamento ? new Date(c.dataFechamento).toLocaleString('pt-BR') : 'N/A'
      console.log(`  #${c.numero} - ${c.cliente.nome} - R$ ${Number(c.valorTotal).toFixed(2)}`)
      console.log(`    Aberta: ${aberta} | Fechada: ${fechada}`)
    })
    
    const totalPorFechamento = fechadasPorDataFechamento.reduce((sum, c) => sum + Number(c.valorTotal), 0)
    console.log('TOTAL POR DATA FECHAMENTO:', totalPorFechamento.toFixed(2))
    
    console.log('\n--- 2. COMANDAS ABERTAS ONTEM (por dataAbertura, status=fechada) ---')
    const abertasOntemFechadas = await prisma.comanda.findMany({
      where: {
        status: 'fechada',
        dataAbertura: {
          gte: ontem,
          lt: hoje
        }
      },
      include: { cliente: true },
      orderBy: { id: 'asc' }
    })
    
    console.log('Total encontrado:', abertasOntemFechadas.length)
    abertasOntemFechadas.forEach(c => {
      const aberta = new Date(c.dataAbertura).toLocaleString('pt-BR')
      const fechada = c.dataFechamento ? new Date(c.dataFechamento).toLocaleString('pt-BR') : 'N/A'
      console.log(`  #${c.numero} - ${c.cliente.nome} - R$ ${Number(c.valorTotal).toFixed(2)}`)
      console.log(`    Aberta: ${aberta} | Fechada: ${fechada}`)
    })
    
    const totalPorAbertura = abertasOntemFechadas.reduce((sum, c) => sum + Number(c.valorTotal), 0)
    console.log('TOTAL POR DATA ABERTURA (fechadas):', totalPorAbertura.toFixed(2))
    
    console.log('\n--- 3. TODAS COMANDAS ABERTAS ONTEM (incluindo ainda abertas) ---')
    const todasAbertasOntem = await prisma.comanda.findMany({
      where: {
        dataAbertura: {
          gte: ontem,
          lt: hoje
        }
      },
      include: { cliente: true },
      orderBy: { id: 'asc' }
    })
    
    console.log('Total encontrado:', todasAbertasOntem.length)
    todasAbertasOntem.forEach(c => {
      const aberta = new Date(c.dataAbertura).toLocaleString('pt-BR')
      const fechada = c.dataFechamento ? new Date(c.dataFechamento).toLocaleString('pt-BR') : 'AINDA ABERTA'
      console.log(`  #${c.numero} - ${c.cliente.nome} - Status: ${c.status} - R$ ${Number(c.valorTotal).toFixed(2)}`)
      console.log(`    Aberta: ${aberta} | Fechada: ${fechada}`)
    })
    
    const fechadasDeOntem = todasAbertasOntem.filter(c => c.status === 'fechada')
    const abertasDeOntem = todasAbertasOntem.filter(c => c.status === 'aberta')
    
    const totalFechadas = fechadasDeOntem.reduce((sum, c) => sum + Number(c.valorTotal), 0)
    const totalAbertas = abertasDeOntem.reduce((sum, c) => sum + Number(c.valorTotal), 0)
    const totalGeral = totalFechadas + totalAbertas
    
    console.log('\n=== RESUMO ===')
    console.log('Fechadas:', fechadasDeOntem.length, 'comandas - R$', totalFechadas.toFixed(2))
    console.log('Ainda Abertas:', abertasDeOntem.length, 'comandas - R$', totalAbertas.toFixed(2))
    console.log('TOTAL GERAL:', todasAbertasOntem.length, 'comandas - R$', totalGeral.toFixed(2))
    
    console.log('\n=== DIFERENÇA ENTRE CRITÉRIOS ===')
    console.log('Por dataFechamento:', totalPorFechamento.toFixed(2))
    console.log('Por dataAbertura (só fechadas):', totalPorAbertura.toFixed(2))
    console.log('Por dataAbertura (todas):', totalGeral.toFixed(2))
    console.log('Diferença:', (totalPorFechamento - totalPorAbertura).toFixed(2))
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analisarOntem()
