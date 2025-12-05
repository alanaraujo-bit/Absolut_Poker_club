import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Produtos de exemplo para um bar/poker club
  const produtos = [
    { nome: 'Cerveja Heineken', precoVenda: 12.00, precoCusto: 6.00, estoqueAtual: 50, estoqueMinimo: 20 },
    { nome: 'Cerveja Budweiser', precoVenda: 10.00, precoCusto: 5.00, estoqueAtual: 45, estoqueMinimo: 20 },
    { nome: 'Vodka Absolut', precoVenda: 180.00, precoCusto: 90.00, estoqueAtual: 10, estoqueMinimo: 5 },
    { nome: 'Whisky Jack Daniels', precoVenda: 250.00, precoCusto: 120.00, estoqueAtual: 8, estoqueMinimo: 3 },
    { nome: 'Energético Red Bull', precoVenda: 15.00, precoCusto: 7.00, estoqueAtual: 30, estoqueMinimo: 15 },
    { nome: 'Água Mineral', precoVenda: 5.00, precoCusto: 2.00, estoqueAtual: 60, estoqueMinimo: 25 },
    { nome: 'Refrigerante Coca-Cola', precoVenda: 8.00, precoCusto: 3.50, estoqueAtual: 40, estoqueMinimo: 20 },
    { nome: 'Suco Natural', precoVenda: 12.00, precoCusto: 5.00, estoqueAtual: 25, estoqueMinimo: 10 },
    { nome: 'Porção de Batata Frita', precoVenda: 25.00, precoCusto: 10.00, estoqueAtual: 100, estoqueMinimo: 30 },
    { nome: 'Porção de Frango', precoVenda: 35.00, precoCusto: 15.00, estoqueAtual: 50, estoqueMinimo: 20 },
    { nome: 'Hambúrguer Artesanal', precoVenda: 28.00, precoCusto: 12.00, estoqueAtual: 40, estoqueMinimo: 15 },
    { nome: 'Tábua de Frios', precoVenda: 45.00, precoCusto: 20.00, estoqueAtual: 30, estoqueMinimo: 10 },
  ]

  console.log('🌱 Iniciando seed do banco de dados...')

  for (const produto of produtos) {
    await prisma.produto.create({
      data: {
        nome: produto.nome,
        precoVenda: produto.precoVenda,
        precoCusto: produto.precoCusto,
        estoqueAtual: produto.estoqueAtual,
        estoqueMinimo: produto.estoqueMinimo,
      },
    })
  }

  console.log('✅ Seed completo! Produtos cadastrados com sucesso.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
