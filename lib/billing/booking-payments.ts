import type { BookingStatus, CancelledBy, PaymentState, Prisma } from '@prisma/client'
import { Prisma as PrismaRuntime } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import { sendBookingConfirmation } from '@/lib/notifications/email'
import { expireCheckoutSessionIfOpen } from './payment-integrity'
import { processPaymentCompensation, queuePaymentCompensation } from './payment-compensation'
import { canTransitionBookingStatus } from './state-machine'

type TransactionClient = Prisma.TransactionClient

interface LockedBooking {
  id: string
  status: BookingStatus
  customerId: string
  depositCents: number | null
  depositPaid: boolean
  depositExpiresAt: Date | null
  checkoutSessionId: string | null
  stripePaymentIntentId: string | null
  paymentState: PaymentState
}

export interface BookingCommandResult {
  success: boolean
  changed?: boolean
  previousStatus?: BookingStatus
  error?: string
  compensationPending?: boolean
}

type BookingDepositOutcome = 'PAID' | 'ALREADY_PAID' | 'COMPENSATION_PENDING' | 'NOT_FOUND'

async function lockBooking(
  tx: TransactionClient,
  bookingId: string,
  organizationId?: string,
): Promise<LockedBooking | null> {
  const rows = organizationId
    ? await tx.$queryRaw<LockedBooking[]>`
        SELECT
          b."id",
          b."status",
          b."customerId",
          b."depositCents",
          b."depositPaid",
          b."depositExpiresAt",
          b."checkoutSessionId",
          b."stripePaymentIntentId",
          b."paymentState"
        FROM "Booking" b
        JOIN "Center" c ON c."id" = b."centerId"
        WHERE b."id" = ${bookingId} AND c."organizationId" = ${organizationId}
        FOR UPDATE OF b
      `
    : await tx.$queryRaw<LockedBooking[]>`
        SELECT
          "id",
          "status",
          "customerId",
          "depositCents",
          "depositPaid",
          "depositExpiresAt",
          "checkoutSessionId",
          "stripePaymentIntentId",
          "paymentState"
        FROM "Booking"
        WHERE "id" = ${bookingId}
        FOR UPDATE
      `
  return rows[0] ?? null
}

async function queueBookingRefund(
  tx: TransactionClient,
  bookingId: string,
  paymentIntentId: string,
  reason: string,
): Promise<void> {
  await queuePaymentCompensation(tx, {
    targetType: 'BOOKING',
    targetId: bookingId,
    paymentIntentId,
    reason,
  })
}

export async function settleBookingDepositAtomically(params: {
  bookingId: string
  paymentIntentId: string
  checkoutSessionId: string
}): Promise<BookingDepositOutcome> {
  return prisma.$transaction(async tx => {
    const booking = await lockBooking(tx, params.bookingId)
    if (!booking) return 'NOT_FOUND'

    const samePayment = booking.stripePaymentIntentId === params.paymentIntentId
    if (booking.depositPaid && samePayment) return 'ALREADY_PAID'

    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      await queueBookingRefund(
        tx,
        booking.id,
        params.paymentIntentId,
        `payment_after_${booking.status.toLowerCase()}`,
      )
      if (booking.status === 'CANCELLED' && (!booking.stripePaymentIntentId || samePayment)) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            stripePaymentIntentId: params.paymentIntentId,
            checkoutSessionId: booking.checkoutSessionId ?? params.checkoutSessionId,
            paymentState: 'REFUND_PENDING',
          },
        })
      }
      return 'COMPENSATION_PENDING'
    }

    if (booking.checkoutSessionId && booking.checkoutSessionId !== params.checkoutSessionId) {
      await queueBookingRefund(tx, booking.id, params.paymentIntentId, 'stale_checkout_session_paid')
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'SYSTEM',
          cancellationReason: 'El pago llego desde una sesion de checkout obsoleta.',
          stripePaymentIntentId: params.paymentIntentId,
          paymentState: 'REFUND_PENDING',
        },
      })
      return 'COMPENSATION_PENDING'
    }

    if (booking.depositExpiresAt && booking.depositExpiresAt <= new Date()) {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'SYSTEM',
          cancellationReason: 'El pago llegó después de caducar la señal.',
          stripePaymentIntentId: params.paymentIntentId,
          checkoutSessionId: booking.checkoutSessionId ?? params.checkoutSessionId,
          paymentState: 'REFUND_PENDING',
        },
      })
      await queueBookingRefund(tx, booking.id, params.paymentIntentId, 'booking_hold_expired')
      return 'COMPENSATION_PENDING'
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CONFIRMED',
        depositPaid: true,
        depositExpiresAt: null,
        checkoutSessionId: booking.checkoutSessionId ?? params.checkoutSessionId,
        stripePaymentIntentId: params.paymentIntentId,
        paymentState: 'PAID',
      },
    })
    return 'PAID'
  }, { isolationLevel: PrismaRuntime.TransactionIsolationLevel.Serializable })
}

export async function fulfillBookingDeposit(
  bookingId: string,
  paymentIntentId: string,
  checkoutSessionId: string,
): Promise<void> {
  const outcome = await settleBookingDepositAtomically({ bookingId, paymentIntentId, checkoutSessionId })
  if (outcome === 'NOT_FOUND') throw new Error('BOOKING_NOT_FOUND')
  if (outcome === 'COMPENSATION_PENDING') {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { checkoutSessionId: true },
    })
    if (booking?.checkoutSessionId && booking.checkoutSessionId !== checkoutSessionId) {
      await expireCheckoutSessionIfOpen(booking.checkoutSessionId).catch(() => undefined)
    }
    await processPaymentCompensation(paymentIntentId)
    return
  }
  if (outcome !== 'PAID') return

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true, staff: true, center: true, customer: true },
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

