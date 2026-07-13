import { randomUUID } from 'node:crypto'
import type { PaymentCompensationTarget, Prisma } from '@prisma/client'
import type Stripe from 'stripe'
import { prisma } from '@/lib/db/client'
import { getStripe } from './stripe'

type TransactionClient = Prisma.TransactionClient

export interface CompensationRequest {
  targetType: PaymentCompensationTarget
  targetId: string
  paymentIntentId: string
  reason: string
}

export async function queuePaymentCompensation(
  tx: TransactionClient,
  request: CompensationRequest,
): Promise<void> {
  const idempotencyKey = [
    'refund',
    request.targetType.toLowerCase(),
    request.targetId,
    request.paymentIntentId,
  ].join(':')

  await tx.$executeRaw`
    INSERT INTO "PaymentCompensation" (
      "id",
      "targetType",
      "targetId",
      "paymentIntentId",
      "idempotencyKey",
      "reason",
      "status",
      "updatedAt"
    ) VALUES (
      ${randomUUID()},
      ${request.targetType}::"PaymentCompensationTarget",
      ${request.targetId},
      ${request.paymentIntentId},
      ${idempotencyKey},
      ${request.reason.slice(0, 500)},
      'PENDING',
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("paymentIntentId") DO UPDATE
      SET
        "reason" = EXCLUDED."reason",
        "status" = CASE
          WHEN "PaymentCompensation"."status" = 'SUCCEEDED'
            THEN "PaymentCompensation"."status"
          ELSE 'PENDING'::"PaymentCompensationStatus"
        END,
        "lastError" = CASE
          WHEN "PaymentCompensation"."status" = 'SUCCEEDED'
            THEN "PaymentCompensation"."lastError"
          ELSE NULL
        END,
        "updatedAt" = CURRENT_TIMESTAMP
  `
}

export async function processPaymentCompensation(paymentIntentId: string): Promise<boolean> {
  const claims = await prisma.$queryRaw<Array<{
    targetType: PaymentCompensationTarget
    targetId: string
    paymentIntentId: string
    idempotencyKey: string
    reason: string
  }>>`
    UPDATE "PaymentCompensation"
    SET
      "status" = 'PROCESSING',
      "attempts" = "attempts" + 1,
      "lastError" = NULL,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "paymentIntentId" = ${paymentIntentId}
      AND (
        "status" IN ('PENDING', 'FAILED')
        OR (
          "status" = 'PROCESSING'
          AND "updatedAt" < CURRENT_TIMESTAMP - INTERVAL '10 minutes'
        )
      )
    RETURNING "targetType", "targetId", "paymentIntentId", "idempotencyKey", "reason"
  `

  if (claims.length === 0) {
    const existing = await prisma.paymentCompensation.findUnique({
      where: { paymentIntentId },
      select: { status: true },
    })
    return existing?.status === 'SUCCEEDED'
  }

  const claim = claims[0]
  try {
    const refund = await getStripe().refunds.create({
      payment_intent: claim.paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        appTargetType: claim.targetType,
        appTargetId: claim.targetId,
        appReason: claim.reason.slice(0, 500),
      },
    }, { idempotencyKey: claim.idempotencyKey })

    if (refund.status === 'succeeded') {
      await completeCompensation(claim, refund.id)
      return true
    }

    if (refund.status === 'failed' || refund.status === 'canceled') {
      await prisma.paymentCompensation.update({
        where: { paymentIntentId: claim.paymentIntentId },
        data: {
          status: 'FAILED',
          stripeRefundId: refund.id,
          lastError: refund.failure_reason ?? `stripe_refund_${refund.status}`,
        },
      })
      return false
    }

    await prisma.paymentCompensation.update({
      where: { paymentIntentId: claim.paymentIntentId },
      data: { status: 'PROCESSING', stripeRefundId: refund.id },
    })
    return false
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await prisma.paymentCompensation.updateMany({
      where: { paymentIntentId: claim.paymentIntentId, status: 'PROCESSING' },
      data: { status: 'FAILED', lastError: message.slice(0, 2000) },
    })
    throw error
  }
}

export async function syncPaymentCompensationRefund(refund: Stripe.Refund): Promise<void> {
  const paymentIntentId = typeof refund.payment_intent === 'string'
    ? refund.payment_intent
    : refund.payment_intent?.id
  if (!paymentIntentId) return

  const compensation = await prisma.paymentCompensation.findUnique({
    where: { paymentIntentId },
    select: {
      targetType: true,
      targetId: true,
      paymentIntentId: true,
      status: true,
    },
  })
  if (!compensation || compensation.status === 'SUCCEEDED') return

  if (refund.status === 'succeeded') {
    await completeCompensation(compensation, refund.id)
    return
  }
  if (refund.status === 'failed' || refund.status === 'canceled') {
    await prisma.paymentCompensation.update({
      where: { paymentIntentId },
      data: {
        status: 'FAILED',
        stripeRefundId: refund.id,
        lastError: refund.failure_reason ?? `stripe_refund_${refund.status}`,
      },
    })
  }
}

async function completeCompensation(
  compensation: Pick<CompensationRequest, 'targetType' | 'targetId' | 'paymentIntentId'>,
  stripeRefundId: string,
): Promise<void> {
  await prisma.$transaction(async tx => {
    await tx.paymentCompensation.update({
      where: { paymentIntentId: compensation.paymentIntentId },
      data: {
        status: 'SUCCEEDED',
        stripeRefundId,
        completedAt: new Date(),
        lastError: null,
      },
    })

    if (compensation.targetType === 'ORDER') {
      await tx.order.updateMany({
        where: {
          id: compensation.targetId,
          stripePaymentIntentId: compensation.paymentIntentId,
          paymentState: 'REFUND_PENDING',
        },
        data: { paymentState: 'REFUNDED', refundedAt: new Date() },
      })
    } else {
      await tx.booking.updateMany({
        where: {
          id: compensation.targetId,
          stripePaymentIntentId: compensation.paymentIntentId,
          paymentState: 'REFUND_PENDING',
        },
        data: { paymentState: 'REFUNDED', refundedAt: new Date() },
      })
    }
  })
}
