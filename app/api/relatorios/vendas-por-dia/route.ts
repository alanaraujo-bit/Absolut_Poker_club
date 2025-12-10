import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Últimos 7 dias
    const hoje = new Date()
    const seteDiasAtras = new Date(hoje)
    seteDiasAtras.setDate(hoje.getDate() - 6)
    seteDiasAtras.setHours(0, 0, 0, 0)

    // Buscar todas as comandas dos últimos 7 dias
    const comandas = await prisma.comanda.findMany({
      where: {
        dataAbertura: {
          gte: seteDiasAtras,
        },
      },
      orderBy: {
        dataAbertura: 'asc',
      },
    })

    // Agrupar por dia
    const vendasPorDia: any = {}
    
    comandas.forEach(comanda => {
      const data = new Date(comanda.dataAbertura)
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
      
      if (!vendasPorDia[chave]) {
        vendasPorDia[chave] = {
          data: new Date(data.getFullYear(), data.getMonth(), data.getDate()).toISOString(),
          total: 0,
          pedidos: 0,
        }
      }
      
      vendasPorDia[chave].total += Number(comanda.valorTotal)
      vendasPorDia[chave].pedidos += 1
    })

    // Converter para array e ordenar
    const resultado = Object.values(vendasPorDia).sort((a: any, b: any) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    )

    return NextResponse.json(resultado, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar vendas por dia:', error)
    return NextResponse.json({ error: 'Erro ao buscar vendas' }, { status: 500 })
  }
}