export async function cancelBookingWithPaymentSafety(params: {
  bookingId: string
  cancelledBy: CancelledBy
  reason?: string
  organizationId?: string
}): Promise<BookingCommandResult> {
  const result = await prisma.$transaction(async tx => {
    const booking = await lockBooking(tx, params.bookingId, params.organizationId)
    if (!booking) {
      return { command: { success: false, error: 'Reserva no encontrada' }, sessionId: null, paymentIntentId: null }
    }

    if (booking.status === 'CANCELLED') {
      if (booking.stripePaymentIntentId && booking.paymentState === 'REFUND_PENDING') {
        await queueBookingRefund(tx, booking.id, booking.stripePaymentIntentId, params.reason ?? 'booking_cancelled')
        return {
          command: { success: true, changed: false, compensationPending: true },
          sessionId: booking.checkoutSessionId,
          paymentIntentId: booking.stripePaymentIntentId,
        }
      }
      return { command: { success: true, changed: false }, sessionId: null, paymentIntentId: null }
    }

    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return {
        command: { success: false, error: 'Esta reserva ya no se puede cancelar' },
        sessionId: null,
        paymentIntentId: null,
      }
    }

    const compensationPending = Boolean(booking.stripePaymentIntentId)
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: params.cancelledBy,
        cancellationReason: params.reason?.trim().slice(0, 500) || null,
        paymentState: compensationPending
          ? 'REFUND_PENDING'
          : booking.paymentState === 'CHECKOUT_PENDING' ? 'CANCELLED' : booking.paymentState,
      },
    })
    if (booking.stripePaymentIntentId) {
      await queueBookingRefund(tx, booking.id, booking.stripePaymentIntentId, params.reason ?? 'booking_cancelled')
    }

    return {
      command: {
        success: true,
        changed: true,
        previousStatus: booking.status,
        compensationPending,
      },
      sessionId: booking.checkoutSessionId,
      paymentIntentId: booking.stripePaymentIntentId,
    }
  }, { isolationLevel: PrismaRuntime.TransactionIsolationLevel.Serializable })

  if (!result.command.success) return result.command
  if (result.sessionId) {
    await expireCheckoutSessionIfOpen(result.sessionId).catch(error => {
      console.error('[billing] unable to expire booking checkout', params.bookingId, error)
    })
  }
  if (result.paymentIntentId) {
    try {
      await processPaymentCompensation(result.paymentIntentId)
    } catch (error) {
      console.error('[billing] booking refund remains pending', params.bookingId, error)
      return {
        ...result.command,
        success: true,
        error: 'La reserva está cancelada, pero el reembolso queda pendiente de reintento',
        compensationPending: true,
      }
    }
  }
  return result.command
}

export async function cancelUnpaidBookingHold(
  bookingId: string,
  reason: string,
): Promise<BookingCommandResult> {
  const result = await prisma.$transaction(async tx => {
    const booking = await lockBooking(tx, bookingId)
    if (!booking) return { command: { success: false, error: 'Reserva no encontrada' }, sessionId: null }
    if (booking.status !== 'PENDING' || booking.depositPaid) {
      return { command: { success: false, error: 'La señal ya no está pendiente' }, sessionId: null }
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: 'SYSTEM',
        cancellationReason: reason.slice(0, 500),
        paymentState: booking.paymentState === 'CHECKOUT_PENDING' ? 'CANCELLED' : booking.paymentState,
      },
    })
    return { command: { success: true, changed: true, previousStatus: booking.status }, sessionId: booking.checkoutSessionId }
  }, { isolationLevel: PrismaRuntime.TransactionIsolationLevel.Serializable })

  if (result.sessionId) {
    await expireCheckoutSessionIfOpen(result.sessionId).catch(error => {
      console.error('[billing] unable to expire stale booking checkout', bookingId, error)
    })
  }
  return result.command
}

export async function transitionBookingStatusForOrganization(
  bookingId: string,
  organizationId: string,
  targetStatus: Extract<BookingStatus, 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW'>,
): Promise<BookingCommandResult> {
  return prisma.$transaction(async tx => {
    const booking = await lockBooking(tx, bookingId, organizationId)
    if (!booking) return { success: false, error: 'Reserva no encontrada' }
    if (booking.status === targetStatus) return { success: true, changed: false, previousStatus: booking.status }
    if (!canTransitionBookingStatus(booking.status, targetStatus)) {
      return { success: false, error: 'Transicion de reserva no permitida' }
    }

    if (targetStatus === 'CONFIRMED') {
      if ((booking.depositCents ?? 0) > 0 && !booking.depositPaid) {
        return { success: false, error: 'No se puede confirmar una reserva con la señal pendiente' }
      }
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: targetStatus,
        ...(targetStatus === 'NO_SHOW' ? { noShowAt: new Date() } : {}),
      },
    })
    if (targetStatus === 'NO_SHOW') {
      await tx.customer.update({ where: { id: booking.customerId }, data: { noShowCount: { increment: 1 } } })
    }
    return { success: true, changed: true, previousStatus: booking.status }
  }, { isolationLevel: PrismaRuntime.TransactionIsolationLevel.Serializable })
}
