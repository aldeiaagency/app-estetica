'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/components/ecommerce/cart-provider'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <Toaster richColors position="top-right" />
      </CartProvider>
    </SessionProvider>
  )
}
