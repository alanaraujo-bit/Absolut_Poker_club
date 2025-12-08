'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ArrowLeft, Copy, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { generatePixForComanda } from '@/lib/pix-generator'

type Comanda = {
  id: number
  cliente: {
    nome: string
  }
  valorTotal: number
  itens: any[]
}

const formasPagamento = [
  { value: 'dinheiro', label: '💵 Dinheiro' },
  { value: 'pix', label: '📱 PIX' },
  { value: 'credito', label: '💳 Crédito' },
  { value: 'debito', label: '💳 Débito' },
]

export default function FecharComandaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [comanda, setComanda] = useState<Comanda | null>(null)
  const [formaPagamento, setFormaPagamento] = useState('')
  const [observacao, setObservacao] = useState('')
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

  const handleFormaPagamentoChange = (forma: string) => {
    setFormaPagamento(forma)
    
    // Se selecionou PIX, gera o payload
    if (forma === 'pix' && comanda) {
      const payload = generatePixForComanda(comanda.id, comanda.valorTotal)
      setPixPayload(payload)
      setMostrarQrCode(true)
    } else {
      setMostrarQrCode(false)
    }
  }

  const copiarCodigoPix = async () => {
    try {
      // Tenta usar o Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pixPayload)
      } else {
        // Fallback para método antigo
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

  const baixarQrCode = () => {
    const svg = document.getElementById('qrcode-pix')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')

      const downloadLink = document.createElement('a')
      downloadLink.download = `qrcode-comanda-${params.id}.png`
      downloadLink.href = pngFile
      downloadLink.click()

      toast({
        title: '✅ QR Code baixado!',
        description: 'Imagem salva com sucesso',
      })
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const fecharComanda = async () => {
    if (!formaPagamento) {
      toast({
        title: '⚠️ Forma de pagamento',
        description: 'Selecione a forma de pagamento',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/comandas/${params.id}/fechar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formaPagamento,
          observacao,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      // Força atualização das estatísticas do dashboard
      await fetch('/api/dashboard/stats', {
        cache: 'no-store',
      })

      toast({
        title: '✅ Comanda fechada',
        description: `Total: R$ ${comanda?.valorTotal.toFixed(2)}`,
      })

      // Adiciona um delay para garantir que o banco atualizou
      setTimeout(() => {
        router.push('/garcom')
        router.refresh()
      }, 500)
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
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-poker-green to-poker-green-dark">
      <header className="glass-dark border-b border-primary/20 p-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-primary/10 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold gold-text">Fechar Comanda</h1>
            <p className="text-xs text-muted-foreground">#{params.id}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Resumo */}
        <div className="glass-poker rounded-xl p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="text-lg font-semibold">{comanda.cliente.nome}</p>
          </div>
          
          <div className="border-t border-primary/20 pt-3">
            <p className="text-sm text-muted-foreground">Total de Itens</p>
            <p className="text-lg font-semibold">{comanda.itens.length} itens</p>
          </div>
          
          <div className="border-t border-primary/20 pt-3">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-3xl font-bold gold-text">R$ {comanda.valorTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="space-y-3">
          <Label className="text-poker-gold">Forma de Pagamento *</Label>
          <div className="grid grid-cols-2 gap-3">
            {formasPagamento.map((forma) => (
              <motion.button
                key={forma.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFormaPagamentoChange(forma.value)}
                className={`
                  poker-card p-4 text-center transition-all
                  ${formaPagamento === forma.value
                    ? 'neon-border-gold bg-primary/20'
                    : 'hover:bg-primary/10'
                  }
                `}
              >
                <p className="text-lg font-semibold">{forma.label}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* QR Code PIX */}
        {mostrarQrCode && pixPayload && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-poker rounded-xl p-6 space-y-4"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold gold-text mb-2">💳 Pague com PIX</h2>
              <p className="text-sm text-muted-foreground">
                Escaneie o QR Code ou copie o código
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-2xl">
                <QRCodeSVG
                  id="qrcode-pix"
                  value={pixPayload}
                  size={240}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Valor em destaque */}
            <div className="text-center py-4 border-y border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
              <p className="text-4xl font-bold gold-text">
                R$ {comanda?.valorTotal.toFixed(2)}
              </p>
            </div>

            {/* Código PIX Copia e Cola */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Código PIX Copia e Cola
              </Label>
              <div className="relative">
                <Input
                  value={pixPayload}
                  readOnly
                  className="pr-24 font-mono text-xs"
                />
                <button
                  onClick={copiarCodigoPix}
                  className="absolute right-1 top-1 bottom-1 px-4 btn-poker-primary rounded-md text-sm font-semibold flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={baixarQrCode}
                className="poker-card p-3 hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span className="font-semibold">Baixar QR</span>
              </button>
              <button
                onClick={copiarCodigoPix}
                className="btn-poker-primary p-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                <span className="font-semibold">Copiar Código</span>
              </button>
            </div>

            {/* Instruções */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-200 leading-relaxed">
                💡 <strong>Como pagar:</strong><br />
                1. Abra o app do seu banco<br />
                2. Escolha pagar com PIX<br />
                3. Escaneie o QR Code ou cole o código<br />
                4. Confirme o pagamento
              </p>
            </div>
          </motion.div>
        )}

        {/* Observação */}
        <div className="space-y-2">
          <Label htmlFor="observacao" className="text-poker-gold">
            Observação (opcional)
          </Label>
          <Input
            id="observacao"
            placeholder="Ex: Cliente pediu nota fiscal..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>

        {/* Botão Confirmar */}
        <button
          onClick={fecharComanda}
          disabled={loading || !formaPagamento}
          className="w-full btn-poker-primary h-14 text-xl font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Fechando...
            </>
          ) : (
            <>
              <Check className="w-6 h-6" />
              Confirmar Fechamento
            </>
          )}
        </button>

        {/* Aviso */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-sm text-amber-200">
            ⚠️ Após o fechamento, não será possível adicionar mais itens a esta comanda.
          </p>
        </div>
      </div>
    </div>
  )
}
