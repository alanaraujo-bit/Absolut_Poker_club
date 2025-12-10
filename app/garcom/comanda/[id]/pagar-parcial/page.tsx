'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ArrowLeft, Plus, Minus, Copy, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { generatePixForComanda } from '@/lib/pix-generator'

type ItemComanda = {
  id: number
  produto: {
    id: number
    nome: string
    unidadeMedida: string
  }
  quantidade: number
  precoUnitario: number
  subtotal: number
}

type Comanda = {
  id: number
  cliente: {
    nome: string
  }
  valorTotal: number
  itens: ItemComanda[]
}

type ItemPagamento = {
  itemId: number
  quantidade: number
  maxQuantidade: number
  precoUnitario: number
  nome: string
  unidadeMedida: string
}

const formasPagamento = [
  { value: 'dinheiro', label: '💵 Dinheiro' },
  { value: 'pix', label: '📱 PIX' },
  { value: 'credito', label: '💳 Crédito' },
  { value: 'debito', label: '💳 Débito' },
]

export default function PagarParcialPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [comanda, setComanda] = useState<Comanda | null>(null)
  const [itensSelecionados, setItensSelecionados] = useState<Map<number, ItemPagamento>>(new Map())
  const [formaPagamento, setFormaPagamento] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarQrCode, setMostrarQrCode] = useState(false)
  const [pixPayload, setPixPayload] = useState('')

  useEffect(() => {
    carregarComanda()
  }, [])

  const carregarComanda = async () => {
    const res = await fetch(`/api/comandas/${params.id}`)
    const data = await res.json()
    setComanda(data)
  }

  const toggleItem = (item: ItemComanda) => {
    const novosItens = new Map(itensSelecionados)
    
    if (novosItens.has(item.id)) {
      novosItens.delete(item.id)
    } else {
      novosItens.set(item.id, {
        itemId: item.id,
        quantidade: Number(item.quantidade),
        maxQuantidade: Number(item.quantidade),
        precoUnitario: Number(item.precoUnitario),
        nome: item.produto.nome,
        unidadeMedida: item.produto.unidadeMedida,
      })
    }
    
    setItensSelecionados(novosItens)
  }

  const ajustarQuantidade = (itemId: number, delta: number) => {
    const novosItens = new Map(itensSelecionados)
    const item = novosItens.get(itemId)
    
    if (!item) return

    const novaQtd = item.quantidade + delta
    
    if (novaQtd <= 0) {
      novosItens.delete(itemId)
    } else if (novaQtd <= item.maxQuantidade) {
      item.quantidade = novaQtd
      novosItens.set(itemId, item)
    }
    
    setItensSelecionados(novosItens)
  }

  const alterarQuantidade = (itemId: number, valor: string) => {
    const novosItens = new Map(itensSelecionados)
    const item = novosItens.get(itemId)
    
    if (!item) return

    const novaQtd = parseFloat(valor.replace(',', '.'))
    
    if (isNaN(novaQtd) || novaQtd <= 0) {
      novosItens.delete(itemId)
    } else if (novaQtd <= item.maxQuantidade) {
      item.quantidade = novaQtd
      novosItens.set(itemId, item)
    } else {
      toast({
        title: '⚠️ Quantidade inválida',
        description: `Máximo disponível: ${item.maxQuantidade}`,
        variant: 'destructive',
      })
    }
    
    setItensSelecionados(novosItens)
  }

  const calcularTotal = () => {
    let total = 0
    itensSelecionados.forEach(item => {
      total += item.quantidade * item.precoUnitario
    })
    return total
  }

  const handleFormaPagamentoChange = (forma: string) => {
    setFormaPagamento(forma)
    
    // Se selecionou PIX, gera o payload
    if (forma === 'pix') {
      const totalPagar = calcularTotal()
      const payload = generatePixForComanda(parseInt(params.id), totalPagar)
      setPixPayload(payload)
      setMostrarQrCode(true)
    } else {
      setMostrarQrCode(false)
    }
  }

  const copiarCodigoPix = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pixPayload)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = pixPayload
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      toast({
        title: '✅ Código copiado!',
        description: 'Cole no app do seu banco para pagar',
      })
    } catch (error) {
      console.error('Erro ao copiar:', error)
      toast({
        title: '❌ Erro ao copiar',
        description: 'Tente selecionar e copiar manualmente',
        variant: 'destructive',
      })
    }
  }

  const processarPagamento = async () => {
    if (itensSelecionados.size === 0) {
      toast({
        title: '⚠️ Nenhum item selecionado',
        description: 'Selecione pelo menos um item para pagar',
        variant: 'destructive',
      })
      return
    }

    if (!formaPagamento) {
      toast({
        title: '⚠️ Forma de pagamento',
        description: 'Selecione uma forma de pagamento',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const itensPagamento = Array.from(itensSelecionados.values()).map(item => ({
        itemId: item.itemId,
        quantidade: item.quantidade,
      }))

      const res = await fetch(`/api/comandas/${params.id}/pagar-parcial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itensPagamento,
          formaPagamento,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      const resultado = await res.json()

      toast({
        title: '✅ Pagamento realizado!',
        description: resultado.mensagem,
      })

      router.push('/garcom')
    } catch (error: any) {
      toast({
        title: '❌ Erro',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!comanda) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalPagar = calcularTotal()

  return (
    <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark pb-20">
      <header className="glass-dark border-b border-primary/20 p-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <h1 className="text-lg font-bold gold-text">Pagamento Parcial</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="glass-poker rounded-xl p-4">
          <h2 className="text-xl font-bold mb-1">{comanda.cliente.nome}</h2>
          <p className="text-sm text-muted-foreground">
            Comanda #{comanda.id} • Total: R$ {comanda.valorTotal.toFixed(2)}
          </p>
        </div>

        <div className="glass-poker rounded-xl p-4">
          <h3 className="font-bold gold-text mb-3">📋 Selecione os itens para pagar</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Toque nos itens e ajuste as quantidades
          </p>

          <div className="space-y-2">
            {comanda.itens.map((item) => {
              const selecionado = itensSelecionados.has(item.id)
              const itemPagamento = itensSelecionados.get(item.id)

              return (
                <motion.div
                  key={item.id}
                  className={`poker-card p-3 border-2 transition-all ${
                    selecionado ? 'border-primary bg-primary/10' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleItem(item)}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            selecionado
                              ? 'bg-primary border-primary'
                              : 'border-primary/30 hover:border-primary'
                          }`}
                        >
                          {selecionado && <Check className="w-4 h-4 text-white" />}
                        </button>
                        <div>
                          <p className="font-medium">{item.produto.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            Disponível: {item.quantidade}
                            {item.produto.unidadeMedida === 'kg' ? 'kg' : ' un'} × R${' '}
                            {Number(item.precoUnitario).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="font-bold gold-text">
                      R$ {Number(item.subtotal).toFixed(2)}
                    </p>
                  </div>

                  {selecionado && itemPagamento && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-primary/20"
                    >
                      <p className="text-sm font-medium mb-2">Quantidade a pagar:</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => ajustarQuantidade(item.id, -1)}
                          className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-all"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <Input
                          type="text"
                          value={itemPagamento.quantidade}
                          onChange={(e) => alterarQuantidade(item.id, e.target.value)}
                          className="text-center font-bold text-lg h-10"
                        />
                        <button
                          onClick={() => ajustarQuantidade(item.id, 1)}
                          className="w-10 h-10 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 flex items-center justify-center transition-all"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-center mt-2 text-muted-foreground">
                        Subtotal: R${' '}
                        {(itemPagamento.quantidade * itemPagamento.precoUnitario).toFixed(2)}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {itensSelecionados.size > 0 && (
          <>
            <div className="glass-poker rounded-xl p-4">
              <h3 className="font-bold gold-text mb-3">💳 Forma de Pagamento</h3>
              <div className="grid grid-cols-2 gap-2">
                {formasPagamento.map((forma) => (
                  <button
                    key={forma.value}
                    onClick={() => handleFormaPagamentoChange(forma.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formaPagamento === forma.value
                        ? 'border-primary bg-primary/20 font-bold'
                        : 'border-primary/20 hover:border-primary/50'
                    }`}
                  >
                    {forma.label}
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code PIX */}
            {mostrarQrCode && pixPayload && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-poker rounded-xl p-4"
              >
                <h3 className="font-bold gold-text mb-3 text-center">📱 QR Code PIX</h3>
                
                <div className="bg-white p-4 rounded-xl mb-4">
                  <QRCodeSVG
                    id="qrcode-pix"
                    value={pixPayload}
                    size={256}
                    level="H"
                    className="mx-auto"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    onClick={copiarCodigoPix}
                    className="w-full btn-poker-primary h-12 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    Copiar Código PIX
                  </button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Escaneie o QR Code ou copie o código para pagar
                  </p>
                </div>
              </motion.div>
            )}

            <div className="glass-poker rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Itens selecionados:</span>
                <span className="font-bold">{itensSelecionados.size}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                <span className="text-lg font-bold">Total a Pagar:</span>
                <span className="text-2xl font-bold gold-text">
                  R$ {totalPagar.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={processarPagamento}
              disabled={loading || !formaPagamento}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-6 h-6" />
              {loading ? 'Processando...' : 'Confirmar Pagamento Parcial'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
