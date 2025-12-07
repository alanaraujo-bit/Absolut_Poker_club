# 🃏 Absolut Poker Club - Sistema de Gerenciamento

Sistema PWA mobile-first para gerenciamento de poker club com autenticação e controle de acesso por perfil.

## ✨ Funcionalidades Implementadas

### 🔐 Autenticação
- Sistema completo de login com usuário e senha
- Dois tipos de usuário: **Admin** e **Garçom**
- Proteção de rotas automática
- Redirecionamento baseado no tipo de usuário
- Sessão persistente com localStorage

### 👑 Interface Admin (Completa)
- **Dashboard**: Visão geral com estatísticas e gráficos
- **Pedidos**: Criar e gerenciar pedidos
- **Clientes**: Gerenciar clientes e saldos
- **Estoque**: Controle de produtos e movimentações
- **Relatórios**: Análises e vendas
- **Usuários**: Gerenciar usuários do sistema (criar garçons/admins, ativar/desativar)

### 🍺 Interface Garçom (Simplificada)
- Busca rápida de produtos
- Seleção de cliente
- Carrinho de compras com contador
- Finalização de pedidos
- Interface otimizada para uso rápido

## 📱 Design Mobile-First

### Características
- **Clean**: Interface minimalista focada no essencial
- **Compacto**: Componentes otimizados para telas pequenas
- **Temático**: Tema poker (verde feltro, dourado, efeitos neon)
- **Responsivo**: Layouts adaptativos (tabelas → cards no mobile)
- **PWA**: Funciona offline, instalável como app

### Navegação
- **Desktop**: Sidebar lateral fixa
- **Mobile**: Bottom navigation com 5 ícones (safe-area)

## 🎨 Tema Poker

### Cores
- `--poker-green`: #0F2314 (feltro)
- `--poker-green-dark`: #0A1A0F
- `--poker-gold`: #D4AF37 (dourado)

### Efeitos
- Gradientes dourados
- Bordas neon douradas
- Animações sutis (shimmer, pulse)
- Glassmorphism (glass-poker, glass-dark)

## 🚀 Como Usar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados
```bash
# Aplicar schema
npx prisma db push

# Criar dados iniciais (usuário admin padrão)
npx prisma db seed
```

### 3. Iniciar Servidor
```bash
npm run dev
```

### 4. Acessar Sistema
- URL: `http://localhost:3000/login`
- **Usuário padrão**: `admin`
- **Senha padrão**: `admin123`

## 👥 Tipos de Usuário

### Admin
- Acesso completo ao sistema
- Gerenciar produtos, clientes, pedidos, estoque
- Visualizar relatórios e estatísticas
- Criar e gerenciar usuários (admins e garçons)
- Ativar/desativar usuários

### Garçom
- Interface simplificada focada em pedidos
- Buscar produtos rapidamente
- Selecionar cliente
- Criar pedidos
- Sem acesso a relatórios ou configurações

## 🔒 Segurança

### Hash de Senhas
- Senhas armazenadas em Base64 (desenvolvimento)
- **Produção**: Migrar para bcrypt

### Proteção de Rotas
- AuthContext protege rotas automaticamente
- Garçons redirecionados para `/garcom`
- Admins têm acesso completo
- Não autenticados redirecionados para `/login`

## 📂 Estrutura de Rotas

```
/login              → Página de login (pública)
/                   → Dashboard (admin)
/pedidos            → Criar pedidos (admin)
/clientes           → Gerenciar clientes (admin)
/estoque            → Gerenciar estoque (admin)
/relatorios         → Relatórios (admin)
/usuarios           → Gerenciar usuários (admin)
/garcom             → Interface do garçom (garçom)
```

## 🗄️ Modelos do Banco

### Usuario
```prisma
model Usuario {
  id        Int      @id @default(autoincrement())
  nome      String
  username  String   @unique
  senha     String   // Hash Base64
  tipo      String   // 'admin' | 'garcom'
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Outros Modelos
- Produto
- Cliente
- Pedido
- ItemPedido
- EstoqueMovimentacao
- MovimentacaoCliente

## 🎯 Fluxo de Uso

### Garçom
1. Login com credenciais
2. Redirecionado para `/garcom`
3. Busca produtos
4. Seleciona cliente
5. Adiciona ao carrinho
6. Finaliza pedido
7. Pedido é debitado do saldo do cliente

### Admin
1. Login com credenciais
2. Redirecionado para `/`
3. Acessa qualquer funcionalidade
4. Cria novos usuários garçom
5. Monitora vendas e estoque
6. Visualiza relatórios

## 📊 APIs Criadas

### Auth
- `POST /api/auth/login` - Login de usuário

### Usuarios
- `GET /api/usuarios` - Listar usuários
- `POST /api/usuarios` - Criar usuário
- `PUT /api/usuarios/:id` - Atualizar usuário
- `DELETE /api/usuarios/:id` - Desativar usuário (soft delete)

## 🔧 Tecnologias

- **Next.js 14**: App Router, Server Components
- **Prisma ORM**: MySQL
- **Tailwind CSS**: Estilos responsivos
- **Framer Motion**: Animações
- **PWA**: next-pwa, service worker, manifest
- **TypeScript**: Tipagem estática

## 🌟 Destaques de UX

### Mobile
- Touch feedback em todos os botões
- Safe area (notch) respeitada
- Bottom navigation thumb-friendly
- Cards otimizados para scroll
- Inputs grandes (48px+) para toque fácil

### Desktop
- Sidebar fixa
- Hover effects sutis
- Tabelas com scroll interno
- Modais centralizados

### Ambos
- Loading states
- Toast notifications
- Confirmações visuais
- Estados vazios informativos

## 📱 PWA Features

- ✅ Manifest configurado
- ✅ Service Worker com cache
- ✅ Ícones em múltiplas resoluções
- ✅ Instalável como app
- ✅ Funciona offline (cache de assets)
- ✅ Theme color poker

## 🎓 Padrões de Código

### Componentes
- `'use client'` quando necessário (interatividade)
- Server Components por padrão
- Props tipadas com TypeScript

### Estilos
- Tailwind classes utilitárias
- Classes customizadas no globals.css
- Responsividade com breakpoints (sm, md, lg)

### Estado
- useState para estado local
- Context API para autenticação
- localStorage para persistência

## 🚦 Próximos Passos Sugeridos

1. **Segurança**
   - Migrar hash de senha para bcrypt
   - Implementar JWT para sessões
   - Rate limiting nas APIs

2. **Features**
   - Relatório de vendas por garçom
   - Histórico de pedidos em tempo real
   - Notificações push (PWA)
   - Modo offline completo

3. **UX**
   - Dark/Light mode toggle
   - Personalização de tema por club
   - Tutorial first-time
   - Atalhos de teclado (desktop)

## 📝 Notas

- Sistema otimizado para uso em tablets/celulares durante jogos
- Foco em velocidade: menos cliques, mais eficiência
- Design inspirado em mesas de poker profissionais
- Todas as ações possuem feedback visual instantâneo

---

**Desenvolvido com ♠️ para Absolut Poker Club - ACATH**
*Canaã dos Carajás - PA*
