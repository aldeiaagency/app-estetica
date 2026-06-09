'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { stripe } from '@/lib/billing/stripe'
import { PLAN_TO_PRICE_ID } from '@/lib/billing/price-map'
import type { Plan } from '@prisma/client'
import { redirect } from 'next/navigation'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function createCheckoutSessionAction(plan: Plan): Promise<never> {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })

  const priceId = PLAN_TO_PRICE_ID[plan]
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for plan ${plan}. Set STRIPE_PRICE_${plan}_MONTHLY in env.`)
  }

  // Reuse existing Stripe customer or create a new one
  let customerId = org.stripeCustomerId ?? undefined

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { organizationId: org.id },
    })
    customerId = customer.id
    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { organizationId: org.id },
    subscription_data: {
      metadata: { organizationId: org.id },
    },
    success_url: `${APP_URL}/dashboard/plan?success=1`,
    cancel_url:  `${APP_URL}/dashboard/plan`,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: { address: 'auto' },
  })

  redirect(checkoutSession.url!)
}

export async function createBillingPortalSessionAction(): Promise<never> {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })

  if (!org.stripeCustomerId) {
    redirect('/dashboard/plan')
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${APP_URL}/dashboard/plan`,
  })

  redirect(portalSession.url)
}
