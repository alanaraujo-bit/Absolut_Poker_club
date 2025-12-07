# 🔧 Sistema de Acesso Desenvolvedor

## 📋 Visão Geral

Sistema completo de acesso privilegiado para desenvolvedores com capacidade de gerenciamento total do banco de dados.

---

## 🔐 Credenciais de Acesso

```
📧 E-mail: alanvitoraraujo1a@outlook.com
🔑 Senha: Sucesso@2025#
```

---

## 🚀 Como Acessar

### Opção 1: Modo Desenvolvedor na Tela de Login
1. Acesse a página de login: `/login`
2. Clique no botão secreto **• • •** no rodapé do formulário
3. O texto mudará para **"🔧 Modo Desenvolvedor Ativo"**
4. Digite o e-mail e senha de desenvolvedor
5. Clique em "Entrar"

### Opção 2: Login Direto com E-mail
1. Acesse a página de login: `/login`
2. Digite o e-mail completo (sistema detecta automaticamente que é desenvolvedor)
3. Digite a senha
4. Clique em "Entrar"

### Acesso Direto ao Painel
- URL direta: `/developer`
- Será redirecionado automaticamente após o login

---

## 🎯 Funcionalidades do Painel

### 📊 Estatísticas em Tempo Real

O painel exibe:
- **Total de Usuários** cadastrados no sistema
- **Total de Clientes** registrados
- **Total de Produtos** no estoque
- **Total de Comandas** (abertas + fechadas)
- **Total de Pedidos** realizados
- **Total de Itens de Pedido** vendidos
- **Total de Itens de Comanda** registrados

Todas as estatísticas são atualizadas automaticamente a cada **5 segundos**.

### 🗑️ Limpar Todos os Dados

**Ação Destrutiva** - Remove TODOS os dados do banco de dados:
- ❌ Exclui todos os usuários (exceto dev)
- ❌ Exclui todos os clientes
- ❌ Exclui todos os produtos
- ❌ Exclui todas as comandas
- ❌ Exclui todos os pedidos
- ❌ Exclui todos os itens

**⚠️ ATENÇÃO:** Esta ação é irreversível!

**Como usar:**
1. Clique no botão vermelho "Limpar Todos os Dados"
2. Confirme a ação no diálogo de confirmação
3. Aguarde a mensagem de sucesso

### 🔄 Resetar com Dados Demo

**Ação Semi-Destrutiva** - Limpa e repopula com dados de demonstração:
1. Remove todos os dados existentes
2. Cria usuários padrão:
   - Admin: `admin` / `admin123`
   - Garçom: `garcom` / `garcom123`
3. Cria clientes de exemplo
4. Cria produtos de exemplo
5. Cria comandas e pedidos de demonstração

**Como usar:**
1. Clique no botão amarelo "Resetar com Dados Demo"
2. Confirme a ação no diálogo de confirmação
3. Aguarde a mensagem de sucesso (pode demorar alguns segundos)

---

## 🏗️ Arquitetura Técnica

### Estrutura de Arquivos

```
app/
├── developer/
│   └── page.tsx              # Painel de controle
├── api/
│   └── dev/
│       ├── auth/
│       │   └── route.ts      # Autenticação de desenvolvedor
│       └── database/
│           └── route.ts      # Gerenciamento de banco de dados
└── login/
    └── page.tsx              # Login com detecção de dev

prisma/
├── schema.prisma             # Model DevUser
└── migrations/
    └── 20251207210505_add_dev_user/
        └── migration.sql     # Tabela dev_users

scripts/
└── create-dev-user.js        # Script de criação inicial
```

### Model DevUser

```prisma
model DevUser {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  senha     String    // Base64 hash
  nome      String
  ativo     Boolean   @default(true)
  lastLogin DateTime?
  createdAt DateTime  @default(now())
  
  @@map("dev_users")
}
```

### API Endpoints

#### POST /api/dev/auth
**Autenticação de Desenvolvedor**

Request:
```json
{
  "email": "alanvitoraraujo1a@outlook.com",
  "senha": "Sucesso@2025#"
}
```

Response Success (200):
```json
{
  "devUser": {
    "id": 1,
    "email": "alanvitoraraujo1a@outlook.com",
    "nome": "Alan Araújo - Developer",
    "ativo": true,
    "lastLogin": "2024-12-07T22:30:15.000Z"
  },
  "token": "DEV_ABSOLUT_POKER_2025"
}
```

Response Error (401):
```json
{
  "error": "Credenciais inválidas"
}
```

---

#### DELETE /api/dev/database
**Limpar Todos os Dados**

Headers:
```
Authorization: DEV_ABSOLUT_POKER_2025
```

Query Params:
```
?action=clear_all
```

Response Success (200):
```json
{
  "message": "Todos os dados foram excluídos com sucesso"
}
```

