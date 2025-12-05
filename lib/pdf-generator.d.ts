interface PedidoRecente {
  id: number
  total: number
  createdAt: string
}

interface TopProduto {
  nome: string
  totalVendido: number
  quantidade: number
}

interface VendaDiaria {
  data: string
  total: number
  pedidos: number
}

interface RelatorioData {
  periodo: string
  vendas: VendaDiaria[]
  topProdutos: TopProduto[]
  pedidosRecentes: PedidoRecente[]
  totalGeral: number
  totalPedidos: number
}

export function generateRelatorioPDF(data: RelatorioData): void
export function generateEstoquePDF(produtos: any[]): void
export function generatePedidoPDF(pedido: any, itens: any[]): void
