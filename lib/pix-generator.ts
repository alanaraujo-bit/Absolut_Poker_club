/**
 * Gerador de PIX QR Code
 * Gera o payload EMV padrão do PIX para pagamentos
 */

export interface PixConfig {
  chavePix: string // Chave PIX (CPF, CNPJ, email, telefone, aleatória)
  merchantName: string // Nome do estabelecimento
  merchantCity: string // Cidade do estabelecimento
  valor?: number // Valor da transação (opcional)
  txid?: string // Identificador da transação (opcional)
  description?: string // Descrição do pagamento (opcional)
}

/**
 * Calcula o CRC16 CCITT para validação do payload PIX
 */
function crc16(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Remove acentos e caracteres especiais de uma string
 */
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
}

/**
 * Limpa e formata a chave PIX (remove pontos, traços, etc)
 */
function cleanPixKey(key: string): string {
  // Remove todos os caracteres não alfanuméricos (exceto @ para email)
  if (key.includes('@')) {
    return key.toLowerCase().trim()
  }
  // Para CPF, CNPJ, telefone: apenas números e + (para telefone internacional)
  return key.replace(/[^0-9+]/g, '')
}

/**
 * Formata um campo do payload PIX no formato EMV
 * ID (2 dígitos) + Tamanho (2 dígitos) + Valor
 */
function formatEMV(id: string, value: string): string {
  const size = value.length.toString().padStart(2, '0')
  return `${id}${size}${value}`
}

/**
 * Gera o payload PIX completo no formato EMV
 */
export function generatePixPayload(config: PixConfig): string {
  // Limpa e formata os dados
  const chavePix = cleanPixKey(config.chavePix)
  const merchantName = removeAccents(config.merchantName).substring(0, 25)
  const merchantCity = removeAccents(config.merchantCity).substring(0, 15)

  // Payload Format Indicator
  let payload = formatEMV('00', '01')

  // Merchant Account Information
  let merchantAccount = formatEMV('00', 'BR.GOV.BCB.PIX')
  merchantAccount += formatEMV('01', chavePix)
  
  payload += formatEMV('26', merchantAccount)

  // Merchant Category Code (0000 = não especificado)
  payload += formatEMV('52', '0000')

  // Transaction Currency (986 = BRL)
  payload += formatEMV('53', '986')

  // Transaction Amount (se especificado)
  if (config.valor && config.valor > 0) {
    payload += formatEMV('54', config.valor.toFixed(2))
  }

  // Country Code
  payload += formatEMV('58', 'BR')

  // Merchant Name
  payload += formatEMV('59', merchantName)

  // Merchant City
  payload += formatEMV('60', merchantCity)

  // Additional Data Field (txid)
  if (config.txid) {
    const additionalData = formatEMV('05', config.txid)
    payload += formatEMV('62', additionalData)
  }

  // CRC16
  payload += '6304'
  const crc = crc16(payload)
  payload += crc

  return payload
}

/**
 * Configurações padrão do estabelecimento
 * As configurações são lidas das variáveis de ambiente
 */
export const DEFAULT_PIX_CONFIG = {
  chavePix: '03752390220',
  merchantName: 'FELIPE CARVALHO DE PAULO',
  merchantCity: 'CANAA DOS CARAJAS',
}

/**
 * Gera um payload PIX com as configurações padrão do estabelecimento
 */
export function generatePixForComanda(
  comandaId: number,
  valor: number,
  config?: { chavePix?: string; merchantName?: string; merchantCity?: string }
): string {
  // Gera um txid único com timestamp para evitar duplicação
  const timestamp = Date.now().toString().slice(-8)
  const txid = `C${comandaId.toString().padStart(6, '0')}${timestamp}`
  
  return generatePixPayload({
    ...DEFAULT_PIX_CONFIG,
    ...config,
    valor,
    txid: txid.substring(0, 25), // Limita a 25 caracteres
  })
}
