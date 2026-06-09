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

export function BonoPurchaseForm({ bonoId, bonoName, priceCents, centerName }: Props) {
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
        router.push(`/bono/confirmado/${result.instanceId}`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-black text-zinc-900">Tus datos para el bono</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Nombre completo <span className="text-beauty-500">*</span></label>
            <input
              type="text" required value={name} onChange={e => setName(e.target.value)}
              className="input-base" placeholder="Tu nombre completo" autoComplete="name"
            />
          </div>
          <div>
            <label className="label">Email <span className="text-beauty-500">*</span></label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="input-base" placeholder="tu@email.com" autoComplete="email"
            />
            <p className="mt-1 text-xs text-zinc-400">Recibirás la referencia del bono en este email</p>
          </div>
          <div>
            <label className="label">Teléfono <span className="font-normal text-zinc-400">(opcional)</span></label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="input-base" placeholder="+34 600 000 000" autoComplete="tel"
            />
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100 transition-colors">
        <input
          type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary-600"
        />
        <span className="text-sm text-zinc-600">
          Acepto la{' '}
          <Link href="/legal/privacidad" className="text-primary-600 underline hover:text-primary-700" target="_blank">
            política de privacidad
          </Link>{' '}
          y el tratamiento de mis datos para gestionar este bono. *
        </span>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
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
      <p className="text-center text-xs text-zinc-400">
        Pago en {centerName} · El negocio te confirmará el método de pago
      </p>
    </form>
  )
}
