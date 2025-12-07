# 🎰 Absolut Poker Club - ACATH

**Associação Canaense Absolut de Texas Hold'em**  
Sistema de Gestão Mobile-First PWA

---

## ✨ Características

### 🎨 Design Premium Poker
- **Tema escuro** com cores de feltro verde e ouro luxuoso
- **Animações fluidas** com Framer Motion
- **Efeitos neon** e gradientes temáticos
- **Interface limpa** e intuitiva

### 📱 Mobile-First & Responsivo
- **100% otimizado para mobile** - prioridade celular
- **Bottom navigation** para acesso rápido no mobile
- **Touch-friendly** com feedback tátil
- **Safe area** para notch/island
- **Gestos intuitivos** e animações suaves

### ⚡ PWA (Progressive Web App)
- **Instalável** no celular (Android/iOS)
- **Funciona offline** com cache inteligente
- **App-like experience**
- **Atualizações automáticas**

### 🚀 Performance
- **Next.js 14** com App Router
- **Lazy loading** de componentes
- **Otimização de imagens** AVIF/WebP
- **Cache agressivo** para assets

---

## 🚀 Instalação Rápida

### 1. Instalar Dependências

```powershell
npm install
```

### 2. Configurar Banco de Dados

```powershell
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Rodar o Projeto

```powershell
npm run dev
```

Acesse: **http://localhost:3000**

---

## 📱 Instalação no Celular como PWA

### Android (Chrome)
1. Abra o site no Chrome
2. Toque no menu ⋮ (três pontos)
3. Selecione **"Adicionar à tela inicial"**
4. Confirme a instalação
5. O app aparecerá como ícone na tela inicial! 🎉

### iOS (Safari)
1. Abra o site no Safari
2. Toque no ícone de compartilhamento 📤
3. Role e toque em **"Adicionar à Tela de Início"**
4. Nomeie e confirme
5. Pronto! Use como app nativo! 🎉

---

## 📋 Funcionalidades

- ✅ **Dashboard** com estatísticas em tempo real
- ✅ **Sistema de pedidos** com carrinho inteligente
- ✅ **Gestão de clientes** com controle de saldo/fiado
- ✅ **Controle de estoque** com alertas automáticos
- ✅ **Relatórios** de vendas e produtos
- ✅ **PWA instalável** - funciona offline
- ✅ **100% responsivo** - mobile-first
- ✅ **Bottom navigation** para acesso rápido mobile
- ✅ **Tema poker premium** com animações

---

## 🎨 Tema Poker Customizado

### Cores Principais
- **Verde feltro**: `#0F2314` a `#1A3A1F`
- **Ouro luxuoso**: `#D4AF37`, `#FFD700`
- **Preto profundo**: `#0A0A0A`

### Classes Especiais
- `.gold-text` - Texto dourado animado
- `.poker-card` - Card temático
- `.glass-poker` - Efeito vidro fosco
- `.neon-border-gold` - Borda neon dourada
- `.neon-glow-gold` - Brilho neon
- `.btn-poker-primary` - Botão principal
- `.touch-feedback` - Feedback tátil mobile

---

## 🛠️ Tecnologias

- **Framework**: Next.js 14 (React 18)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + Custom CSS
- **Animações**: Framer Motion
- **UI**: Radix UI
- **Banco**: Prisma + SQLite/PostgreSQL
- **PWA**: next-pwa
- **Ícones**: Lucide React

---

## 📂 Estrutura

```
├── app/
│   ├── api/              # API Routes
│   ├── clientes/         # Página clientes
│   ├── estoque/          # Página estoque
│   ├── pedidos/          # Página pedidos
│   ├── relatorios/       # Página relatórios
│   ├── layout.tsx        # Layout root (PWA)
│   ├── page.tsx          # Dashboard
│   └── globals.css       # Estilos + tema poker
├── components/
│   ├── sidebar.tsx       # Nav (desktop + bottom mobile)
│   └── ui/               # Componentes UI
├── lib/
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── public/
│   ├── manifest.json     # PWA manifest
│   └── service-worker.js
└── next.config.js        # Config PWA
```

---

## 🎯 Roadmap

### Concluído ✅
- [x] Dashboard funcional
- [x] Sistema de pedidos
- [x] Gestão de clientes/fiado
- [x] Controle de estoque
- [x] Relatórios
- [x] PWA completo
- [x] Mobile-first 100% responsivo
- [x] Bottom navigation
- [x] Tema poker premium

### Próximos Passos 🚧
- [ ] Autenticação usuários
- [ ] Backup automático
- [ ] Exportar PDF/Excel
- [ ] Gráficos interativos
- [ ] Notificações push
- [ ] Dark/Light mode toggle

---

## 📊 API Endpoints

- `GET /api/dashboard/stats` - Estatísticas
- `GET /api/pedidos` - Listar pedidos
- `POST /api/pedidos` - Criar pedido
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes/[id]/pagar` - Pagamento
- `GET /api/estoque` - Listar estoque
- `GET /api/produtos` - Listar produtos
- `GET /api/relatorios/*` - Relatórios

---

## 🐛 Troubleshooting

### PWA não instala
```bash
# Verifique HTTPS ou localhost
# Limpe cache do navegador
# Confirme manifest.json e service-worker.js
```

### Erro no banco
```bash
npx prisma db push --force-reset
npx prisma generate
```

### Build error
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 🎰 Sobre ACATH

**Associação Canaense Absolut de Texas Hold'em**  
Clube de poker em Canaã dos Carajás - PA

---

## 👨‍💻 Desenvolvedor

**Alan Araújo**  
GitHub: [@alanaraujo-bit](https://github.com/alanaraujo-bit)

---

**Made with ♠️ by Absolut Poker Club**
