'use server'

import { randomInt } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { sendBookingConfirmation } from '@/lib/notifications/email'
import { notifyWaitlistForBookingOpening } from '@/lib/waitlist/notifications'
import { createBookingDepositCheckoutSession } from '@/lib/billing/checkout'
import { isStripeConfigured } from '@/lib/billing/stripe'
import {
  bookingSlotErrorMessage,
  isBookingOverlapError,
  resolveBookableSlot,
} from '@/lib/availability/booking-slot'
import { enforceRateLimit, getRequestFingerprint } from '@/lib/security/rate-limit'

const DEPOSIT_HOLD_MINUTES = 35

const createBookingSchema = z.object({
  centerId: z.string().cuid(),
  serviceId: z.string().cuid(),
  staffId: z.string().cuid().nullable().optional(),
  startAt: z.string().datetime(),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().transform(value => value.toLowerCase()),
  customerPhone: z.string().trim().max(30).optional(),
  consentGiven: z.boolean().refine(value => value === true, 'Debes aceptar la política de privacidad'),
  marketingConsent: z.boolean().default(false),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

const waitlistSchema = z.object({
  centerId: z.string().cuid(),
  serviceId: z.string().cuid(),
  staffId: z.string().cuid().nullable().optional(),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().transform(value => value.toLowerCase()),
  customerPhone: z.string().trim().max(30).optional(),
  consentGiven: z.boolean().refine(value => value === true, 'Debes aceptar la política de privacidad'),
  marketingConsent: z.boolean().default(false),
})

export async function createBookingAction(input: unknown): Promise<
  { success: true; confirmationCode: string; checkoutUrl?: string } | { success: false; error: string }
> {
  const parsed = createBookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  const data = parsed.data
  try {
    const fingerprint = await getRequestFingerprint(`${data.centerId}:${data.customerEmail}`)
    await enforceRateLimit('booking', fingerprint)
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return { success: false, error: 'Demasiados intentos. Espera unos minutos antes de volver a reservar.' }
    }
  }

  let resolved: Awaited<ReturnType<typeof resolveBookableSlot>>
  try {
    resolved = await resolveBookableSlot({
      centerId: data.centerId,
      serviceId: data.serviceId,
      staffId: data.staffId,
      startAt: data.startAt,
    })
  } catch (error) {
    return { success: false, error: bookingSlotErrorMessage(error) }
  }

  const depositCents = resolved.service.depositRequired
    && resolved.service.depositCents
    && resolved.service.depositCents > 0
    ? Math.min(resolved.service.depositCents, resolved.service.priceCents)
    : 0
  const requiresOnlineDeposit = depositCents > 0

  if (requiresOnlineDeposit && !isStripeConfigured()) {
    return {
      success: false,
      error: 'Este servicio requiere pago de señal, pero el pago online aún no está configurado.',
    }
  }

  try {
    const booking = await prisma.$transaction(async tx => {
      const customer = await tx.customer.upsert({
        where: { email_centerId: { email: data.customerEmail, centerId: data.centerId } },
        create: {
          centerId: data.centerId,
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone || null,
          consentGivenAt: new Date(),
          marketingConsent: data.marketingConsent,
          marketingConsentDate: data.marketingConsent ? new Date() : null,
        },
        update: {
          name: data.customerName,
          phone: data.customerPhone || null,
          ...(data.marketingConsent
            ? { marketingConsent: true, marketingConsentDate: new Date() }
            : {}),
        },
      })

      const depositExpiresAt = requiresOnlineDeposit
        ? new Date(Date.now() + DEPOSIT_HOLD_MINUTES * 60 * 1000)
        : null

      return tx.booking.create({
        data: {
          confirmationCode: generateConfirmationCode(),
          centerId: data.centerId,
          serviceId: data.serviceId,
          staffId: resolved.staffId,
          customerId: customer.id,
          startAt: resolved.startAt,
          endAt: resolved.endAt,
          status: requiresOnlineDeposit ? 'PENDING' : 'CONFIRMED',
          source: 'WEB',
          depositCents: depositCents || null,
          depositPaid: false,
          depositExpiresAt,
        },
        include: {
          service: true,
          staff: true,
          center: true,
          customer: true,
        },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (requiresOnlineDeposit) {
      try {
        const checkoutUrl = await createBookingDepositCheckoutSession({
          bookingId: booking.id,
          confirmationCode: booking.confirmationCode,
          centerSlug: booking.center.slug,
          centerName: booking.center.name,
          serviceName: booking.service.name,
          serviceId: booking.serviceId,
          depositCents,
          depositExpiresAt: booking.depositExpiresAt
            ?? new Date(Date.now() + DEPOSIT_HOLD_MINUTES * 60 * 1000),
          customerEmail: booking.customer.email,
        })
        return { success: true, confirmationCode: booking.confirmationCode, checkoutUrl }
      } catch (error) {
        console.error('[booking] deposit checkout creation failed', error)
        await prisma.booking.updateMany({
          where: { id: booking.id, status: 'PENDING', depositPaid: false },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: 'SYSTEM',
            cancellationReason: 'No se pudo iniciar el pago del depósito.',
          },
        })
        return { success: false, error: 'No se pudo iniciar el pago del depósito. Inténtalo de nuevo.' }
      }
    }

    sendBookingConfirmation({
      to: booking.customer.email,
      customerName: booking.customer.name,
      centerName: booking.center.name,
      serviceName: booking.service.name,
      staffName: booking.staff?.name,
      startAt: booking.startAt,
      confirmationCode: booking.confirmationCode,
      centerSlug: booking.center.slug,
    }).catch(error => console.error('[email] booking confirmation failed', error))

    return { success: true, confirmationCode: booking.confirmationCode }
  } catch (error) {
    if (isBookingOverlapError(error)) {
      return { success: false, error: 'Ese horario acaba de ser ocupado. Selecciona otro.' }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'No se pudo generar la reserva. Inténtalo de nuevo.' }
    }
    console.error('[booking] creation failed', error)
    return { success: false, error: 'Error al crear la reserva. Inténtalo de nuevo.' }
  }
}

export async function joinWaitlistAction(input: unknown): Promise<
  { success: true; alreadyJoined?: boolean } | { success: false; error: string }
> {
  const parsed = waitlistSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }
  const data = parsed.data

  try {
    const fingerprint = await getRequestFingerprint(`${data.centerId}:${data.customerEmail}`)
    await enforceRateLimit('waitlist', fingerprint)
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return { success: false, error: 'Demasiados intentos. Espera antes de volver a intentarlo.' }
    }
  }

  const [center, service, staffLink] = await Promise.all([
    prisma.center.findFirst({ where: { id: data.centerId, published: true } }),
    prisma.service.findFirst({ where: { id: data.serviceId, centerId: data.centerId, active: true } }),
    data.staffId
      ? prisma.serviceStaff.findFirst({
          where: {
            serviceId: data.serviceId,
            staffId: data.staffId,
            staff: { centerId: data.centerId, active: true },
          },
        })
      : Promise.resolve(true),
  ])
  if (!center) return { success: false, error: 'Centro no disponible' }
  if (!service) return { success: false, error: 'Servicio no disponible' }
  if (!staffLink) return { success: false, error: 'Profesional no disponible para este servicio' }

  const requestedDate = new Date(`${data.requestedDate}T00:00:00.000Z`)
  if (Number.isNaN(requestedDate.getTime()) || requestedDate < new Date(new Date().setHours(0, 0, 0, 0))) {
    return { success: false, error: 'La fecha solicitada debe ser futura.' }
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const customer = await tx.customer.upsert({
        where: { email_centerId: { email: data.customerEmail, centerId: data.centerId } },
        create: {
          centerId: data.centerId,
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone || null,
          consentGivenAt: new Date(),
          marketingConsent: data.marketingConsent,
          marketingConsentDate: data.marketingConsent ? new Date() : null,
        },
        update: {
          name: data.customerName,
          phone: data.customerPhone || null,
          ...(data.marketingConsent
            ? { marketingConsent: true, marketingConsentDate: new Date() }
            : {}),
        },
      })

      const existing = await tx.waitlistEntry.findFirst({
        where: {
          centerId: data.centerId,
          serviceId: data.serviceId,
          staffId: data.staffId ?? null,
          customerId: customer.id,
          requestedDate,
          status: 'WAITING',
        },
      })
      if (existing) return { alreadyJoined: true }

      await tx.waitlistEntry.create({
        data: {
          centerId: data.centerId,
          serviceId: data.serviceId,
          staffId: data.staffId ?? null,
          customerId: customer.id,
          requestedDate,
        },
      })
      return { alreadyJoined: false }
    })
    return { success: true, alreadyJoined: result.alreadyJoined }
  } catch (error) {
    console.error('[waitlist] join failed', error)
    return { success: false, error: 'Error al unirte a la lista de espera. Inténtalo de nuevo.' }
  }
}

