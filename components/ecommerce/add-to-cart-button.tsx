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
      <button disabled className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#d8dee9] py-4 text-sm font-semibold text-[#8b96aa]">
        <ShoppingCart className="h-4 w-4" />Producto agotado
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {cartHasDifferentCenter && (
        <p className="rounded-md bg-amber-50 px-4 py-2 text-xs text-amber-700">
          Tu carrito tiene productos de otro centro. Al añadir este se vaciará el carrito anterior.
        </p>
      )}
      <button
        onClick={handleClick}
        className={`flex w-full items-center justify-center gap-2 rounded-lg py-4 text-sm font-semibold transition-all ${
          added
            ? 'bg-emerald-600 text-white'
            : 'bg-[#2f6df6] text-white hover:bg-[#2355c8] active:scale-[0.98] shadow-md shadow-[#2f6df6]/20'
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
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#cfe0ff] py-3 text-sm font-semibold text-[#2355c8] transition-colors hover:bg-[#e5edff]"
        >
          Ver carrito →
        </button>
      )}
    </div>
  )
}
