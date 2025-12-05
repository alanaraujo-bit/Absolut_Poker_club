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
    body: data.vendas.map(venda => [
      new Date(venda.data).toLocaleDateString('pt-BR'),
      venda.pedidos.toString(),
      formatCurrency(venda.total)
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
    body: data.pedidosRecentes.map(pedido => [
      `#${pedido.id}`,
      new Date(pedido.createdAt).toLocaleString('pt-BR'),
      formatCurrency(pedido.total)
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
