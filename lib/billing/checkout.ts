import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import {
  expireCheckoutSessionIfOpen,
  settleOrderPaymentAtomically,
} from '@/lib/billing/payment-integrity'
import { processPaymentCompensation } from './payment-compensation'
import { APP_URL, getStripe } from './stripe'
import { createConfirmationToken } from '@/lib/security/confirmation-token'

interface OrderLineItem {
  name: string
  priceCents: number
  quantity: number
}

export async function createOrderCheckoutSession(params: {
  orderId: string
  items: OrderLineItem[]
  customerEmail: string
  centerName: string
  expiresAt: Date
  idempotencyKey?: string
}): Promise<string> {
  const idempotencyKey = params.idempotencyKey ?? `order:${params.orderId}:checkout:v1`
  const prepared = await prisma.order.updateMany({
    where: { id: params.orderId, status: 'PENDING', checkoutSessionId: null },
    data: { checkoutIdempotencyKey: idempotencyKey, paymentState: 'CHECKOUT_PENDING' },
  })
  if (prepared.count !== 1) throw new Error('ORDER_CHECKOUT_NOT_PENDING')

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: params.customerEmail,
    expires_at: Math.floor(params.expiresAt.getTime() / 1000),
    line_items: params.items.map(item => ({
      quantity: item.quantity,
      price_data: {
        currency: 'eur',
        unit_amount: item.priceCents,
        product_data: { name: item.name },
      },
    })),
    metadata: { type: 'order', orderId: params.orderId },
    payment_intent_data: { metadata: { type: 'order', orderId: params.orderId } },
    success_url: `${APP_URL}/pedido/confirmado/${params.orderId}?paid=1&token=${createConfirmationToken('order', params.orderId, params.customerEmail)}`,
    cancel_url: `${APP_URL}/carrito?checkout=cancelado`,
  }, { idempotencyKey })

  if (!session.url) {
    await expireCheckoutSessionIfOpen(session.id).catch(() => undefined)
    throw new Error('Stripe no devolvió URL de checkout')
  }

  const attached = await prisma.order.updateMany({
    where: {
      id: params.orderId,
      checkoutIdempotencyKey: idempotencyKey,
      OR: [
        { status: 'PENDING', checkoutSessionId: null },
        { paymentState: 'PAID', checkoutSessionId: session.id },
      ],
    },
    data: { checkoutSessionId: session.id },
  })
  if (attached.count !== 1) {
    await expireCheckoutSessionIfOpen(session.id).catch(() => undefined)
    throw new Error('ORDER_CHECKOUT_CANCELLED_DURING_CREATION')
  }
  return session.url
}

export async function fulfillOrderPayment(
  orderId: string,
  paymentIntentId: string,
  checkoutSessionId: string,
): Promise<void> {
  const outcome = await settleOrderPaymentAtomically({ orderId, paymentIntentId, checkoutSessionId })
  if (outcome === 'NOT_FOUND') throw new Error('ORDER_NOT_FOUND')
  if (outcome === 'COMPENSATION_PENDING') {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { checkoutSessionId: true },
    })
    if (order?.checkoutSessionId && order.checkoutSessionId !== checkoutSessionId) {
      await expireCheckoutSessionIfOpen(order.checkoutSessionId).catch(() => undefined)
    }
    await processPaymentCompensation(paymentIntentId)
  }
}

export interface BonoCheckoutMetadata {
  type: 'bono'
  bonoId: string
  centerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
}

export async function createBonoCheckoutSession(params: {
  bonoId: string
  bonoName: string
  priceCents: number
  centerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
}): Promise<string> {
  const metadata: BonoCheckoutMetadata = {
    type: 'bono',
    bonoId: params.bonoId,
    centerId: params.centerId,
    customerName: params.customerName,
    customerEmail: params.customerEmail.trim().toLowerCase(),
    customerPhone: params.customerPhone?.trim() ?? '',
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: metadata.customerEmail,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: params.priceCents,
        product_data: { name: `Bono: ${params.bonoName}` },
      },
    }],
    metadata: { ...metadata },
    payment_intent_data: { metadata: { ...metadata } },
    success_url: `${APP_URL}/bono/gracias?ok=1`,
    cancel_url: `${APP_URL}/bono/${params.bonoId}`,
  })
  if (!session.url) throw new Error('Stripe no devolvió URL de checkout')
  return session.url
}

