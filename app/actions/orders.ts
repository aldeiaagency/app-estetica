'use server'

import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { createOrderCheckoutSession } from '@/lib/billing/checkout'
import {
  expireOrderStockReservations,
  releaseOrderStockReservation,
} from '@/lib/billing/payment-integrity'
import { isStripeConfigured } from '@/lib/billing/stripe'
import { prisma } from '@/lib/db/client'
import { enforceRateLimit, getRequestFingerprint } from '@/lib/security/rate-limit'
import { createConfirmationToken } from '@/lib/security/confirmation-token'
import {
  calculatePromotion,
  chooseBestPromotion,
  normalizeCouponCode,
  type PromotionRule,
} from '@/lib/marketplace/promotions'

const STRIPE_RESERVATION_MINUTES = 30
const IN_STORE_RESERVATION_HOURS = 24

const orderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
})

const createOrderSchema = z.object({
  centerId: z.string().cuid(),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().transform(value => value.toLowerCase()),
  customerPhone: z.string().trim().max(30).optional(),
  couponCode: z.string().trim().max(40).optional(),
  items: z.array(orderItemSchema).min(1).max(50),
  consentGiven: z.boolean().refine(value => value === true, 'Debes aceptar la política de privacidad'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

type ReservedLine = {
  productId: string
  name: string
  priceCents: number
  quantity: number
  tracksStock: boolean
}

export async function createOrderAction(input: unknown): Promise<
  { success: true; orderId: string; confirmationToken: string; checkoutUrl?: string; discountCents: number; totalCents: number } | { success: false; error: string }
> {
  const parsed = createOrderSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  const { centerId, customerName, customerEmail, customerPhone, couponCode, items } = parsed.data
  const normalizedCouponCode = normalizeCouponCode(couponCode)

  try {
    await enforceRateLimit('order', await getRequestFingerprint(`${centerId}:${customerEmail}`))
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return { success: false, error: 'Demasiados intentos. Espera unos minutos antes de volver a comprar.' }
    }
  }

  const center = await prisma.center.findFirst({
    where: { id: centerId, published: true },
    select: { id: true, name: true },
  })
  if (!center) return { success: false, error: 'Centro no encontrado' }

  const quantityByProduct = new Map<string, number>()
  for (const item of items) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity)
  }
  const productIds = [...quantityByProduct.keys()]
  const onlinePayment = isStripeConfigured()
  await expireOrderStockReservations(50).catch(error => {
    console.error('[order] opportunistic reservation cleanup failed', error)
  })
  const expiresAt = new Date(Date.now() + (
    onlinePayment ? STRIPE_RESERVATION_MINUTES * 60_000 : IN_STORE_RESERVATION_HOURS * 3_600_000
  ))

  try {
    const result = await prisma.$transaction(async tx => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, centerId, active: true },
        select: { id: true, priceCents: true, stock: true, name: true, categoryId: true },
      })
      if (products.length !== productIds.length) throw new Error('PRODUCT_UNAVAILABLE')

      const lines: ReservedLine[] = products.map(product => ({
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents,
        quantity: quantityByProduct.get(product.id)!,
        tracksStock: product.stock !== null,
      }))

      for (const line of lines) {
        if (!line.tracksStock) continue
        const reserved = await tx.product.updateMany({
          where: { id: line.productId, centerId, active: true, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        })
        if (reserved.count !== 1) throw new Error(`OUT_OF_STOCK:${line.name}`)
      }

      const subtotalCents = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0)
      const promotionRows = await tx.promotion.findMany({
        where: {
          centerId,
          active: true,
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
          OR: normalizedCouponCode
            ? [{ code: normalizedCouponCode }, { code: null }]
            : [{ code: null }],
        },
        include: { products: { select: { productId: true } } },
      })
      const promotionLines = products.map(product => ({
        productId: product.id,
        categoryId: product.categoryId,
        unitPriceCents: product.priceCents,
        quantity: quantityByProduct.get(product.id)!,
      }))
      const promotionResults = promotionRows
        .filter(promotion => promotion.maxUses === null || promotion.usedCount < promotion.maxUses)
        .filter(promotion => promotion.code === null || promotion.code === normalizedCouponCode)
        .map(promotion => calculatePromotion({
          id: promotion.id,
          scope: promotion.scope,
          code: promotion.code,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          minimumOrderCents: promotion.minimumOrderCents,
          maxDiscountCents: promotion.maxDiscountCents,
          maxUses: promotion.maxUses,
          usedCount: promotion.usedCount,
          perCustomerLimit: promotion.perCustomerLimit,
          productIds: promotion.products.map(product => product.productId),
          categoryId: promotion.categoryId,
          startsAt: promotion.startsAt,
          endsAt: promotion.endsAt,
          active: promotion.active,
        } satisfies PromotionRule, promotionLines))
        .filter((result): result is NonNullable<typeof result> => result !== null)
      if (normalizedCouponCode && !promotionRows.some(promotion => promotion.code === normalizedCouponCode)) {
        throw new Error('INVALID_COUPON')
      }
      const selectedPromotion = chooseBestPromotion(promotionResults)
      if (normalizedCouponCode && !selectedPromotion) throw new Error('INVALID_COUPON')
      if (selectedPromotion?.promotion.maxUses !== null && selectedPromotion.promotion.usedCount >= selectedPromotion.promotion.maxUses) {
        throw new Error('PROMOTION_EXHAUSTED')
      }
      if (selectedPromotion) {
        const previousRedemptions = await tx.promotionRedemption.count({
          where: { promotionId: selectedPromotion.promotion.id, customerEmail },
        })
        if (previousRedemptions >= selectedPromotion.promotion.perCustomerLimit) throw new Error('PROMOTION_CUSTOMER_LIMIT')
      }
      const discountCents = selectedPromotion?.discountCents ?? 0
      const totalCents = Math.max(0, subtotalCents - discountCents)
      const order = await tx.order.create({
        data: {
          centerId,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          subtotalCents,
          discountCents,
          totalCents,
          promotionId: selectedPromotion?.promotion.id ?? null,
          promotionCode: selectedPromotion?.promotion.code ?? null,
          promotionTitle: selectedPromotion?.promotion.id
            ? promotionRows.find(row => row.id === selectedPromotion.promotion.id)?.title ?? null
            : null,
          status: 'PENDING',
          paymentState: onlinePayment ? 'CHECKOUT_PENDING' : 'NOT_REQUIRED',
          notes: onlinePayment ? 'Stock reservado para pago online' : 'Stock reservado para pago en el centro',
          items: {
            create: lines.map(line => ({
              productId: line.productId,
              name: line.name,
              originalPriceCents: line.priceCents,
              priceCents: line.priceCents,
              discountCents: 0,
              quantity: line.quantity,
            })),
          },
        },
      })

      if (selectedPromotion) {
        const usage = selectedPromotion.promotion.maxUses === null
          ? await tx.promotion.update({
              where: { id: selectedPromotion.promotion.id },
              data: { usedCount: { increment: 1 } },
            })
          : await tx.promotion.updateMany({
              where: { id: selectedPromotion.promotion.id, usedCount: { lt: selectedPromotion.promotion.maxUses } },
              data: { usedCount: { increment: 1 } },
            })
        if ('count' in usage && usage.count !== 1) throw new Error('PROMOTION_EXHAUSTED')
        await tx.promotionRedemption.create({
          data: {
            promotionId: selectedPromotion.promotion.id,
            orderId: order.id,
            customerEmail,
          },
        })
      }

      await tx.$executeRaw`
        INSERT INTO "OrderStockReservation" ("orderId", "expiresAt")
        VALUES (${order.id}, ${expiresAt})
      `
      const checkoutIdempotencyKey = onlinePayment ? `order-checkout:${order.id}` : null
      const persistedOrder = checkoutIdempotencyKey
        ? await tx.order.update({
            where: { id: order.id },
            data: { checkoutIdempotencyKey },
          })
        : order
      return { order: persistedOrder, lines, checkoutIdempotencyKey }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    const confirmationToken = createConfirmationToken('order', result.order.id, customerEmail)
    if (!onlinePayment) return {
      success: true,
      orderId: result.order.id,
      confirmationToken,
      discountCents: result.order.discountCents,
      totalCents: result.order.totalCents,
    }

    try {
      const checkoutUrl = await createOrderCheckoutSession({
        orderId: result.order.id,
        items: result.lines.map(line => ({
          name: line.name,
          priceCents: line.priceCents,
          quantity: line.quantity,
        })),
        customerEmail,
        centerName: center.name,
        expiresAt,
        idempotencyKey: result.checkoutIdempotencyKey!,
      })
      return {
        success: true,
        orderId: result.order.id,
        confirmationToken,
        checkoutUrl,
        discountCents: result.order.discountCents,
        totalCents: result.order.totalCents,
      }
    } catch (error) {
      console.error('[order] Stripe checkout session failed', error)
      await releaseOrderStockReservation(result.order.id, 'checkout_creation_failed')
      return { success: false, error: 'No se pudo iniciar el pago. El stock ha sido restablecido.' }
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'PRODUCT_UNAVAILABLE') {
      return { success: false, error: 'Uno o más productos no están disponibles' }
    }
    if (error instanceof Error && error.message.startsWith('OUT_OF_STOCK:')) {
      return { success: false, error: `Stock insuficiente para "${error.message.slice(13)}"` }
    }
    if (error instanceof Error && error.message === 'INVALID_COUPON') {
      return { success: false, error: 'El cupón no es válido o no se puede aplicar a este pedido.' }
    }
    if (error instanceof Error && error.message === 'PROMOTION_EXHAUSTED') {
      return { success: false, error: 'La promoción ya no está disponible.' }
    }
    if (error instanceof Error && error.message === 'PROMOTION_CUSTOMER_LIMIT') {
      return { success: false, error: 'Ya has utilizado esta promoción.' }
    }
    console.error('[order] creation failed', error)
    return { success: false, error: 'Error al procesar el pedido. Inténtalo de nuevo.' }
  }
}