export async function cancelBookingAction(
  confirmationCode: string,
  customerEmail: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  const normalizedCode = confirmationCode.trim().toUpperCase()
  const normalizedEmail = customerEmail.trim().toLowerCase()
  try {
    await enforceRateLimit(
      'bookingLookup',
      await getRequestFingerprint(`${normalizedCode}:${normalizedEmail}`),
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return { success: false, error: 'Demasiados intentos. Espera unos minutos.' }
    }
  }

  const booking = await prisma.booking.findFirst({
    where: { confirmationCode: normalizedCode, customer: { email: normalizedEmail } },
    include: { customer: true, service: true, center: true },
  })
  if (!booking) return { success: false, error: 'Reserva no encontrada. Comprueba el código y el email.' }
  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) {
    return { success: false, error: 'Esta reserva ya no se puede cancelar.' }
  }

  const now = new Date()
  const hoursUntilStart = (booking.startAt.getTime() - now.getTime()) / 3_600_000
  if (hoursUntilStart < 24) {
    return { success: false, error: 'La cancelación debe realizarse con al menos 24 horas de antelación.' }
  }

  const updated = await prisma.booking.updateMany({
    where: { id: booking.id, status: { in: ['PENDING', 'CONFIRMED'] } },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
      cancelledBy: 'CUSTOMER',
      cancellationReason: reason?.trim().slice(0, 500) || null,
    },
  })
  if (updated.count === 0) return { success: false, error: 'La reserva ya no se puede cancelar.' }

  notifyWaitlistForBookingOpening({
    centerId: booking.centerId,
    serviceId: booking.serviceId,
    staffId: booking.staffId,
    startAt: booking.startAt,
  }).catch(error => console.error('[waitlist] cancellation notification failed', error))

  return { success: true }
}