---

#### POST /api/dev/database
**Resetar com Dados Demo**

Headers:
```
Authorization: DEV_ABSOLUT_POKER_2025
```

Query Params:
```
?action=reset_demo
```

Response Success (200):
```json
{
  "message": "Banco de dados resetado com sucesso com dados demo"
}
```

---

#### GET /api/dev/database
**Obter Estatísticas**

Headers:
```
Authorization: DEV_ABSOLUT_POKER_2025
```

Response Success (200):
```json
{
  "usuarios": 5,
  "clientes": 12,
  "produtos": 8,
  "comandas": 23,
  "pedidos": 45,
  "itensPedido": 89,
  "itensComanda": 67
}
```

---

## 🔒 Segurança

### Token de Autenticação
- Token fixo: `DEV_ABSOLUT_POKER_2025`
- Obrigatório em todos os endpoints de gerenciamento
- Retornado após login bem-sucedido

### Validações
- ✅ E-mail e senha validados no banco
- ✅ Atualização de lastLogin a cada acesso
- ✅ Verificação de usuário ativo
- ✅ Token obrigatório para operações destrutivas

### Proteções
- 🛡️ Confirmação dupla para ações destrutivas
- 🛡️ Logs de todas as operações no console
- 🛡️ Botão secreto discreto na tela de login
- 🛡️ Modo dev visualmente destacado quando ativo

---

## 🧪 Testando o Sistema

### 1. Teste de Login
```bash
# Via PowerShell
$body = @{
    email = "alanvitoraraujo1a@outlook.com"
    senha = "Sucesso@2025#"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/dev/auth" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### 2. Teste de Estatísticas
```bash
Invoke-RestMethod -Uri "http://localhost:3000/api/dev/database" `
  -Headers @{ Authorization = "DEV_ABSOLUT_POKER_2025" }
```

### 3. Teste de Limpeza (CUIDADO!)
```bash
Invoke-RestMethod -Uri "http://localhost:3000/api/dev/database?action=clear_all" `
  -Method DELETE `
  -Headers @{ Authorization = "DEV_ABSOLUT_POKER_2025" }
```

---

## 📝 Fluxo de Uso Recomendado

### Desenvolvimento/Debug
1. Fazer login como desenvolvedor
2. Visualizar estatísticas em tempo real
3. Testar funcionalidades do sistema
4. Limpar dados quando necessário

### Antes de Demo/Apresentação
1. Acessar painel de desenvolvedor
2. Clicar em "Resetar com Dados Demo"
3. Confirmar ação
4. Aguardar conclusão
5. Fazer logout
6. Testar sistema com dados demo limpos

### Depois de Testes
1. Acessar painel de desenvolvedor
2. Clicar em "Limpar Todos os Dados"
3. Confirmar ação
4. Sistema volta ao estado zero

---

## 🚨 Avisos Importantes

⚠️ **NUNCA compartilhe as credenciais de desenvolvedor**

⚠️ **SEMPRE confirme antes de limpar dados em produção**

⚠️ **Limpar dados é IRREVERSÍVEL - não há backup automático**

⚠️ **Em produção, considere adicionar:**
- Autenticação JWT com expiração
- Logs de auditoria detalhados
- Backup automático antes de limpeza
- Whitelist de IPs permitidos
- Rate limiting nos endpoints

---

## 🔧 Manutenção

### Recriar Usuário Desenvolvedor
```bash
node scripts/create-dev-user.js
```

### Atualizar Senha
```sql
-- Conectar ao banco e executar:
UPDATE dev_users 
SET senha = '[NOVA_SENHA_BASE64]' 
WHERE email = 'alanvitoraraujo1a@outlook.com';
```

### Desativar Acesso Temporariamente
```sql
UPDATE dev_users 
SET ativo = false 
WHERE email = 'alanvitoraraujo1a@outlook.com';
```

---

## 📚 Referências

- Next.js 14 App Router
- Prisma ORM
- Framer Motion (animações)
- Tailwind CSS (estilização)
- Lucide React (ícones)

---

## ✅ Checklist de Implementação

- [x] Model DevUser no Prisma
- [x] Migration para tabela dev_users
- [x] Script de criação de usuário
- [x] API de autenticação (/api/dev/auth)
- [x] API de gerenciamento (/api/dev/database)
- [x] Página de painel (/developer)
- [x] Integração no login
- [x] Botão secreto no login
- [x] Detecção automática de e-mail
- [x] Estatísticas em tempo real
- [x] Função limpar dados
- [x] Função resetar com demo
- [x] Confirmações de ações destrutivas
- [x] Documentação completa

---

**Sistema desenvolvido para Absolute Poker Club**  
**Versão:** 1.0.0  
**Data:** Dezembro 2024
