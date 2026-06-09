'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from './cart-provider'

interface Props {
  productId: string
  centerId: string
  centerName: string
  centerSlug: string
  name: string
  priceCents: number
  image: string | null
  disabled?: boolean
}

export function AddToCartButton({ productId, centerId, centerName, centerSlug, name, priceCents, image, disabled }: Props) {
  const { addItem, items } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)

  const cartHasDifferentCenter = items.length > 0 && items[0].centerId !== centerId

  function handleClick() {
    if (disabled) return
    addItem({ productId, centerId, centerName, centerSlug, name, priceCents, image })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (disabled) {
    return (
      <button disabled className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-zinc-200 py-4 text-sm font-semibold text-zinc-400">
        <ShoppingCart className="h-4 w-4" />Producto agotado
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {cartHasDifferentCenter && (
        <p className="rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-700">
          Tu carrito tiene productos de otro centro. Al añadir este se vaciará el carrito anterior.
        </p>
      )}
      <button
        onClick={handleClick}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold transition-all ${
          added
            ? 'bg-emerald-600 text-white'
            : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] shadow-md shadow-primary-500/20'
        }`}
      >
        {added ? (
          <><Check className="h-4 w-4" />Añadido al carrito</>
        ) : (
          <><ShoppingCart className="h-4 w-4" />Añadir al carrito</>
        )}
      </button>
      {added && (
        <button
          onClick={() => router.push('/carrito')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-200 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
        >
          Ver carrito →
        </button>
      )}
    </div>
  )
}
