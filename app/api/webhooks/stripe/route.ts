import type { Plan } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import {
  fulfillBonoPayment,
  fulfillOrderPayment,
  type BonoCheckoutMetadata,
} from '@/lib/billing/checkout'
import { fulfillBookingDeposit, cancelUnpaidBookingHold } from '@/lib/billing/booking-payments'
import {
  claimStripeEvent,
  completeStripeEvent,
  failStripeEvent,
  releaseOrderStockReservation,
} from '@/lib/billing/payment-integrity'
import { syncPaymentCompensationRefund } from '@/lib/billing/payment-compensation'
import { PRICE_ID_TO_PLAN } from '@/lib/billing/price-map'
import { stripe } from '@/lib/billing/stripe'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

function isEntitled(status: Stripe.Subscription.Status) {
  return status === 'active' || status === 'trialing'
}

async function updateSubscriptionOrganization(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id
  const mappedPlan: Plan | undefined = priceId ? PRICE_ID_TO_PLAN[priceId] : undefined
  if (isEntitled(subscription.status) && !mappedPlan) {
    throw new Error(`UNKNOWN_SUBSCRIPTION_PRICE:${priceId ?? 'missing'}`)
  }

  const plan: Plan = isEntitled(subscription.status) ? mappedPlan! : 'BASIC'
  const organizationId = subscription.metadata?.organizationId
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
  const data = {
    plan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: isEntitled(subscription.status) ? subscription.id : null,
    planExpiresAt: null,
  }

  if (organizationId) {
    await prisma.organization.update({ where: { id: organizationId }, data })
  } else {
    await prisma.organization.updateMany({
      where: { OR: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customerId }] },
      data,
    })
  }
}

async function processPaidCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return
  const metadata = session.metadata ?? {}
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null
  if (!paymentIntentId) throw new Error('MISSING_PAYMENT_INTENT_ID')

  if (metadata.type === 'order' && metadata.orderId) {
    await fulfillOrderPayment(metadata.orderId, paymentIntentId, session.id)
  } else if (metadata.type === 'bono' && metadata.bonoId) {
    await fulfillBonoPayment(metadata as unknown as BonoCheckoutMetadata, paymentIntentId, session.id)
  } else if (metadata.type === 'booking_deposit' && metadata.bookingId) {
    await fulfillBookingDeposit(metadata.bookingId, paymentIntentId, session.id)
  }
}

async function expireCheckout(session: Stripe.Checkout.Session, reason: string) {
  const metadata = session.metadata ?? {}
  if (metadata.type === 'order' && metadata.orderId) {
    await releaseOrderStockReservation(metadata.orderId, reason)
  } else if (metadata.type === 'booking_deposit' && metadata.bookingId) {
    await cancelUnpaidBookingHold(metadata.bookingId, `Checkout de señal cancelado: ${reason}`)
  }
}

async function syncSubscriptionFromInvoice(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id
  if (!subscriptionId) return
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await updateSubscriptionOrganization(subscription)
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  let claimed = false
  try {
    claimed = await claimStripeEvent(event.id, event.type)
    if (!claimed) return NextResponse.json({ received: true, duplicate: true })

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'payment') {
          await processPaidCheckout(session)
        } else if (session.mode === 'subscription') {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id
          if (!subscriptionId) throw new Error('MISSING_SUBSCRIPTION_ID')
          await updateSubscriptionOrganization(await stripe.subscriptions.retrieve(subscriptionId))
        }
        break
      }

      case 'checkout.session.expired':
        await expireCheckout(event.data.object as Stripe.Checkout.Session, 'checkout_session_expired')
        break

      case 'checkout.session.async_payment_failed':
        await expireCheckout(event.data.object as Stripe.Checkout.Session, 'async_payment_failed')
        break

      case 'refund.created':
      case 'refund.updated':
      case 'refund.failed':
        await syncPaymentCompensationRefund(event.data.object as Stripe.Refund)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        await updateSubscriptionOrganization(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
      case 'invoice.payment_failed':
        await syncSubscriptionFromInvoice(event.data.object as Stripe.Invoice)
        break

      default:
        break
    }

    await completeStripeEvent(event.id)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[stripe-webhook]', event.type, event.id, error)
    if (claimed) await failStripeEvent(event.id, error).catch(() => undefined)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
