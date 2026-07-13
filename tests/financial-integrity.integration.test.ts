import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { redeemBonoSessionAtomic } from '@/lib/billing/bonos'
import {
  releaseOrderStockReservation,
  settleOrderPaymentAtomically,
} from '@/lib/billing/payment-integrity'
import { prisma } from '@/lib/db/client'

const describeDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeDatabase('financial integrity integration', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  let organizationId = ''
  let centerId = ''
  let productId = ''
  let orderId = ''
  let bonoId = ''
  let bonoInstanceId = ''
  let customerId = ''

  beforeAll(async () => {
    const organization = await prisma.organization.create({
      data: { name: `Financial ${suffix}`, slug: `financial-${suffix}`, plan: 'BASIC' },
    })
    organizationId = organization.id
    const center = await prisma.center.create({
      data: {
        organizationId,
        name: `Financial center ${suffix}`,
        slug: `financial-center-${suffix}`,
        category: 'ESTETICA',
        addressCity: 'Madrid',
        addressProvince: 'Madrid',
        published: true,
      },
    })
    centerId = center.id
    const product = await prisma.product.create({
      data: {
        centerId,
        name: `Product ${suffix}`,
        slug: `product-${suffix}`,
        priceCents: 1500,
        stock: 9,
      },
    })
    productId = product.id
    const order = await prisma.order.create({
      data: {
        centerId,
        customerName: 'Clienta test',
        customerEmail: `order-${suffix}@example.com`,
        totalCents: 1500,
        status: 'PENDING',
        paymentState: 'CHECKOUT_PENDING',
        items: {
          create: { productId, name: product.name, priceCents: 1500, quantity: 1 },
        },
        stockReservation: {
          create: { expiresAt: new Date(Date.now() + 30 * 60_000) },
        },
      },
    })
    orderId = order.id

    const bono = await prisma.bono.create({
      data: {
        centerId,
        name: `Bono ${suffix}`,
        sessions: 1,
        validityDays: 30,
        priceCents: 2500,
      },
    })
    bonoId = bono.id
    const customer = await prisma.customer.create({
      data: {
        centerId,
        name: 'Clienta bono',
        email: `bono-${suffix}@example.com`,
      },
    })
    customerId = customer.id
    const instance = await prisma.bonoInstance.create({
      data: {
        bonoId,
        customerId,
        centerId,
        sessionsRemaining: 1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
      },
    })
    bonoInstanceId = instance.id
  })

  afterAll(async () => {
    if (orderId) {
      await prisma.paymentCompensation.deleteMany({ where: { targetType: 'ORDER', targetId: orderId } })
      await prisma.order.deleteMany({ where: { id: orderId } })
    }
    if (bonoInstanceId) await prisma.bonoInstance.deleteMany({ where: { id: bonoInstanceId } })
    if (customerId) await prisma.customer.deleteMany({ where: { id: customerId } })
    if (bonoId) await prisma.bono.deleteMany({ where: { id: bonoId } })
    if (productId) await prisma.product.deleteMany({ where: { id: productId } })
    if (centerId) await prisma.center.deleteMany({ where: { id: centerId } })
    if (organizationId) await prisma.organization.deleteMany({ where: { id: organizationId } })
  })

  it('serializa pago y liberacion sin producir pedido pagado con stock devuelto', async () => {
    await Promise.allSettled([
      settleOrderPaymentAtomically({
        orderId,
        paymentIntentId: `pi_${suffix}`,
        checkoutSessionId: `cs_${suffix}`,
      }),
      releaseOrderStockReservation(orderId, 'concurrency_test'),
    ])

    const [order, reservation, product] = await Promise.all([
      prisma.order.findUniqueOrThrow({ where: { id: orderId } }),
      prisma.orderStockReservation.findUniqueOrThrow({ where: { orderId } }),
      prisma.product.findUniqueOrThrow({ where: { id: productId } }),
    ])

    if (order.status === 'PAID') {
      expect(reservation.consumedAt).not.toBeNull()
      expect(reservation.releasedAt).toBeNull()
      expect(product.stock).toBe(9)
    } else {
      expect(order.status).toBe('CANCELLED')
      expect(reservation.releasedAt).not.toBeNull()
      expect(reservation.consumedAt).toBeNull()
      expect(product.stock).toBe(10)
    }
  })

  it('permite exactamente un canje cuando queda una sola sesion', async () => {
    const results = await Promise.all([
      redeemBonoSessionAtomic(bonoInstanceId, organizationId),
      redeemBonoSessionAtomic(bonoInstanceId, organizationId),
    ])
    expect(results.filter(result => result.success)).toHaveLength(1)
    expect(await prisma.bonoInstance.findUniqueOrThrow({ where: { id: bonoInstanceId } }))
      .toMatchObject({ sessionsRemaining: 0 })
  })
})
