'use client'

import Link from 'next/link'
import { ShoppingCart, Trash2, Plus, Minus, Sparkles, Package, ArrowRight } from 'lucide-react'
import { useCart } from '@/components/ecommerce/cart-provider'

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, totalCents, totalItems } = useCart()

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
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-[#e5eaf2]">
            <ShoppingCart className="h-8 w-8 text-[#8b96aa]" />
          </div>
          <h1 className="mb-2 text-xl font-black text-[#0c1324]">Tu carrito está vacío</h1>
          <p className="mb-6 text-sm text-[#647089]">Explora productos de centros de belleza cerca de ti.</p>
          <Link href="/productos" className="btn-primary">Ver productos</Link>
        </div>
      </div>
    )
  }

  const centerName = items[0]?.centerName
  const centerSlug = items[0]?.centerSlug

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <header className="border-b border-[#d8dee9] bg-white px-4 py-3.5">
        <div className="mx-auto flex max-w-[640px] items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5 font-black text-[#0c1324]">
            <Sparkles className="h-4 w-4 text-[#2f6df6]" />BellezaLocal
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[640px] px-4 py-8">
        <h1 className="mb-1 text-2xl font-black text-[#0c1324]">Tu carrito</h1>
        <p className="mb-6 text-sm text-[#647089]">
          {totalItems} {totalItems === 1 ? 'producto' : 'productos'} de{' '}
          <Link href={`/centro/${centerSlug}`} className="font-semibold text-[#2f6df6] hover:text-[#2355c8]">
            {centerName}
          </Link>
        </p>

        {/* Items */}
        <div className="mb-6 space-y-3">
          {items.map(item => (
            <div key={item.productId} className="flex items-center gap-4 rounded-lg border border-[#d8dee9] bg-white p-4">
              {/* Image */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#e5eaf2]">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-6 w-6 text-[#b9c4d5]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-[#0c1324]">{item.name}</p>
                <p className="text-sm font-bold text-[#2f6df6]">{formatPrice(item.priceCents)}</p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d8dee9] text-[#647089] hover:bg-[#f1f4f8] transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-[#0c1324]">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d8dee9] text-[#647089] hover:bg-[#f1f4f8] transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right">
                <p className="text-sm font-black text-[#0c1324]">{formatPrice(item.priceCents * item.quantity)}</p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.productId)}
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-[#8b96aa] transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-[#d8dee9] bg-white p-5">
          <div className="mb-4 flex justify-between text-sm">
            <span className="text-[#647089]">Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</span>
            <span className="font-semibold text-[#0c1324]">{formatPrice(totalCents)}</span>
          </div>
          <div className="mb-5 flex justify-between border-t border-[#e5eaf2] pt-4">
            <span className="font-bold text-[#0c1324]">Total</span>
            <span className="text-xl font-black text-[#2f6df6]">{formatPrice(totalCents)}</span>
          </div>
          <Link
            href="/checkout"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2f6df6] py-4 text-sm font-semibold text-white shadow-md shadow-[#2f6df6]/20 transition-all hover:bg-[#2355c8] active:scale-[0.98]"
          >
            Finalizar pedido <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-[#8b96aa]">
            Pago en tienda · Sin gastos de envío ocultos
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/productos" className="text-sm text-[#8b96aa] hover:text-[#273244] transition-colors">
            ← Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
