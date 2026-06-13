import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return _stripe
}

// Convenience export for backward compatibility — lazily resolved on first call
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// True si hay clave Stripe configurada. Permite degradar con gracia a "pago en el
// centro" (click & collect) mientras Stripe no esté activado en el entorno.
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'