export async function fulfillBonoPayment(
  meta: BonoCheckoutMetadata,
  paymentIntentId: string,
  checkoutSessionId: string,
): Promise<void> {
  try {
    await prisma.$transaction(async tx => {
      const existing = await tx.bonoInstance.findFirst({
        where: { OR: [{ stripePaymentId: paymentIntentId }, { checkoutSessionId }] },
        select: { id: true },
      })
      if (existing) return

      const bono = await tx.bono.findFirst({
        where: { id: meta.bonoId, centerId: meta.centerId, active: true },
        select: { id: true, sessions: true, validityDays: true, centerId: true },
      })
      if (!bono) throw new Error('BONO_NOT_AVAILABLE')

      const email = meta.customerEmail.trim().toLowerCase()
      const customer = await tx.customer.upsert({
        where: { email_centerId: { email, centerId: bono.centerId } },
        create: {
          centerId: bono.centerId,
          name: meta.customerName.trim() || email,
          email,
          phone: meta.customerPhone?.trim() || null,
          consentGivenAt: new Date(),
        },
        update: {},
      })

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + bono.validityDays)
      await tx.bonoInstance.create({
        data: {
          bonoId: bono.id,
          customerId: customer.id,
          centerId: bono.centerId,
          sessionsRemaining: bono.sessions,
          purchasedAt: new Date(),
          activatedAt: new Date(),
          expiresAt,
          checkoutSessionId,
          stripePaymentId: paymentIntentId,
        },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return
    throw error
  }
}

export async function createBookingDepositCheckoutSession(params: {
  bookingId: string
  confirmationCode: string
  centerSlug: string
  centerName: string
  serviceName: string
  serviceId: string
  depositCents: number
  depositExpiresAt: Date
  customerEmail: string
  idempotencyKey?: string
}): Promise<string> {
  const idempotencyKey = params.idempotencyKey ?? `booking:${params.bookingId}:deposit-checkout:v1`
  const prepared = await prisma.booking.updateMany({
    where: {
      id: params.bookingId,
      status: 'PENDING',
      depositPaid: false,
      checkoutSessionId: null,
    },
    data: { checkoutIdempotencyKey: idempotencyKey, paymentState: 'CHECKOUT_PENDING' },
  })
  if (prepared.count !== 1) throw new Error('BOOKING_CHECKOUT_NOT_PENDING')

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: params.customerEmail.trim().toLowerCase(),
    expires_at: Math.floor(params.depositExpiresAt.getTime() / 1000),
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: params.depositCents,
        product_data: { name: `Depósito reserva: ${params.serviceName}` },
      },
    }],
    metadata: { type: 'booking_deposit', bookingId: params.bookingId },
    payment_intent_data: { metadata: { type: 'booking_deposit', bookingId: params.bookingId } },
    success_url: `${APP_URL}/reserva/confirmada/${params.confirmationCode}?paid=1&token=${createConfirmationToken('booking', params.confirmationCode, params.customerEmail)}`,
    cancel_url: `${APP_URL}/centro/${params.centerSlug}/reservar?servicio=${params.serviceId}&pago=cancelado`,
  }, { idempotencyKey })

  if (!session.url) {
    await expireCheckoutSessionIfOpen(session.id).catch(() => undefined)
    throw new Error('Stripe no devolvió URL de checkout')
  }

  const attached = await prisma.booking.updateMany({
    where: {
      id: params.bookingId,
      checkoutIdempotencyKey: idempotencyKey,
      OR: [
        { status: 'PENDING', depositPaid: false, checkoutSessionId: null },
        { paymentState: 'PAID', depositPaid: true, checkoutSessionId: session.id },
      ],
    },
    data: { checkoutSessionId: session.id },
  })
  if (attached.count !== 1) {
    await expireCheckoutSessionIfOpen(session.id).catch(() => undefined)
    throw new Error('BOOKING_CHECKOUT_CANCELLED_DURING_CREATION')
  }
  return session.url
}
