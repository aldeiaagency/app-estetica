'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { purchaseBonoAction } from '@/app/actions/bonos'

interface Props {
  bonoId:    string
  bonoName:  string
  priceCents: number
  centerName: string
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export function BonoPurchaseForm({ bonoId, priceCents, centerName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [phone,   setPhone]   = useState('')
  const [consent, setConsent] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) { setError('Debes aceptar la política de privacidad'); return }
    setError(null)
    startTransition(async () => {
      const result = await purchaseBonoAction({
        bonoId,
        customerName:  name.trim(),
        customerEmail: email.trim().toLowerCase(),
        customerPhone: phone.trim() || undefined,
        consentGiven:  true,
      })
      if (result.success) {
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl       // pago online con Stripe
        } else if (result.instanceId) {
          router.push(`/bono/confirmado/${result.instanceId}`)  // pago en el centro
        }
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-[#d8dee9] bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-black text-[#0c1324]">Tus datos para el bono</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Nombre completo <span className="text-[#2f6df6]">*</span></label>
            <input
              type="text" required value={name} onChange={e => setName(e.target.value)}
              className="input-base" placeholder="Tu nombre completo" autoComplete="name"
            />
          </div>
          <div>
            <label className="label">Email <span className="text-[#2f6df6]">*</span></label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="input-base" placeholder="tu@email.com" autoComplete="email"
            />
            <p className="mt-1 text-xs text-[#8b96aa]">Recibirás la referencia del bono en este email</p>
          </div>
          <div>
            <label className="label">Teléfono <span className="font-normal text-[#8b96aa]">(opcional)</span></label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="input-base" placeholder="+34 600 000 000" autoComplete="tel"
            />
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-md bg-[#f1f4f8] p-4 hover:bg-[#e5eaf2] transition-colors">
        <input
          type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#2f6df6]"
        />
        <span className="text-sm text-[#46546b]">
          Acepto la{' '}
          <Link href="/privacidad" className="text-[#2f6df6] underline hover:text-[#2355c8]" target="_blank">
            política de privacidad
          </Link>{' '}
          y el tratamiento de mis datos para gestionar este bono. *
        </span>
      </label>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={isPending || !name.trim() || !email.trim() || !consent}
        className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Procesando...</>
        ) : (
          <><CheckCircle2 className="h-4 w-4" />Comprar bono · {formatPrice(priceCents)}</>
        )}
      </button>
      <p className="text-center text-xs text-[#8b96aa]">
        Si el centro tiene pago online, pagarás de forma segura ahora; si no, lo abonarás en {centerName}.
      </p>
    </form>
  )
}
