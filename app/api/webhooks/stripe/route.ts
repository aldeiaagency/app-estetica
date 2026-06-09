import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/billing/stripe'
import { prisma } from '@/lib/db/client'
import { PRICE_ID_TO_PLAN } from '@/lib/billing/price-map'
import type Stripe from 'stripe'
import type { Plan } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const orgId          = session.metadata?.organizationId
        const customerId     = typeof session.customer === 'string' ? session.customer : session.customer?.id
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : (session.subscription as Stripe.Subscription | null)?.id

        if (!orgId || !subscriptionId) break

        // Resolve plan from subscription price
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const plan: Plan = (priceId ? PRICE_ID_TO_PLAN[priceId] : undefined) ?? 'PRO'

        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan,
            stripeCustomerId:     customerId ?? undefined,
            stripeSubscriptionId: subscriptionId,
            planExpiresAt:        null,
          },
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub     = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        const plan: Plan | undefined = priceId ? PRICE_ID_TO_PLAN[priceId] : undefined

        if (!plan) break

        const orgId = sub.metadata?.organizationId
        if (!orgId) {
          // Fall back to lookup by stripeSubscriptionId
          await prisma.organization.updateMany({
            where: { stripeSubscriptionId: sub.id },
            data: { plan },
          })
        } else {
          await prisma.organization.update({
            where: { id: orgId },
            data: { plan },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub   = event.data.object as Stripe.Subscription
        const orgId = sub.metadata?.organizationId

        if (!orgId) {
          await prisma.organization.updateMany({
            where: { stripeSubscriptionId: sub.id },
            data: { plan: 'BASIC', stripeSubscriptionId: null, planExpiresAt: null },
          })
        } else {
          await prisma.organization.update({
            where: { id: orgId },
            data: { plan: 'BASIC', stripeSubscriptionId: null, planExpiresAt: null },
          })
        }
        break
      }

      // Acknowledge all other events with 200 and do nothing
      default:
        break
    }
  } catch (err) {
    console.error('[stripe webhook]', event.type, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
