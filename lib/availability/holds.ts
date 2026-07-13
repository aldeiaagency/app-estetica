import { prisma } from '@/lib/db/client'

export async function expireBookingPaymentHolds(limit = 100): Promise<number> {
  const expired = await prisma.$queryRaw<{ checkoutSessionId: string | null }[]>`
    WITH candidates AS (
      SELECT "id"
      FROM "Booking"
      WHERE "status" = 'PENDING'
        AND "depositPaid" = FALSE
        AND "depositExpiresAt" <= CURRENT_TIMESTAMP
      ORDER BY "depositExpiresAt" ASC
      LIMIT ${Math.max(1, Math.min(limit, 500))}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "Booking" AS booking
    SET
      "status" = 'CANCELLED',
      "paymentState" = CASE
        WHEN booking."paymentState" = 'CHECKOUT_PENDING' THEN 'CANCELLED'::"PaymentState"
        ELSE booking."paymentState"
      END,
      "cancelledAt" = COALESCE(booking."cancelledAt", CURRENT_TIMESTAMP),
      "cancelledBy" = COALESCE(booking."cancelledBy", 'SYSTEM'::"CancelledBy"),
      "updatedAt" = CURRENT_TIMESTAMP,
      "cancellationReason" = COALESCE(
        booking."cancellationReason",
        'Pago de senal no completado dentro del plazo.'
      )
    FROM candidates
    WHERE booking."id" = candidates."id"
      AND booking."status" = 'PENDING'
      AND booking."depositPaid" = FALSE
    RETURNING booking."checkoutSessionId"
  `

  await Promise.allSettled(
    expired
      .filter((hold): hold is { checkoutSessionId: string } => Boolean(hold.checkoutSessionId))
      .map(hold => expireCheckoutSessionIfOpen(hold.checkoutSessionId)),
  )
  return expired.length
}

async function expireCheckoutSessionIfOpen(checkoutSessionId: string) {
  const billing = await import('@/lib/billing/payment-integrity')
  return billing.expireCheckoutSessionIfOpen(checkoutSessionId)
}
