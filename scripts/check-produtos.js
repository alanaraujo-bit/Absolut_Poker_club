const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const produtos = await prisma.produto.findMany({
    orderBy: { id: 'asc' }
  })
  
  console.log('\n=== PRODUTOS ===\n')
  produtos.forEach(p => {
    console.log(`ID: ${p.id}`)
    console.log(`Nome: ${p.nome}`)
    console.log(`Preço Venda: R$ ${p.precoVenda}`)
    console.log(`Preço Custo: R$ ${p.precoCusto || 'N/A'}`)
    console.log(`Unidade: ${p.unidadeMedida}`)
    console.log(`Estoque: ${p.estoqueAtual || 'N/A'}`)
    console.log(`Ativo: ${p.ativo}`)
    console.log('---')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
