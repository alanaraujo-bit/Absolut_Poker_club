const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createDevUser() {
  try {
    const email = 'alanvitoraraujo1a@outlook.com'
    const senha = 'Sucesso@2025#'
    const senhaHash = Buffer.from(senha).toString('base64')

    // Verificar se já existe
    const existing = await prisma.devUser.findUnique({
      where: { email },
    })

    if (existing) {
      console.log('👨‍💻 Usuário DEV já existe!')
      return
    }

    // Criar usuário dev
    const devUser = await prisma.devUser.create({
      data: {
        email,
        senha: senhaHash,
        nome: 'Alan Araújo - Developer',
        ativo: true,
      },
    })

    console.log('✅ Usuário DEV criado com sucesso!')
    console.log(`📧 Email: ${devUser.email}`)
    console.log(`🔑 Senha: ${senha}`)
    console.log(`👤 Nome: ${devUser.nome}`)
  } catch (error) {
    console.error('❌ Erro ao criar usuário DEV:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDevUser()
