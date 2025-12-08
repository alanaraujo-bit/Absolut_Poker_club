import { NextResponse } from 'next/server'

export async function GET() {
  // Retorna as configurações PIX do servidor
  return NextResponse.json({
    chavePix: process.env.NEXT_PUBLIC_PIX_KEY || '',
    merchantName: process.env.NEXT_PUBLIC_PIX_MERCHANT_NAME || '',
    merchantCity: process.env.NEXT_PUBLIC_PIX_MERCHANT_CITY || '',
  })
}
