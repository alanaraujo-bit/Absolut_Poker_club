# 🎰 Poker Club - Sistema de Gestão

Sistema de gestão para bar/poker club com design moderno inspirado no Instagram.

## 🚀 Instalação Rápida

### 1. Instalar Dependências

```powershell
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/nome_banco"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_PASSWORD="poker2024"
```

**Para criar um banco PostgreSQL grátis:**
- Acesse https://railway.app
- Crie um projeto PostgreSQL
- Copie a DATABASE_URL

### 3. Configurar Banco de Dados

```powershell
npx prisma migrate dev --name init
npx prisma generate
npx tsx prisma/seed.ts
```

### 4. Rodar o Projeto

```powershell
npm run dev
```

Acesse: **http://localhost:3000**

✅ **Pronto! Sistema funcionando!**

## 📋 Funcionalidades

- ✅ Dashboard com estatísticas em tempo real
- ✅ Sistema de pedidos com carrinho
- ✅ Gestão de estoque com alertas
- ✅ Relatórios de vendas e produtos
- ✅ Design responsivo dark premium
- ✅ Animações suaves

## 🎨 Tecnologias

- Next.js 14 + TypeScript
- TailwindCSS + Framer Motion
- Prisma + PostgreSQL
- Radix UI + Recharts

---

**Sistema desenvolvido com ❤️ usando GitHub Copilot**
