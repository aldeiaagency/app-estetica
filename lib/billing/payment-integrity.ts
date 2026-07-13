import type { OrderStatus, PaymentState, Prisma } from '@prisma/client'
import { Prisma as PrismaRuntime } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import { processPaymentCompensation, queuePaymentCompensation } from './payment-compensation'
import { canAdvanceOrderStatus } from './state-machine'
import { getStripe } from './stripe'

type TransactionClient = Prisma.TransactionClient

interface LockedOrder {
  id: string
  status: OrderStatus
  paymentState: PaymentState
  checkoutSessionId: string | null
  stripePaymentIntentId: string | null
  notes: string | null
}

interface LockedReservation {
  orderId: string
  expiresAt: Date
  releasedAt: Date | null
  consumedAt: Date | null
  restockedAt: Date | null
}

export type OrderPaymentSettlement = 'PAID' | 'ALREADY_PAID' | 'COMPENSATION_PENDING' | 'NOT_FOUND'

export interface OrderCommandResult {
  success: boolean
  error?: string
  compensationPending?: boolean
}

export async function claimStripeEvent(eventId: string, type: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO "StripeWebhookEvent" ("id", "type", "status")
    VALUES (${eventId}, ${type}, 'PROCESSING')
    ON CONFLICT ("id") DO UPDATE
      SET
        "attempts" = "StripeWebhookEvent"."attempts" + 1,
        "status" = 'PROCESSING',
        "claimedAt" = CURRENT_TIMESTAMP,
        "lastError" = NULL
      WHERE "StripeWebhookEvent"."status" = 'FAILED'
         OR (
           "StripeWebhookEvent"."status" = 'PROCESSING'
           AND "StripeWebhookEvent"."claimedAt" < CURRENT_TIMESTAMP - INTERVAL '10 minutes'
         )
    RETURNING "id"
  `
  return rows.length === 1
}

export async function completeStripeEvent(eventId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "StripeWebhookEvent"
    SET "status" = 'PROCESSED', "processedAt" = CURRENT_TIMESTAMP, "lastError" = NULL
    WHERE "id" = ${eventId}
  `
}

export async function failStripeEvent(eventId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)
  await prisma.$executeRaw`
    UPDATE "StripeWebhookEvent"
    SET "status" = 'FAILED', "lastError" = ${message.slice(0, 2000)}
    WHERE "id" = ${eventId}
  `
}

export async function createOrderStockReservation(orderId: string, expiresAt: Date): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "OrderStockReservation" ("orderId", "expiresAt")
    VALUES (${orderId}, ${expiresAt})
    ON CONFLICT ("orderId") DO UPDATE
      SET "expiresAt" = EXCLUDED."expiresAt"
      WHERE "OrderStockReservation"."releasedAt" IS NULL
        AND "OrderStockReservation"."consumedAt" IS NULL
  `
}

async function lockOrder(
  tx: TransactionClient,
  orderId: string,
  organizationId?: string,
): Promise<LockedOrder | null> {
  const rows = organizationId
    ? await tx.$queryRaw<LockedOrder[]>`
        SELECT
          o."id",
          o."status",
          o."paymentState",
          o."checkoutSessionId",
          o."stripePaymentIntentId",
          o."notes"
        FROM "Order" o
        JOIN "Center" c ON c."id" = o."centerId"
        WHERE o."id" = ${orderId} AND c."organizationId" = ${organizationId}
        FOR UPDATE OF o
      `
    : await tx.$queryRaw<LockedOrder[]>`
        SELECT
          "id",
          "status",
          "paymentState",
          "checkoutSessionId",
          "stripePaymentIntentId",
          "notes"
        FROM "Order"
        WHERE "id" = ${orderId}
        FOR UPDATE
      `
  return rows[0] ?? null
}

async function lockReservation(tx: TransactionClient, orderId: string): Promise<LockedReservation | null> {
  const rows = await tx.$queryRaw<LockedReservation[]>`
    SELECT "orderId", "expiresAt", "releasedAt", "consumedAt", "restockedAt"
    FROM "OrderStockReservation"
    WHERE "orderId" = ${orderId}
    FOR UPDATE
  `
  return rows[0] ?? null
}

async function restoreOrderStock(tx: TransactionClient, orderId: string): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Product" p
    SET "stock" = p."stock" + lines."quantity"
    FROM (
      SELECT "productId", SUM("quantity")::integer AS "quantity"
      FROM "OrderItem"
      WHERE "orderId" = ${orderId}
      GROUP BY "productId"
    ) lines
    WHERE p."id" = lines."productId"
      AND p."stock" IS NOT NULL
  `
}

