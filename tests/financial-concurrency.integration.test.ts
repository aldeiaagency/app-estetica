import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { redeemBonoSessionAtomic } from '@/lib/billing/bonos'
import {
  claimStripeEvent,
  releaseOrderStockReservation,
  settleOrderPaymentAtomically,
} from '@/lib/billing/payment-integrity'
import { prisma } from '@/lib/db/client'

const describeDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeDatabase('financial concurrency integration', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  let organizationId = ''
  let centerId = ''
  let productId = ''
  let customerId = ''
  let bonoId = ''
  const orderIds: string[] = []
  const paymentIntentIds: string[] = []
  const stripeEventIds: string[] = []

  beforeAll(async () => {
    const organization = await prisma.organization.create({
      data: { name: `Financial ${suffix}`, slug: `financial-${suffix}`, plan: 'BASIC' },
    })
    organizationId = organization.id
    const center = await prisma.center.create({
      data: {
        organizationId,
        name: `Center ${suffix}`,
        slug: `financial-center-${suffix}`,
        category: 'ESTETICA',
        addressCity: 'Madrid',
        addressProvince: 'Madrid',
        published: true,
      },
    })
    centerId = center.id
    const product = await prisma.product.create({
      data: { centerId, name: 'Serum test', priceCents: 2500, stock: 10, active: true },
    })
    productId = product.id
    const customer = await prisma.customer.create({
      data: { centerId, name: 'Clienta test', email: `financial-${suffix}@example.com` },
    })
    customerId = customer.id
    const bono = await prisma.bono.create({
      data: {
        centerId,
        name: 'Bono test',
        sessions: 1,
        validityDays: 30,
        priceCents: 2500,
      },
    })
    bonoId = bono.id
  })

  afterAll(async () => {
    if (stripeEventIds.length) {
      await prisma.stripeWebhookEvent.deleteMany({ where: { id: { in: stripeEventIds } } })
    }
    if (paymentIntentIds.length) {
      await prisma.paymentCompensation.deleteMany({
        where: { paymentIntentId: { in: paymentIntentIds } },
      })
    }
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
    if (bonoId) await prisma.bonoInstance.deleteMany({ where: { bonoId } })
    if (bonoId) await prisma.bono.deleteMany({ where: { id: bonoId } })
    if (customerId) await prisma.customer.deleteMany({ where: { id: customerId } })
    if (productId) await prisma.product.deleteMany({ where: { id: productId } })
    if (centerId) await prisma.center.deleteMany({ where: { id: centerId } })
    if (organizationId) await prisma.organization.deleteMany({ where: { id: organizationId } })
  })

  async function createReservedOrder(label: string) {
    return prisma.$transaction(async tx => {
      await tx.product.update({ where: { id: productId }, data: { stock: { decrement: 1 } } })
      const order = await tx.order.create({
        data: {
          centerId,
          customerName: 'Clienta test',
          customerEmail: `financial-${suffix}@example.com`,
          totalCents: 2500,
          paymentState: 'CHECKOUT_PENDING',
          checkoutSessionId: `cs_test_${label}_${suffix}`,
          checkoutIdempotencyKey: `checkout_${label}_${suffix}`,
          items: {
            create: { productId, name: 'Serum test', priceCents: 2500, quantity: 1 },
          },
          stockReservation: {
            create: { expiresAt: new Date(Date.now() + 60_000) },
          },
        },
      })
      orderIds.push(order.id)
      return order
    })
  }

  it('turns a payment after release into a traceable compensation without double stock', async () => {
    const order = await createReservedOrder('late')
    const paymentIntentId = `pi_test_late_${suffix}`
    paymentIntentIds.push(paymentIntentId)

    expect(await releaseOrderStockReservation(order.id, 'integration_test_expired')).toBe(true)
    expect(await settleOrderPaymentAtomically({
      orderId: order.id,
      paymentIntentId,
      checkoutSessionId: order.checkoutSessionId!,
    })).toBe('COMPENSATION_PENDING')

    const [persistedOrder, product, compensation] = await Promise.all([
      prisma.order.findUniqueOrThrow({ where: { id: order.id } }),
      prisma.product.findUniqueOrThrow({ where: { id: productId } }),
      prisma.paymentCompensation.findUniqueOrThrow({ where: { paymentIntentId } }),
    ])
    expect(persistedOrder.status).toBe('CANCELLED')
    expect(persistedOrder.paymentState).toBe('REFUND_PENDING')
    expect(product.stock).toBe(10)
    expect(compensation.status).toBe('PENDING')
  })

  it('redeems the last bono session exactly once under concurrency', async () => {
    const instance = await prisma.bonoInstance.create({
      data: {
        bonoId,
        customerId,
        centerId,
        sessionsRemaining: 1,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    })

    const results = await Promise.all([
      redeemBonoSessionAtomic(instance.id, organizationId),
      redeemBonoSessionAtomic(instance.id, organizationId),
    ])
    expect(results.filter(result => result.success)).toHaveLength(1)
    expect(results.filter(result => !result.success && result.reason === 'EMPTY')).toHaveLength(1)
    expect((await prisma.bonoInstance.findUniqueOrThrow({ where: { id: instance.id } })).sessionsRemaining).toBe(0)
  })

  it('lets only one concurrent webhook worker claim an event', async () => {
    const eventId = `evt_test_${suffix}`
    stripeEventIds.push(eventId)
    const claims = await Promise.all([
      claimStripeEvent(eventId, 'checkout.session.completed'),
      claimStripeEvent(eventId, 'checkout.session.completed'),
    ])
    expect(claims.filter(Boolean)).toHaveLength(1)
  })
})
