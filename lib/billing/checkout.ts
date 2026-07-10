import { prisma } from '@/lib/db/client'
import { consumeOrderStockReservation } from '@/lib/billing/payment-integrity'
import { sendBookingConfirmation } from '@/lib/notifications/email'
import { APP_URL, getStripe } from './stripe'

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
}): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
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
    success_url: `${APP_URL}/pedido/confirmado/${params.orderId}?paid=1`,
    cancel_url: `${APP_URL}/carrito?checkout=cancelado`,
  })
  if (!session.url) throw new Error('Stripe no devolvió URL de checkout')
  return session.url
}

export async function fulfillOrderPayment(orderId: string, paymentIntentId: string | null): Promise<void> {
  await prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } })
    if (!order) return
    if (['PAID', 'READY', 'COMPLETED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status)) return
    if (order.status === 'CANCELLED') throw new Error('ORDER_ALREADY_CANCELLED')

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId ?? undefined,
      },
    })
  })
  await consumeOrderStockReservation(orderId)
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

export async function fulfillBonoPayment(meta: BonoCheckoutMetadata, paymentId: string): Promise<void> {
  const existing = await prisma.bonoInstance.findFirst({ where: { stripePaymentId: paymentId } })
  if (existing) return

  const bono = await prisma.bono.findFirst({
    where: { id: meta.bonoId, centerId: meta.centerId, active: true },
    select: { id: true, sessions: true, validityDays: true, centerId: true },
  })
  if (!bono) throw new Error('BONO_NOT_AVAILABLE')

  const email = meta.customerEmail.trim().toLowerCase()
  await prisma.$transaction(async tx => {
    const customer = await tx.customer.upsert({
      where: { email_centerId: { email, centerId: bono.centerId } },
      create: {
        centerId: bono.centerId,
        name: meta.customerName.trim() || email,
        email,
        phone: meta.customerPhone?.trim() || null,
        consentGivenAt: new Date(),
      },
      update: {
        name: meta.customerName.trim() || email,
        phone: meta.customerPhone?.trim() || null,
      },
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
        stripePaymentId: paymentId,
      },
    })
  })
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
}): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
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
    success_url: `${APP_URL}/reserva/confirmada/${params.confirmationCode}?paid=1`,
    cancel_url: `${APP_URL}/centro/${params.centerSlug}/reservar?servicio=${params.serviceId}&pago=cancelado`,
  })
  if (!session.url) throw new Error('Stripe no devolvió URL de checkout')
  return session.url
}

export async function fulfillBookingDeposit(bookingId: string, paymentIntentId: string | null): Promise<void> {
  const booking = await prisma.$transaction(async tx => {
    const existing = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { status: true, depositPaid: true, depositExpiresAt: true },
    })
    if (!existing || existing.depositPaid) return null
    if (existing.status !== 'PENDING' && existing.status !== 'CONFIRMED') return null
    if (existing.depositExpiresAt && existing.depositExpiresAt < new Date()) throw new Error('BOOKING_DEPOSIT_EXPIRED')

    return tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        depositPaid: true,
        depositExpiresAt: null,
        stripePaymentIntentId: paymentIntentId ?? undefined,
      },
      include: { service: true, staff: true, center: true, customer: true },
    })
  })
  if (!booking) return

  sendBookingConfirmation({
    to: booking.customer.email,
    customerName: booking.customer.name,
    centerName: booking.center.name,
    serviceName: booking.service.name,
    staffName: booking.staff?.name,
    startAt: booking.startAt,
    confirmationCode: booking.confirmationCode,
    centerSlug: booking.center.slug,
  }).catch(error => console.error('[email] deposit booking confirmation failed', error))
}
