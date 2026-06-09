'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type CartItem = {
  productId: string
  centerId: string
  centerName: string
  centerSlug: string
  name: string
  priceCents: number
  quantity: number
  image: string | null
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalCents: number
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'bellezalocal_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
    setHydrated(true)
  }, [])

  // Persist to localStorage when items change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items, hydrated])

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      // If cart has items from a different center, reset
      const differentCenter = prev.length > 0 && prev[0].centerId !== newItem.centerId
      const base = differentCenter ? [] : prev

      const existing = base.find(i => i.productId === newItem.productId)
      if (existing) {
        return base.map(i =>
          i.productId === newItem.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...base, { ...newItem, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.productId !== productId))
    } else {
      setItems(prev =>
        prev.map(i => i.productId === productId ? { ...i, quantity } : i)
      )
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalCents }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
