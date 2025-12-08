import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Formatar valor para input de moeda (sem símbolo R$)
export function formatCurrencyInput(value: string): string {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '')
  
  if (!numbers) return ''
  
  // Converte para número e divide por 100 para ter os centavos
  const amount = parseFloat(numbers) / 100
  
  // Formata com 2 casas decimais
  return amount.toFixed(2).replace('.', ',')
}

// Converter valor formatado de volta para número
export function parseCurrencyInput(value: string): number {
  const numbers = value.replace(/\D/g, '')
  return parseFloat(numbers) / 100
}
