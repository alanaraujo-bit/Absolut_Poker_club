const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkGarcomData() {
  console.log('\n🔍 Verificando dados do garçom...\n')

  try {
    // Listar todos os usuários do tipo garçom
    const garcons = await prisma.usuario.findMany({
      where: { tipo: 'garcom' }
    })

    console.log('📋 Garçons cadastrados:')
    garcons.forEach(g => {
      console.log(`  - ID: ${g.id}, Nome: ${g.nome}, Username: ${g.username}`)
    })

    if (garcons.length === 0) {
      console.log('\n⚠️  Nenhum garçom encontrado no banco!')
      return
    }

    // Para cada garçom, verificar suas comandas
    for (const garcom of garcons) {
      console.log(`\n📊 Estatísticas do garçom: ${garcom.nome} (ID: ${garcom.id})`)
      
      // Total de comandas
      const totalComandas = await prisma.comanda.count({
        where: { garcomId: garcom.id }
      })
      console.log(`  Total de comandas: ${totalComandas}`)

      // Comandas abertas
      const comandasAbertas = await prisma.comanda.count({
        where: { 
          garcomId: garcom.id,
          status: 'aberta'
        }
      })
      console.log(`  Comandas abertas: ${comandasAbertas}`)

      // Comandas fechadas
      const comandasFechadas = await prisma.comanda.count({
        where: { 
          garcomId: garcom.id,
          status: 'fechada'
        }
      })
      console.log(`  Comandas fechadas: ${comandasFechadas}`)

      // Total vendido (lifetime)
      const totalVendido = await prisma.comanda.aggregate({
        _sum: { valorTotal: true },
        where: {
          garcomId: garcom.id,
          status: 'fechada'
        }
      })
      console.log(`  Total vendido: R$ ${Number(totalVendido._sum.valorTotal || 0).toFixed(2)}`)

      // Comandas de hoje
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const comandasHoje = await prisma.comanda.count({
        where: {
          garcomId: garcom.id,
          dataAbertura: { gte: hoje }
        }
      })
      console.log(`  Comandas hoje: ${comandasHoje}`)

      // Listar algumas comandas recentes
      const comandasRecentes = await prisma.comanda.findMany({
        where: { garcomId: garcom.id },
        include: {
          cliente: true,
          itens: {
            include: { produto: true }
          }
        },
        orderBy: { dataAbertura: 'desc' },
        take: 5
      })

      if (comandasRecentes.length > 0) {
        console.log(`\n  Comandas recentes:`)
        comandasRecentes.forEach(c => {
          console.log(`    - Comanda #${c.id}: Cliente ${c.cliente.nome}, Status: ${c.status}, Valor: R$ ${Number(c.valorTotal).toFixed(2)}, Itens: ${c.itens.length}`)
        })
      }
    }

    // Verificar comandas sem garçom
    const comandasSemGarcom = await prisma.comanda.count({
      where: { garcomId: null }
    })
    
    if (comandasSemGarcom > 0) {
      console.log(`\n⚠️  Atenção: ${comandasSemGarcom} comandas sem garçom associado!`)
    }

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGarcomData()
