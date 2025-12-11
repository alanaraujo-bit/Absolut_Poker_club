const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n=== CORRIGINDO UNIDADE DE MEDIDA ===\n')
  
  // Buscar o produto Red bull
  const redBull = await prisma.produto.findFirst({
    where: { id: 27 }
  })
  
  if (redBull) {
    console.log('Produto encontrado:')
    console.log(`Nome: ${redBull.nome}`)
    console.log(`Preço: R$ ${redBull.precoVenda}`)
    console.log(`Unidade ATUAL: ${redBull.unidadeMedida}`)
    
    // Atualizar para kg
    const updated = await prisma.produto.update({
      where: { id: 27 },
      data: { unidadeMedida: 'kg' }
    })
    
    console.log(`Unidade ATUALIZADA: ${updated.unidadeMedida}`)
    console.log('\n✓ Unidade corrigida com sucesso!')
  } else {
    console.log('Produto não encontrado')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
