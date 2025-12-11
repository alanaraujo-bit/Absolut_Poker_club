const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n=== CATEGORIZANDO PRODUTOS ===\n')
  
  // Categorias baseadas no nome do produto
  const categorias = {
    'Cervejas': ['skol', 'heineken', 'coronita', 'cerveja', 'beer'],
    'Bebidas': ['coca', 'fanta', 'guaraná', 'água', 'agua', 'suco', 'red bull'],
    'Destilados': ['buchanan', 'campari', 'whisky', 'vodka', 'gin'],
    'Comidas': ['self-service', 'self service', 'filé', 'file', 'picanha', 'prato'],
    'Porções': ['porção', 'porcao', 'batata frita', 'pastel'],
    'Lanches': ['misto', 'sanduíche', 'sanduiche', 'hamburger']
  }
  
  const produtos = await prisma.produto.findMany()
  let atualizados = 0
  
  for (const produto of produtos) {
    let novaCategoria = 'Outros'
    const nomeLower = produto.nome.toLowerCase()
    
    // Encontrar categoria baseada no nome
    for (const [categoria, palavrasChave] of Object.entries(categorias)) {
      for (const palavra of palavrasChave) {
        if (nomeLower.includes(palavra)) {
          novaCategoria = categoria
          break
        }
      }
      if (novaCategoria !== 'Outros') break
    }
    
    // Atualizar produto
    await prisma.produto.update({
      where: { id: produto.id },
      data: { categoria: novaCategoria }
    })
    
    console.log(`✓ ${produto.nome.padEnd(30)} → ${novaCategoria}`)
    atualizados++
  }
  
  console.log(`\n${atualizados} produtos categorizados com sucesso!`)
  
  // Mostrar resumo por categoria
  const resumo = await prisma.produto.groupBy({
    by: ['categoria'],
    _count: true
  })
  
  console.log('\n=== RESUMO POR CATEGORIA ===\n')
  resumo.forEach(r => {
    console.log(`${r.categoria}: ${r._count} produto(s)`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
