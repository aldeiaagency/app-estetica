'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ShoppingBag, Loader2, Package, ArrowLeft } from 'lucide-react'
import { useCart } from '@/components/ecommerce/cart-provider'
import { createOrderAction } from '@/app/actions/orders'

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalCents, clearCart } = useCart()
  const [isPending, startTransition] = useTransition()

  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [phone,   setPhone]   = useState('')
  const [consent, setConsent] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f4f8]">
        <header className="border-b border-[#d8dee9] bg-white px-4 py-3.5">
          <div className="mx-auto flex max-w-[640px] items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 font-black text-[#0c1324]">
              <Sparkles className="h-4 w-4 text-[#2f6df6]" />BellezaLocal
            </Link>
          </div>
        </header>
        <div className="mx-auto flex max-w-[640px] flex-col items-center justify-center px-4 py-24 text-center">
          <ShoppingBag className="mb-4 h-12 w-12 text-[#b9c4d5]" />
          <h1 className="mb-3 font-black text-[#0c1324]">Carrito vacío</h1>
          <Link href="/productos" className="btn-primary">Ver productos</Link>
        </div>
      </div>
    )
  }

  const centerId   = items[0].centerId
  const centerName = items[0].centerName

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) { setError('Debes aceptar la política de privacidad'); return }
    setError(null)
    startTransition(async () => {
      const result = await createOrderAction({
        centerId,
        customerName:  name.trim(),
        customerEmail: email.trim().toLowerCase(),
        customerPhone: phone.trim() || undefined,
        consentGiven:  true,
        // Solo enviamos producto y cantidad; nombre y precio los pone el servidor desde la BD.
        items: items.map(i => ({
          productId: i.productId,
          quantity:  i.quantity,
        })),
      })
      if (result.success) {
        clearCart()
        if (result.checkoutUrl) {
          // Pago online con Stripe
          window.location.href = result.checkoutUrl
        } else {
          // Pago en el centro (click & collect)
          router.push(`/pedido/confirmado/${result.orderId}`)
        }
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <header className="sticky top-0 z-30 border-b border-[#d8dee9] bg-white/90 backdrop-blur-md px-4 py-3.5">
        <div className="mx-auto flex max-w-[640px] items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1.5 font-black text-[#0c1324]">
            <Sparkles className="h-4 w-4 text-[#2f6df6]" />
            <span className="hidden sm:inline">BellezaLocal</span>
          </Link>
          <span className="mx-1 text-[#b9c4d5]">/</span>
          <Link href="/carrito" className="text-[#8b96aa] hover:text-[#273244] transition-colors">Carrito</Link>
          <span className="mx-1 text-[#b9c4d5]">/</span>
          <span className="font-semibold text-[#273244]">Checkout</span>
        </div>
      </header>

      <div className="mx-auto max-w-[640px] px-4 py-8">
        <Link href="/carrito" className="mb-6 flex items-center gap-1.5 text-sm text-[#647089] hover:text-[#0c1324] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Volver al carrito
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-lg border border-[#d8dee9] bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-black text-[#0c1324]">Tus datos</h2>
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
                  <p className="mt-1 text-xs text-[#8b96aa]">Recibirás la confirmación del pedido aquí</p>
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

            {/* Consent */}
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
                y el tratamiento de mis datos para gestionar este pedido. *
              </span>
            </label>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !name.trim() || !email.trim() || !consent}
              className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Procesando pedido...</>
              ) : (
                <>Confirmar pedido · {formatPrice(totalCents)}</>
              )}
            </button>
            <p className="text-center text-xs text-[#8b96aa]">
              Recogida en {centerName}. Si el centro tiene pago online, pagarás de forma segura ahora;
              si no, abonarás al recoger.
            </p>
          </form>
        </div>

        {/* Order summary sidebar (visible on all sizes below form) */}
        <div className="mt-6 rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-bold text-[#0c1324]">Resumen del pedido</h3>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[#e5eaf2]">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-4 w-4 text-[#b9c4d5]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0c1324]">{item.name}</p>
                  <p className="text-xs text-[#8b96aa]">× {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-[#0c1324]">{formatPrice(item.priceCents * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-[#e5eaf2] pt-4">
            <span className="font-bold text-[#0c1324]">Total</span>
            <span className="text-lg font-black text-[#2f6df6]">{formatPrice(totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