const rescheduleSchema = z.object({
  confirmationCode: z.string().trim().length(8).transform(value => value.toUpperCase()),
  customerEmail: z.string().trim().email().transform(value => value.toLowerCase()),
  newStartAt: z.string().datetime(),
})

export async function rescheduleBookingAction(input: unknown): Promise<
  { success: true } | { success: false; error: string }
> {
  const parsed = rescheduleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }
  const data = parsed.data

  try {
    await enforceRateLimit(
      'bookingLookup',
      await getRequestFingerprint(`${data.confirmationCode}:${data.customerEmail}`),
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return { success: false, error: 'Demasiados intentos. Espera unos minutos.' }
    }
  }

  const booking = await prisma.booking.findFirst({
    where: { confirmationCode: data.confirmationCode, customer: { email: data.customerEmail } },
  })
  if (!booking) return { success: false, error: 'Reserva no encontrada.' }
  if (booking.status !== 'CONFIRMED') {
    return { success: false, error: 'Esta reserva no se puede modificar.' }
  }
  if ((booking.startAt.getTime() - Date.now()) / 3_600_000 < 24) {
    return { success: false, error: 'La modificación debe realizarse con al menos 24 horas de antelación.' }
  }

  let resolved: Awaited<ReturnType<typeof resolveBookableSlot>>
  try {
    resolved = await resolveBookableSlot({
      centerId: booking.centerId,
      serviceId: booking.serviceId,
      staffId: booking.staffId,
      startAt: data.newStartAt,
      excludeBookingId: booking.id,
    })
  } catch (error) {
    return { success: false, error: bookingSlotErrorMessage(error) }
  }

  try {
    const previous = booking.startAt.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
    await prisma.$transaction(async tx => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          staffId: resolved.staffId,
          startAt: resolved.startAt,
          endAt: resolved.endAt,
          notes: booking.notes
            ? `${booking.notes} | Reprogramada desde ${previous}`
            : `Reprogramada desde ${previous}`,
        },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    return { success: true }
  } catch (error) {
    if (isBookingOverlapError(error)) {
      return { success: false, error: 'Ese horario acaba de ser ocupado. Selecciona otro.' }
    }
    console.error('[booking] reschedule failed', error)
    return { success: false, error: 'Error al modificar la reserva. Inténtalo de nuevo.' }
  }
}

function generateConfirmationCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => characters[randomInt(characters.length)]).join('')
}
