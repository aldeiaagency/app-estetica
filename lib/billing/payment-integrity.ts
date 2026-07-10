import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/client'

export async function claimStripeEvent(eventId: string, type: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO "StripeWebhookEvent" ("id", "type", "status")
    VALUES (${eventId}, ${type}, 'PROCESSING')
    ON CONFLICT ("id") DO UPDATE
      SET
        "attempts" = "StripeWebhookEvent"."attempts" + 1,
        "status" = 'PROCESSING',
        "lastError" = NULL
      WHERE "StripeWebhookEvent"."status" = 'FAILED'
         OR (
           "StripeWebhookEvent"."status" = 'PROCESSING'
           AND "StripeWebhookEvent"."createdAt" < CURRENT_TIMESTAMP - INTERVAL '10 minutes'
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

export async function consumeOrderStockReservation(orderId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "OrderStockReservation"
    SET "consumedAt" = COALESCE("consumedAt", CURRENT_TIMESTAMP)
    WHERE "orderId" = ${orderId} AND "releasedAt" IS NULL
  `
}

export async function releaseOrderStockReservation(
  orderId: string,
  reason: string,
): Promise<boolean> {
  return prisma.$transaction(async tx => {
    const claimed = await tx.$queryRaw<{ orderId: string }[]>`
      UPDATE "OrderStockReservation"
      SET "releasedAt" = CURRENT_TIMESTAMP, "releaseReason" = ${reason.slice(0, 200)}
      WHERE "orderId" = ${orderId}
        AND "releasedAt" IS NULL
        AND "consumedAt" IS NULL
      RETURNING "orderId"
    `
    if (claimed.length === 0) return false

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { select: { productId: true, quantity: true } } },
    })
    if (!order) return false

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }

    await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: { status: 'CANCELLED', notes: appendNote(order.notes, `Stock liberado: ${reason}`) },
    })
    return true
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
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
    if (await releaseOrderStockReservation(reservation.orderId, 'checkout_expired_cron')) released += 1
  }
  return released
}

function appendNote(current: string | null, note: string) {
  return current ? `${current} | ${note}` : note
}
