import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from './utils'

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

export function generateRelatorioPDF(data: RelatorioData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  
  const goldColor: [number, number, number] = [212, 175, 55]
  const darkGold: [number, number, number] = [184, 150, 12]
  const blackBg: [number, number, number] = [10, 10, 10]
  
  // Background preto
  doc.setFillColor(...blackBg)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Header
  doc.setFillColor(...goldColor)
  doc.rect(0, 0, pageWidth, 35, 'F')
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('ABSOLUT POKER CLUB', pageWidth / 2, 12, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('ACATH - Associacao Canaense Absolut de Texas Hold\'em', pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(9)
  doc.text('Canaa dos Carajas - PA', pageWidth / 2, 27, { align: 'center' })
  
  doc.setDrawColor(...darkGold)
  doc.setLineWidth(1.5)
  doc.line(0, 35, pageWidth, 35)
  
  let yPos = 45
  
  // Título
  doc.setTextColor(...goldColor)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATORIO DE VENDAS', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Periodo: ${data.periodo}`, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 5
  doc.setFontSize(8)
  doc.setTextColor(200, 200, 200)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 12
  
  // Cards de resumo
  doc.setFillColor(26, 26, 26)
  doc.roundedRect(15, yPos, 80, 22, 3, 3, 'F')
  doc.roundedRect(110, yPos, 80, 22, 3, 3, 'F')
  
  doc.setDrawColor(...goldColor)
  doc.setLineWidth(0.5)
  doc.roundedRect(15, yPos, 80, 22, 3, 3, 'S')
  doc.roundedRect(110, yPos, 80, 22, 3, 3, 'S')
  
  doc.setTextColor(...goldColor)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('FATURAMENTO TOTAL', 55, yPos + 7, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(formatCurrency(data.totalGeral), 55, yPos + 16, { align: 'center' })
  
  doc.setTextColor(...goldColor)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL DE PEDIDOS', 150, yPos + 7, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(data.totalPedidos.toString(), 150, yPos + 16, { align: 'center' })
  
  yPos += 30
  
  // Tabela Top Produtos
  doc.setTextColor(...goldColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOP 5 PRODUTOS MAIS VENDIDOS', 15, yPos)
  
  yPos += 6
  
  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Produto', 'Qtd', 'Faturamento']],
    body: data.topProdutos.map((produto, index) => [
      `${index + 1}`,
      produto.nome,
      produto.quantidade.toString(),
      formatCurrency(produto.totalVendido)
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: goldColor,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fillColor: [26, 26, 26],
      textColor: [255, 255, 255],
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [20, 20, 20]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 90 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 40 }
    },
    margin: { left: 15, right: 15 }
  })
  
  yPos = (doc as any).lastAutoTable.finalY + 12
  
  if (yPos > pageHeight - 70) {
    doc.addPage()
    doc.setFillColor(...blackBg)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    yPos = 20
  }
  
  // Tabela Vendas por Dia
  doc.setTextColor(...goldColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('VENDAS POR DIA', 15, yPos)
  
  yPos += 6
  
  autoTable(doc, {
    startY: yPos,
    head: [['Data', 'Pedidos', 'Faturamento']],
    body: data.vendas.map(venda => {
      // Criar data sem conversão de timezone
      const dataISO = venda.data.split('T')[0]
      const [ano, mes, dia] = dataISO.split('-')
      const dataFormatada = `${dia}/${mes}/${ano}`
      return [
        dataFormatada,
        venda.pedidos.toString(),
        formatCurrency(venda.total)
      ]
    }),
    theme: 'grid',
    headStyles: {
      fillColor: goldColor,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fillColor: [26, 26, 26],
      textColor: [255, 255, 255],
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [20, 20, 20]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 55 },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'right', cellWidth: 50 }
    },
    margin: { left: 15, right: 15 }
  })
  
  yPos = (doc as any).lastAutoTable.finalY + 12
  
  if (yPos > pageHeight - 70) {
    doc.addPage()
    doc.setFillColor(...blackBg)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    yPos = 20
  }
  
  // Tabela Pedidos Recentes
  doc.setTextColor(...goldColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('PEDIDOS RECENTES', 15, yPos)
  
  yPos += 6
  
  autoTable(doc, {
    startY: yPos,
    head: [['Pedido #', 'Data/Hora', 'Valor Total']],
    body: data.pedidosRecentes.map(pedido => {
      // Criar data ajustada para Brasília (UTC-3)
      const dataUTC = new Date(pedido.createdAt)
      dataUTC.setHours(dataUTC.getHours() - 3)
      const dataFormatada = dataUTC.toLocaleString('pt-BR', { timeZone: 'UTC' })
      return [
        `#${pedido.id}`,
        dataFormatada,
        formatCurrency(pedido.total)
      ]
    }),
    theme: 'grid',
    headStyles: {
      fillColor: goldColor,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fillColor: [26, 26, 26],
      textColor: [255, 255, 255],
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [20, 20, 20]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'center', cellWidth: 80 },
      2: { halign: 'right', cellWidth: 40 }
    },
    margin: { left: 15, right: 15 }
  })
  
  // Footer em todas as páginas
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    doc.setDrawColor(...goldColor)
    doc.setLineWidth(1)
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15)
    
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    doc.text('Absolut Poker Club - ACATH | (94) 99281-7389 | Canaa dos Carajas - PA', pageWidth / 2, pageHeight - 8, { align: 'center' })
    
    doc.setTextColor(...goldColor)
    doc.text(`Pag. ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' })
  }
  
  const filename = `Relatorio_ACATH_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

export function generateEstoquePDF(produtos: any[]) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  
  const goldColor: [number, number, number] = [212, 175, 55]
  const darkGold: [number, number, number] = [184, 150, 12]
  const blackBg: [number, number, number] = [10, 10, 10]
  
  doc.setFillColor(...blackBg)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  
  doc.setFillColor(...goldColor)
  doc.rect(0, 0, pageWidth, 35, 'F')
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('ABSOLUT POKER CLUB', pageWidth / 2, 12, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('ACATH - Relatorio de Estoque', pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(8)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 27, { align: 'center' })
  
  doc.setDrawColor(...darkGold)
  doc.setLineWidth(1.5)
  doc.line(0, 35, pageWidth, 35)
  
  autoTable(doc, {
    startY: 45,
    head: [['Produto', 'Preco Custo', 'Preco Venda', 'Estoque', 'Status']],
    body: produtos.map(produto => [
      produto.nome,
      formatCurrency(produto.precoCusto),
      formatCurrency(produto.precoVenda),
      produto.estoqueAtual.toString(),
      produto.estoqueAtual < produto.estoqueMinimo ? 'BAIXO' : 'OK'
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: goldColor,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fillColor: [26, 26, 26],
      textColor: [255, 255, 255],
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [20, 20, 20]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 70 },
      1: { halign: 'right', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 25 }
    },
    margin: { left: 15, right: 15 }
  })
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(...goldColor)
    doc.setLineWidth(1)
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15)
    
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('Absolut Poker Club - ACATH | (94) 99281-7389', pageWidth / 2, pageHeight - 8, { align: 'center' })
    
    doc.setTextColor(...goldColor)
    doc.text(`Pag. ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' })
  }
  
  const filename = `Estoque_ACATH_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

export function generatePedidoPDF(pedido: any, itens: any[]) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  
  const goldColor: [number, number, number] = [212, 175, 55]
  const darkGold: [number, number, number] = [184, 150, 12]
  const blackBg: [number, number, number] = [10, 10, 10]
  
  doc.setFillColor(...blackBg)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  
  doc.setFillColor(...goldColor)
  doc.rect(0, 0, pageWidth, 45, 'F')
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('ABSOLUT POKER CLUB', pageWidth / 2, 15, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('ACATH - Associacao Canaense Absolut de Texas Hold\'em', pageWidth / 2, 24, { align: 'center' })
  
  doc.setFontSize(9)
  doc.text('Canaa dos Carajas - PA', pageWidth / 2, 31, { align: 'center' })
  doc.text('(94) 99281-7389 | (94) 99182-4023', pageWidth / 2, 38, { align: 'center' })
  
  doc.setDrawColor(...darkGold)
  doc.setLineWidth(2)
  doc.line(0, 45, pageWidth, 45)
  
  let yPos = 60
  
  doc.setTextColor(...goldColor)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROVANTE DE PEDIDO', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 12
  
  // Info do pedido
  doc.setFillColor(26, 26, 26)
  doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F')
  doc.setDrawColor(...goldColor)
  doc.setLineWidth(0.5)
  doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'S')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Pedido:', 20, yPos + 9)
  doc.text('Data:', 20, yPos + 18)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...goldColor)
  doc.text(`#${pedido.id || 'N/A'}`, 45, yPos + 9)
  doc.text(new Date().toLocaleString('pt-BR'), 45, yPos + 18)
  
  yPos += 35
  
  // Tabela de itens
  doc.setTextColor(...goldColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('ITENS DO PEDIDO', 15, yPos)
  
  yPos += 6
  
  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Qtd', 'Preco Unit.', 'Subtotal']],
    body: itens.map(item => [
      item.nome,
      item.quantidade.toString(),
      formatCurrency(item.precoUnitario),
      formatCurrency(item.subtotal)
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: goldColor,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    bodyStyles: {
      fillColor: [26, 26, 26],
      textColor: [255, 255, 255],
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [20, 20, 20]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 85 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 }
    },
    margin: { left: 15, right: 15 }
  })
  
  yPos = (doc as any).lastAutoTable.finalY + 12
  
  // Total
  doc.setFillColor(...goldColor)
  doc.roundedRect(pageWidth - 90, yPos, 75, 18, 3, 3, 'F')
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', pageWidth - 85, yPos + 7)
  doc.setFontSize(14)
  doc.text(formatCurrency(pedido.total), pageWidth - 20, yPos + 12, { align: 'right' })
  
  yPos += 28
  
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.text('Obrigado pela preferencia!', pageWidth / 2, yPos, { align: 'center' })
  
  // Footer
  doc.setDrawColor(...goldColor)
  doc.setLineWidth(1)
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15)
  
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'normal')
  doc.text('Absolut Poker Club - ACATH', pageWidth / 2, pageHeight - 8, { align: 'center' })
  
  const filename = `Pedido_${pedido.id}_ACATH.pdf`
  doc.save(filename)
}

