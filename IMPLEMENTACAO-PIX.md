# 💳 Sistema de Pagamento PIX

## 🎯 Funcionalidade

O sistema agora possui geração automática de QR Code PIX para pagamentos de comandas!

## ✨ Como Funciona

1. **Fechamento de Comanda**: Quando o garçom vai fechar uma comanda, ele seleciona a forma de pagamento
2. **Seleção PIX**: Ao escolher "PIX", um QR Code é gerado automaticamente
3. **QR Code Bonito**: Um QR Code profissional é exibido com:
   - ✅ QR Code grande e legível (240x240px)
   - ✅ Valor destacado em dourado
   - ✅ Código PIX Copia e Cola
   - ✅ Botão para copiar o código
   - ✅ Botão para baixar o QR Code como imagem
   - ✅ Instruções de uso

## ⚙️ Configuração

### 1. Configure sua Chave PIX

Edite o arquivo `.env` (ou crie se não existir) e adicione:

```env
# Sua chave PIX (CPF, CNPJ, email, telefone ou aleatória)
NEXT_PUBLIC_PIX_KEY=sua.chave@pix.com

# Nome do estabelecimento (máx 25 caracteres, SEM ACENTOS)
NEXT_PUBLIC_PIX_MERCHANT_NAME=ABSOLUTE POKER CLUB

# Cidade (SEM ACENTOS)
NEXT_PUBLIC_PIX_MERCHANT_CITY=SAO PAULO
```

### 2. Exemplos de Chaves PIX Válidas

```env
# CPF
NEXT_PUBLIC_PIX_KEY=12345678900

# CNPJ
NEXT_PUBLIC_PIX_KEY=12345678000199

# Email
NEXT_PUBLIC_PIX_KEY=pagamentos@absolutepoker.com.br

# Telefone (com DDI)
NEXT_PUBLIC_PIX_KEY=+5511999999999

# Chave Aleatória (gerada pelo banco)
NEXT_PUBLIC_PIX_KEY=123e4567-e89b-12d3-a456-426614174000
```

### 3. Importante

- ⚠️ **NÃO use acentos** no nome do estabelecimento e cidade
- ⚠️ O nome deve ter **no máximo 25 caracteres**
- ⚠️ A cidade deve estar em **MAIÚSCULAS**
- ✅ Teste o QR Code com seu celular antes de usar em produção

## 🎨 Design

O QR Code possui:
- **Fundo branco** para melhor leitura
- **Bordas arredondadas** com sombra
- **Tamanho otimizado** (240x240px) para fácil escaneamento
- **Animação suave** ao aparecer
- **Design profissional** que combina com o tema poker

## 📱 Funcionalidades do Cliente

O cliente pode:
1. **Escanear o QR Code** direto com a câmera do banco
2. **Copiar o código** e colar no app do banco
3. **Ver o valor** claramente destacado
4. **Ler instruções** de como pagar

## 🔧 Arquivos Modificados

- `app/garcom/comanda/[id]/fechar/page.tsx` - Página de fechamento com QR Code
- `lib/pix-generator.ts` - Gerador de payload PIX padrão EMV
- `.env.example` - Exemplo de configuração

## 🚀 Próximos Passos

1. Configure sua chave PIX no arquivo `.env`
2. Reinicie o servidor de desenvolvimento: `npm run dev`
3. Teste fechando uma comanda e selecionando PIX
4. Escaneie o QR Code com seu celular para validar

## 💡 Dicas

- O payload PIX segue o padrão **EMV** do Banco Central
- O QR Code funciona com **qualquer app bancário brasileiro**
- O **txid** é gerado automaticamente com o ID da comanda
- Você pode **baixar o QR Code** para enviar por WhatsApp se necessário

## 📞 Suporte

Se tiver dúvidas sobre como obter sua chave PIX, entre em contato com seu banco.

---

**Desenvolvido com 💚 para Absolute Poker Club**
