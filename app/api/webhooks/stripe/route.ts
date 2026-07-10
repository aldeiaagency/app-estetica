import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/billing/stripe'
import { prisma } from '@/lib/db/client'
import { PRICE_ID_TO_PLAN } from '@/lib/billing/price-map'
import { fulfillOrderPayment, fulfillBonoPayment, fulfillBookingDeposit, type BonoCheckoutMetadata } from '@/lib/billing/checkout'
import type Stripe from 'stripe'
import type { Plan } from '@prisma/client'

export const dynamic = 'force-dynamic'

function isEntitled(status: Stripe.Subscription.Status) {
  return status === 'active' || status === 'trialing'
}

async function updateSubscriptionOrganization(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id
  const mappedPlan: Plan | undefined = priceId ? PRICE_ID_TO_PLAN[priceId] : undefined
  const plan: Plan = isEntitled(sub.status) && mappedPlan ? mappedPlan : 'BASIC'
  const orgId = sub.metadata?.organizationId
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  const data = {
    plan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: isEntitled(sub.status) ? sub.id : null,
    planExpiresAt: null,
  }

  if (orgId) {
    await prisma.organization.update({ where: { id: orgId }, data })
  } else {
    await prisma.organization.updateMany({
      where: { OR: [{ stripeSubscriptionId: sub.id }, { stripeCustomerId: customerId }] },
      data,
    })
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'payment') {
          if (session.payment_status !== 'paid') break
          const meta = session.metadata ?? {}
          const paymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null

          if (meta.type === 'order' && meta.orderId) {
            await fulfillOrderPayment(meta.orderId, paymentIntentId)
          } else if (meta.type === 'bono' && meta.bonoId) {
            await fulfillBonoPayment(meta as unknown as BonoCheckoutMetadata, paymentIntentId ?? session.id)
          } else if (meta.type === 'booking_deposit' && meta.bookingId) {
            await fulfillBookingDeposit(meta.bookingId, paymentIntentId ?? session.id)
          }
          break
        }

        if (session.mode !== 'subscription') break
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        if (!priceId || !PRICE_ID_TO_PLAN[priceId]) {
          console.error('[stripe webhook] Unknown subscription price', { subscriptionId, priceId })
          throw new Error('UNKNOWN_SUBSCRIPTION_PRICE')
        }
        await updateSubscriptionOrganization(subscription)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed': {
        await updateSubscriptionOrganization(event.data.object as Stripe.Subscription)
        break
      }

      case 'checkout.session.async_payment_failed': {
        // No fulfillment occurs. Inventory/booking hold cleanup is delegated to
        // the existing expiration cron so this event remains idempotent.
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[stripe webhook]', event.type, event.id, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