async function releaseActiveReservation(
  tx: TransactionClient,
  reservation: LockedReservation,
  reason: string,
): Promise<boolean> {
  if (reservation.releasedAt || reservation.consumedAt) return false

  await restoreOrderStock(tx, reservation.orderId)
  await tx.orderStockReservation.update({
    where: { orderId: reservation.orderId },
    data: {
      releasedAt: new Date(),
      releaseReason: reason.slice(0, 200),
    },
  })
  return true
}

async function restockConsumedReservation(
  tx: TransactionClient,
  reservation: LockedReservation | null,
  reason: string,
): Promise<void> {
  if (!reservation || reservation.restockedAt) return

  if (!reservation.consumedAt) {
    await releaseActiveReservation(tx, reservation, reason)
    return
  }

  await restoreOrderStock(tx, reservation.orderId)
  await tx.orderStockReservation.update({
    where: { orderId: reservation.orderId },
    data: { restockedAt: new Date(), releaseReason: reason.slice(0, 200) },
  })
}

async function queueOrderRefund(
  tx: TransactionClient,
  orderId: string,
  paymentIntentId: string,
  reason: string,
): Promise<void> {
  await queuePaymentCompensation(tx, {
    targetType: 'ORDER',
    targetId: orderId,
    paymentIntentId,
    reason,
  })
}

export async function settleOrderPaymentAtomically(params: {
  orderId: string
  paymentIntentId: string
  checkoutSessionId: string
}): Promise<OrderPaymentSettlement> {
  return prisma.$transaction(async tx => {
    const order = await lockOrder(tx, params.orderId)
    if (!order) return 'NOT_FOUND'

    const samePayment = order.stripePaymentIntentId === params.paymentIntentId
    if (order.status !== 'PENDING') {
      if (samePayment && ['PAID', 'READY', 'COMPLETED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
        const reservation = await lockReservation(tx, order.id)
        if (reservation && !reservation.releasedAt && !reservation.consumedAt) {
          await tx.orderStockReservation.update({
            where: { orderId: order.id },
            data: { consumedAt: new Date() },
          })
        }
        return 'ALREADY_PAID'
      }

      await queueOrderRefund(tx, order.id, params.paymentIntentId, `payment_after_${order.status.toLowerCase()}`)
      if (order.status === 'CANCELLED' && (!order.stripePaymentIntentId || samePayment)) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            stripePaymentIntentId: params.paymentIntentId,
            checkoutSessionId: order.checkoutSessionId ?? params.checkoutSessionId,
            paymentState: 'REFUND_PENDING',
          },
        })
      }
      return 'COMPENSATION_PENDING'
    }

    const reservation = await lockReservation(tx, order.id)
    if (order.checkoutSessionId && order.checkoutSessionId !== params.checkoutSessionId) {
      if (reservation && !reservation.releasedAt && !reservation.consumedAt) {
        await releaseActiveReservation(tx, reservation, 'stale_checkout_session_paid')
      } else if (reservation?.consumedAt && !reservation.restockedAt) {
        await restockConsumedReservation(tx, reservation, 'stale_checkout_session_paid')
      }
      await queueOrderRefund(tx, order.id, params.paymentIntentId, 'stale_checkout_session_paid')
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentState: 'REFUND_PENDING',
          stripePaymentIntentId: params.paymentIntentId,
          paidAt: new Date(),
          notes: appendNote(order.notes, 'Pago compensado desde una sesion de checkout obsoleta'),
        },
      })
      return 'COMPENSATION_PENDING'
    }

    const reservationIsUsable = reservation
      && !reservation.releasedAt
      && !reservation.consumedAt
      && reservation.expiresAt > new Date()

    if (!reservationIsUsable) {
      if (reservation && !reservation.releasedAt && !reservation.consumedAt) {
        await releaseActiveReservation(tx, reservation, 'payment_after_stock_hold_expired')
      } else if (reservation?.consumedAt && !reservation.restockedAt) {
        await restockConsumedReservation(tx, reservation, 'payment_with_inconsistent_stock_hold')
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentState: 'REFUND_PENDING',
          stripePaymentIntentId: params.paymentIntentId,
          checkoutSessionId: order.checkoutSessionId ?? params.checkoutSessionId,
          notes: appendNote(order.notes, 'Pago compensado por reserva de stock no disponible'),
        },
      })
      await queueOrderRefund(tx, order.id, params.paymentIntentId, 'stock_hold_unavailable')
      return 'COMPENSATION_PENDING'
    }

    await tx.orderStockReservation.update({
      where: { orderId: order.id },
      data: { consumedAt: new Date() },
    })
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paymentState: 'PAID',
        paidAt: new Date(),
        stripePaymentIntentId: params.paymentIntentId,
        checkoutSessionId: order.checkoutSessionId ?? params.checkoutSessionId,
      },
    })
    return 'PAID'
  }, { isolationLevel: PrismaRuntime.TransactionIsolationLevel.Serializable })
}

