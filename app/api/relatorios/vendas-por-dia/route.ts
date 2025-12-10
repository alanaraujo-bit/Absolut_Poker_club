import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Usar timezone UTC-3 (horário de Brasília)
    const agora = new Date()
    const offsetBrasilia = -3 * 60
    const offsetLocal = agora.getTimezoneOffset()
    const diffMinutos = offsetBrasilia - offsetLocal
    
    const agoraBrasilia = new Date(agora.getTime() + diffMinutos * 60 * 1000)
    
    // Últimos 7 dias em Brasília
    const seteDiasAtras = new Date(Date.UTC(
      agoraBrasilia.getFullYear(),
      agoraBrasilia.getMonth(),
      agoraBrasilia.getDate() - 6,
      3, 0, 0
    ))

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

    // Agrupar por dia (convertendo para horário de Brasília)
    const vendasPorDia: any = {}
    
    comandas.forEach(comanda => {
      const dataUTC = new Date(comanda.dataAbertura)
      // Converter para horário de Brasília
      const dataBrasilia = new Date(dataUTC.getTime() + diffMinutos * 60 * 1000)
      const chave = `${dataBrasilia.getFullYear()}-${String(dataBrasilia.getMonth() + 1).padStart(2, '0')}-${String(dataBrasilia.getDate()).padStart(2, '0')}`
      
      if (!vendasPorDia[chave]) {
        vendasPorDia[chave] = {
          data: new Date(dataBrasilia.getFullYear(), dataBrasilia.getMonth(), dataBrasilia.getDate()).toISOString(),
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

    // Log para debug
    console.log('Vendas por Dia:', {
      dataHoraBrasilia: agoraBrasilia.toLocaleString('pt-BR'),
      seteDiasAtras: seteDiasAtras.toISOString(),
      comandasEncontradas: comandas.length,
      diasComVendas: resultado.length,
    })

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
