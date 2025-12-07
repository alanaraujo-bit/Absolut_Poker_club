'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

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

  useEffect(() => {
    carregarComanda()
  }, [])

  const carregarComanda = async () => {
    const res = await fetch(`/api/comandas/${params.id}`)
    const data = await res.json()
    setComanda(data)
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

      toast({
        title: '✅ Comanda fechada',
        description: `Total: R$ ${comanda?.valorTotal.toFixed(2)}`,
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
                onClick={() => setFormaPagamento(forma.value)}
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