export async function releaseOrderStockReservation(orderId: string, reason: string): Promise<boolean> {
  const result = await prisma.$transaction(async tx => {
    const order = await lockOrder(tx, orderId)
    if (!order || order.status !== 'PENDING') return { released: false, checkoutSessionId: null }

    const reservation = await lockReservation(tx, order.id)
    if (!reservation || !await releaseActiveReservation(tx, reservation, reason)) {
      return { released: false, checkoutSessionId: null }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        paymentState: order.paymentState === 'CHECKOUT_PENDING' ? 'CANCELLED' : order.paymentState,
        notes: appendNote(order.notes, `Stock liberado: ${reason}`),
      },
    })
    return { released: true, checkoutSessionId: order.checkoutSessionId }
  }, { isolationLevel: PrismaRuntime.TransactionIsolationLevel.Serializable })

  if (result.released && result.checkoutSessionId && reason !== 'checkout_session_expired') {
    await expireCheckoutSessionIfOpen(result.checkoutSessionId).catch(error => {
      console.error('[billing] unable to expire cancelled order checkout', orderId, error)
    })
  }
  return result.released
}

export async function expireOrderStockReservations(limit = 100): Promise<number> {
  const reservations = await prisma.$queryRaw<{ orderId: string }[]>`
    SELECT "orderId"
    FROM "OrderStockReservation"
    WHERE "expiresAt" <= CURRENT_TIMESTAMP
      AND "releasedAt" IS NULL
      AND "consumedAt" IS NULL
    ORDER BY "expiresAt" ASC
    LIMIT ${Math.max(1, Math.min(limit, 500))}
  `

  let released = 0
  for (const reservation of reservations) {
    if (await releaseOrderStockReservation(reservation.orderId, 'checkout_expired_cleanup')) released += 1
  }
  return released
}

export async function markOrderPaidInStore(
  orderId: string,
  organizationId: string,
): Promise<OrderCommandResult> {
  return prisma.$transaction(async tx => {
    const order = await lockOrder(tx, orderId, organizationId)
    if (!order) return { success: false, error: 'Pedido no encontrado' }
    if (order.status === 'PAID') return { success: true }
    if (order.status !== 'PENDING') return { success: false, error: 'El pedido ya no admite ese cambio' }
    if (order.checkoutSessionId || order.paymentState === 'CHECKOUT_PENDING') {
      return { success: false, error: 'El pago online sigue pendiente; no se puede marcar manualmente' }
    }

    const reservation = await lockReservation(tx, order.id)
    if (!reservation || reservation.releasedAt || reservation.consumedAt || reservation.expiresAt <= new Date()) {
      return { success: false, error: 'La reserva de stock ya no está disponible' }
    }

    await tx.orderStockReservation.update({
      where: { orderId: order.id },
      data: { consumedAt: new Date() },
    })
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'PAID', paidAt: new Date() },
    })
    return { success: true }
  }, { isolationLevel: PrismaRuntime.TransactionIsolationLevel.Serializable })
}

