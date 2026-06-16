import { getStripe, APP_URL } from './stripe'
import { prisma } from '@/lib/db/client'
import { sendBookingConfirmation } from '@/lib/notifications/email'

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTOS — Stripe Checkout Session (modo pago único) + fulfillment
// ─────────────────────────────────────────────────────────────────────────────

interface OrderLineItem {
  name:       string
  priceCents: number
  quantity:   number
}

/**
 * Crea una sesión de Stripe Checkout para un pedido ya existente (estado PENDING).
 * Los importes se construyen con datos de la BD (nunca del cliente).
 * Devuelve la URL hospedada de Stripe a la que redirigir.
 */
export async function createOrderCheckoutSession(params: {
  orderId:       string
  items:         OrderLineItem[]
  customerEmail: string
  centerName:    string
}): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: params.customerEmail,
    line_items: params.items.map(i => ({
      quantity: i.quantity,
      price_data: {
        currency: 'eur',
        unit_amount: i.priceCents,
        product_data: { name: i.name },
      },
    })),
    metadata: { type: 'order', orderId: params.orderId },
    payment_intent_data: { metadata: { type: 'order', orderId: params.orderId } },
    success_url: `${APP_URL}/pedido/confirmado/${params.orderId}?paid=1`,
    cancel_url:  `${APP_URL}/carrito`,
  })

  if (!session.url) throw new Error('Stripe no devolvió URL de checkout')
  return session.url
}

/** Marca un pedido como pagado. Idempotente. Llamado desde el webhook. */
export async function fulfillOrderPayment(orderId: string, paymentIntentId: string | null): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } })
  if (!order) return
  if (order.status === 'PAID' || order.status === 'READY' || order.status === 'COMPLETED') return // ya procesado

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId ?? undefined,
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// BONOS — Stripe Checkout Session + fulfillment (crea la BonoInstance al pagar)
// ─────────────────────────────────────────────────────────────────────────────

export interface BonoCheckoutMetadata {
  type:          'bono'
  bonoId:        string
  centerId:      string
  customerName:  string
  customerEmail: string
  customerPhone: string
}

export async function createBonoCheckoutSession(params: {
  bonoId:        string
  bonoName:      string
  priceCents:    number
  centerId:      string
  customerName:  string
  customerEmail: string
  customerPhone?: string
}): Promise<string> {
  const metadata: BonoCheckoutMetadata = {
    type:          'bono',
    bonoId:        params.bonoId,
    centerId:      params.centerId,
    customerName:  params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone ?? '',
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: params.customerEmail,
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
    cancel_url:  `${APP_URL}/bono/${params.bonoId}`,
  })

  if (!session.url) throw new Error('Stripe no devolvió URL de checkout')
  return session.url
}

/**
 * Crea la BonoInstance tras un pago confirmado de Stripe.
 * Idempotente por stripePaymentId. Llamado desde el webhook.
 */
export async function fulfillBonoPayment(meta: BonoCheckoutMetadata, paymentId: string): Promise<void> {
  // Idempotencia: si ya existe una instancia con este pago, no duplicar.
  const existing = await prisma.bonoInstance.findFirst({ where: { stripePaymentId: paymentId } })
  if (existing) return

  const bono = await prisma.bono.findFirst({
    where: { id: meta.bonoId, active: true },
    select: { id: true, sessions: true, validityDays: true, centerId: true },
  })
  if (!bono) return

  const email = meta.customerEmail.toLowerCase()

  await prisma.$transaction(async (tx) => {
    let customer = await tx.customer.findUnique({
      where: { email_centerId: { email, centerId: bono.centerId } },
    })
    if (!customer) {
      customer = await tx.customer.create({
        data: {
          centerId:       bono.centerId,
          name:           meta.customerName.trim() || email,
          email,
          phone:          meta.customerPhone?.trim() || null,
          consentGivenAt: new Date(),
        },
      })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + bono.validityDays)

    await tx.bonoInstance.create({
      data: {
        bonoId:            bono.id,
        customerId:        customer.id,
        centerId:          bono.centerId,
        sessionsRemaining: bono.sessions,
        purchasedAt:       new Date(),
        activatedAt:       new Date(),
        expiresAt,
        stripePaymentId:   paymentId,
      },
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// RESERVAS — deposito anti no-show
// ─────────────────────────────────────────────────────────────────────────────

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
    customer_email: params.customerEmail,
    expires_at: Math.floor(params.depositExpiresAt.getTime() / 1000),
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: params.depositCents,
        product_data: { name: `Deposito reserva: ${params.serviceName}` },
      },
    }],
    metadata: {
      type: 'booking_deposit',
      bookingId: params.bookingId,
    },
    payment_intent_data: {
      metadata: {
        type: 'booking_deposit',
        bookingId: params.bookingId,
      },
    },
    success_url: `${APP_URL}/reserva/confirmada/${params.confirmationCode}?paid=1`,
    cancel_url: `${APP_URL}/centro/${params.centerSlug}/reservar?servicio=${params.serviceId}&pago=cancelado`,
  })

  if (!session.url) throw new Error('Stripe no devolvio URL de checkout')
  return session.url
}

export async function fulfillBookingDeposit(bookingId: string, paymentIntentId: string | null): Promise<void> {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { status: true, depositPaid: true },
  })
  if (!existing || existing.depositPaid) return
  if (existing.status !== 'PENDING' && existing.status !== 'CONFIRMED') return

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CONFIRMED',
      depositPaid: true,
      depositExpiresAt: null,
      stripePaymentIntentId: paymentIntentId ?? undefined,
    },
    include: {
      service: true,
      staff: true,
      center: true,
      customer: true,
    },
  })

  sendBookingConfirmation({
    to: booking.customer.email,
    customerName: booking.customer.name,
    centerName: booking.center.name,
    serviceName: booking.service.name,
    staffName: booking.staff?.name,
    startAt: booking.startAt,
    confirmationCode: booking.confirmationCode,
    centerSlug: booking.center.slug,
  }).catch(err => console.error('[email] Failed to send deposit booking confirmation:', err))
}