interface RelatorioClienteData {
  cliente: {
    id: number
    nome: string
    telefone: string | null
    cpf: string | null
    saldo: number
  }
  periodo: string
  estatisticas: {
    totalComandas: number
    totalGasto: number
    ticketMedio: number
    saldoAtual: number
  }
  produtosMaisComprados: Array<{
    nome: string
    quantidade: number
    total: number
  }>
  comandasDetalhadas: Array<{
    id: number
    dataAbertura: string
    dataFechamento: string | null
    valorTotal: number
    formaPagamento: string | null
    itens: Array<{
      produto: string
      quantidade: number
      precoUnitario: number
      subtotal: number
    }>
  }>
}

export function generateRelatorioClientePDF(data: RelatorioClienteData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  
  const goldColor: [number, number, number] = [212, 175, 55]
  const blackBg: [number, number, number] = [10, 10, 10]
  
  // Background
  doc.setFillColor(...blackBg)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Header
  doc.setFillColor(...goldColor)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('ABSOLUT POKER CLUB', pageWidth / 2, 15, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Relatório Individual', pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Período: ${getPeriodoLabel(data.periodo)}`, pageWidth / 2, 33, { align: 'center' })
  
  let yPos = 55
  
  // Informações do Cliente
  doc.setTextColor(...goldColor)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DADOS DO JOGADOR', 15, yPos)
  
  yPos += 8
  doc.setDrawColor(...goldColor)
  doc.setLineWidth(0.5)
  doc.line(15, yPos, pageWidth - 15, yPos)
  
  yPos += 8
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  doc.text(`Nome: ${data.cliente.nome}`, 20, yPos)
  yPos += 7
  
  if (data.cliente.telefone) {
    doc.text(`Telefone: ${data.cliente.telefone}`, 20, yPos)
    yPos += 7
  }
  
  if (data.cliente.cpf) {
    doc.text(`CPF: ${data.cliente.cpf}`, 20, yPos)
    yPos += 7
  }
  
  const saldoColor: [number, number, number] = data.cliente.saldo < 0 ? [255, 140, 0] : [0, 200, 0]
  doc.setTextColor(...saldoColor)
  doc.setFont('helvetica', 'bold')
  doc.text(`Saldo Atual: ${formatCurrency(Math.abs(data.cliente.saldo))}${data.cliente.saldo < 0 ? ' (deve)' : ''}`, 20, yPos)
  
  yPos += 15
  
  // Estatísticas
  doc.setTextColor(...goldColor)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('ESTATÍSTICAS', 15, yPos)
  
  yPos += 8
  doc.setDrawColor(...goldColor)
  doc.line(15, yPos, pageWidth - 15, yPos)
  
  yPos += 10
  
  const stats = [
    ['Total de Comandas', data.estatisticas.totalComandas.toString()],
    ['Total Gasto', formatCurrency(data.estatisticas.totalGasto)],
    ['Ticket Médio', formatCurrency(data.estatisticas.ticketMedio)]
  ]
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: stats,
    theme: 'plain',
    styles: {
      textColor: [255, 255, 255],
      fontSize: 11
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 90, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 90, textColor: goldColor }
    },
    margin: { left: 20, right: 20 }
  })
  
  yPos = (doc as any).lastAutoTable.finalY + 15
  
  // Produtos Favoritos
  if (data.produtosMaisComprados.length > 0) {
    doc.setTextColor(...goldColor)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PRODUTOS FAVORITOS', 15, yPos)
    
    yPos += 8
    doc.setDrawColor(...goldColor)
    doc.line(15, yPos, pageWidth - 15, yPos)
    
    yPos += 5
    
    const produtosData = data.produtosMaisComprados.slice(0, 5).map((p, i) => [
      `${i + 1}º`,
      p.nome,
      p.quantidade.toString(),
      formatCurrency(p.total)
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Produto', 'Qtd', 'Total']],
      body: produtosData,
      theme: 'plain',
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: goldColor,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fillColor: [20, 20, 20],
        textColor: [255, 255, 255],
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [15, 15, 15]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 90 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 45 }
      },
      margin: { left: 15, right: 15 }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 15
  }
  
  // Nova página para comandas detalhadas
  if (data.comandasDetalhadas.length > 0) {
    doc.addPage()
    
    // Background da nova página
    doc.setFillColor(...blackBg)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    
    yPos = 20
    
    doc.setTextColor(...goldColor)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('HISTÓRICO DE COMANDAS', 15, yPos)
    
    yPos += 8
    doc.setDrawColor(...goldColor)
    doc.line(15, yPos, pageWidth - 15, yPos)
    
    yPos += 10
    
    data.comandasDetalhadas.forEach((comanda, index) => {
      if (yPos > pageHeight - 40) {
        doc.addPage()
        doc.setFillColor(...blackBg)
        doc.rect(0, 0, pageWidth, pageHeight, 'F')
        yPos = 20
      }
      
      doc.setTextColor(...goldColor)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`Comanda #${comanda.id}`, 20, yPos)
      
      doc.setTextColor(200, 200, 200)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      let dataFechamento = 'Em aberto'
      if (comanda.dataFechamento) {
        const dataISO = comanda.dataFechamento.split('T')[0]
        const [ano, mes, dia] = dataISO.split('-')
        dataFechamento = `${dia}/${mes}/${ano}`
      }
      doc.text(`${dataFechamento}${comanda.formaPagamento ? ' • ' + comanda.formaPagamento : ''}`, 20, yPos + 5)
      
      yPos += 10
      
      const itensData = comanda.itens.map(item => [
        item.produto,
        item.quantidade.toString(),
        formatCurrency(item.precoUnitario),
        formatCurrency(item.subtotal)
      ])
      
      autoTable(doc, {
        startY: yPos,
        head: [['Produto', 'Qtd', 'Preço', 'Subtotal']],
        body: itensData,
        theme: 'plain',
        headStyles: {
          fillColor: [30, 30, 30],
          textColor: [180, 180, 180],
          fontSize: 8
        },
        bodyStyles: {
          fillColor: [15, 15, 15],
          textColor: [220, 220, 220],
          fontSize: 8
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 85 },
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'right', cellWidth: 35 },
          3: { halign: 'right', cellWidth: 35 }
        },
        margin: { left: 20, right: 20 }
      })
      
      yPos = (doc as any).lastAutoTable.finalY + 5
      
      // Total da comanda
      doc.setFillColor(30, 30, 30)
      doc.roundedRect(pageWidth - 90, yPos, 70, 10, 2, 2, 'F')
      
      doc.setTextColor(...goldColor)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Total:', pageWidth - 85, yPos + 7)
      doc.text(formatCurrency(comanda.valorTotal), pageWidth - 25, yPos + 7, { align: 'right' })
      
      yPos += 18
    })
  }
  
  // Footer em todas as páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...goldColor)
    doc.setLineWidth(0.5)
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15)
    
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    doc.text('Absolut Poker Club - ACATH', pageWidth / 2, pageHeight - 8, { align: 'center' })
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 20, pageHeight - 8, { align: 'right' })
  }
  
  const filename = `Relatorio_${data.cliente.nome.replace(/\s+/g, '_')}_${data.periodo}_ACATH.pdf`
  doc.save(filename)
}

function getPeriodoLabel(periodo: string): string {
  switch (periodo) {
    case 'hoje': return 'Hoje'
    case 'semana': return 'Última Semana'
    case 'mes': return 'Último Mês'
    case 'todos': return 'Todos os Períodos'
    default: return periodo
  }
}