export async function advanceOrderStatus(
  orderId: string,
  organizationId: string,
  targetStatus: OrderStatus,
): Promise<OrderCommandResult> {
  return prisma.$transaction(async tx => {
    const order = await lockOrder(tx, orderId, organizationId)
    if (!order) return { success: false, error: 'Pedido no encontrado' }
    if (order.status === targetStatus) return { success: true }
    if (!canAdvanceOrderStatus(order.status, targetStatus)) {
      return { success: false, error: 'Transición de pedido no permitida' }
    }
    await tx.order.update({ where: { id: order.id }, data: { status: targetStatus } })
    return { success: true }
  }, { isolationLevel: PrismaRuntime.TransactionIsolationLevel.Serializable })
}

export async function cancelOrderForOrganization(
  orderId: string,
  organizationId: string,
  reason = 'cancelled_by_business',
): Promise<OrderCommandResult> {
  const result = await prisma.$transaction(async tx => {
    const order = await lockOrder(tx, orderId, organizationId)
    if (!order) return { result: { success: false, error: 'Pedido no encontrado' }, sessionId: null, paymentIntentId: null }

    if (order.status === 'CANCELLED') {
      if (order.stripePaymentIntentId && order.paymentState === 'REFUND_PENDING') {
        await queueOrderRefund(tx, order.id, order.stripePaymentIntentId, reason)
        return {
          result: { success: true, compensationPending: true },
          sessionId: order.checkoutSessionId,
          paymentIntentId: order.stripePaymentIntentId,
        }
      }
      return { result: { success: true }, sessionId: null, paymentIntentId: null }
    }

    if (!['PENDING', 'PAID', 'READY', 'CONFIRMED'].includes(order.status)) {
      return {
        result: { success: false, error: 'El pedido ya no se puede cancelar' },
        sessionId: null,
        paymentIntentId: null,
      }
    }

    const reservation = await lockReservation(tx, order.id)
    if (order.status === 'PENDING') {
      if (!reservation || !await releaseActiveReservation(tx, reservation, reason)) {
        return {
          result: { success: false, error: 'No se pudo liberar la reserva de stock' },
          sessionId: null,
          paymentIntentId: null,
        }
      }
    } else {
      await restockConsumedReservation(tx, reservation, reason)
    }

    const compensationPending = Boolean(order.stripePaymentIntentId)
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        paymentState: compensationPending
          ? 'REFUND_PENDING'
          : order.paymentState === 'CHECKOUT_PENDING' ? 'CANCELLED' : order.paymentState,
        notes: appendNote(order.notes, `Pedido cancelado: ${reason}`),
      },
    })
    if (order.stripePaymentIntentId) {
      await queueOrderRefund(tx, order.id, order.stripePaymentIntentId, reason)
    }

    return {
      result: { success: true, compensationPending },
      sessionId: order.checkoutSessionId,
      paymentIntentId: order.stripePaymentIntentId,
    }
  }, { isolationLevel: PrismaRuntime.TransactionIsolationLevel.Serializable })

  if (!result.result.success) return result.result
  if (result.sessionId) {
    await expireCheckoutSessionIfOpen(result.sessionId).catch(error => {
      console.error('[billing] unable to expire order checkout', orderId, error)
    })
  }
  if (result.paymentIntentId) {
    try {
      await processPaymentCompensation(result.paymentIntentId)
    } catch (error) {
      console.error('[billing] order refund remains pending', orderId, error)
      return {
        success: true,
        error: 'El pedido está cancelado, pero el reembolso queda pendiente de reintento',
        compensationPending: true,
      }
    }
  }
  return result.result
}

export async function expireCheckoutSessionIfOpen(checkoutSessionId: string): Promise<boolean> {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId)
  if (session.status !== 'open') return false
  await stripe.checkout.sessions.expire(checkoutSessionId)
  return true
}

export async function expireCheckoutSessionSafely(
  checkoutSessionId?: string | null,
): Promise<boolean> {
  if (!checkoutSessionId) return false
  try {
    return await expireCheckoutSessionIfOpen(checkoutSessionId)
  } catch (error) {
    console.error('[billing] unable to expire checkout session', checkoutSessionId, error)
    return false
  }
}

function appendNote(current: string | null, note: string) {
  return current ? `${current} | ${note}` : note
}
