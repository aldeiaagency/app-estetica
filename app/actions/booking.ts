'use server'

import { prisma } from '@/lib/db/client'
import { z } from 'zod'
import { sendBookingConfirmation } from '@/lib/notifications/email'

const createBookingSchema = z.object({
  centerId: z.string().cuid(),
  serviceId: z.string().cuid(),
  staffId: z.string().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  consentGiven: z.boolean().refine(v => v === true, 'Debes aceptar la política de privacidad'),
  marketingConsent: z.boolean().default(false),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

const waitlistSchema = z.object({
  centerId: z.string().cuid(),
  serviceId: z.string().cuid(),
  staffId: z.string().nullable(),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  consentGiven: z.boolean().refine(v => v === true, 'Debes aceptar la politica de privacidad'),
  marketingConsent: z.boolean().default(false),
})

export async function createBookingAction(input: unknown): Promise<
  { success: true; confirmationCode: string } | { success: false; error: string }
> {
  const parsed = createBookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  const { centerId, serviceId, staffId, startAt, endAt, customerName, customerEmail, customerPhone, marketingConsent } = parsed.data

  // Validar centro publicado
  const center = await prisma.center.findFirst({
    where: { id: centerId, published: true },
  })
  if (!center) return { success: false, error: 'Centro no encontrado o no disponible' }

  // Validar servicio
  const service = await prisma.service.findFirst({
    where: { id: serviceId, centerId, active: true },
  })
  if (!service) return { success: false, error: 'Servicio no disponible' }

  // Validar staff
  if (staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, centerId, active: true },
    })
    if (!staff) return { success: false, error: 'Profesional no disponible' }
  }

  const startDate = new Date(startAt)
  const endDate = new Date(endAt)

  // Crear reserva con bloqueo transaccional
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Re-verificar disponibilidad dentro de la transacción
      const conflicts = await tx.booking.count({
        where: {
          centerId,
          ...(staffId ? { staffId } : {}),
          status: { in: ['PENDING', 'CONFIRMED'] },
          AND: [
            { startAt: { lt: endDate } },
            { endAt: { gt: startDate } },
          ],
        },
      })

      if (conflicts > 0) {
        throw new Error('SLOT_TAKEN')
      }

      // Crear/actualizar cliente
      const customer = await tx.customer.upsert({
        where: { email_centerId: { email: customerEmail, centerId } },
        create: {
          centerId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone ?? null,
          consentGivenAt: new Date(),
          marketingConsent,
          marketingConsentDate: marketingConsent ? new Date() : null,
        },
        update: {
          name: customerName,
          phone: customerPhone ?? null,
          ...(marketingConsent ? { marketingConsent, marketingConsentDate: new Date() } : {}),
        },
      })

      // Generar código único
      const confirmationCode = generateConfirmationCode()

      // Crear reserva
      const booking = await tx.booking.create({
        data: {
          confirmationCode,
          centerId,
          serviceId,
          staffId: staffId ?? null,
          customerId: customer.id,
          startAt: startDate,
          endAt: endDate,
          status: 'CONFIRMED',
          source: 'WEB',
        },
        include: {
          service: true,
          staff: true,
          center: true,
          customer: true,
        },
      })

      return booking
    })

    // Enviar email (no bloquea si falla)
    sendBookingConfirmation({
      to: result.customer.email,
      customerName: result.customer.name,
      centerName: result.center.name,
      serviceName: result.service.name,
      staffName: result.staff?.name,
      startAt: result.startAt,
      confirmationCode: result.confirmationCode,
      centerSlug: result.center.slug,
    }).catch(err => console.error('[email] Failed to send confirmation:', err))

    return { success: true, confirmationCode: result.confirmationCode }
  } catch (err) {
    if (err instanceof Error && err.message === 'SLOT_TAKEN') {
      return { success: false, error: 'Lo sentimos, este horario acaba de ser ocupado. Por favor elige otro.' }
    }
    console.error('[booking] Error creating booking:', err)
    return { success: false, error: 'Error al crear la reserva. Inténtalo de nuevo.' }
  }
}

export async function joinWaitlistAction(input: unknown): Promise<
  { success: true; alreadyJoined?: boolean } | { success: false; error: string }
> {
  const parsed = waitlistSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  const {
    centerId,
    serviceId,
    staffId,
    requestedDate,
    customerName,
    customerEmail,
    customerPhone,
    marketingConsent,
  } = parsed.data

  const [center, service] = await Promise.all([
    prisma.center.findFirst({ where: { id: centerId, published: true } }),
    prisma.service.findFirst({ where: { id: serviceId, centerId, active: true } }),
  ])
  if (!center) return { success: false, error: 'Centro no encontrado o no disponible' }
  if (!service) return { success: false, error: 'Servicio no disponible' }

  if (staffId) {
    const staff = await prisma.staff.findFirst({ where: { id: staffId, centerId, active: true } })
    if (!staff) return { success: false, error: 'Profesional no disponible' }
  }

  const date = new Date(`${requestedDate}T00:00:00.000Z`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) {
    return { success: false, error: 'La fecha solicitada debe ser futura.' }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email_centerId: { email: customerEmail, centerId } },
        create: {
          centerId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone ?? null,
          consentGivenAt: new Date(),
          marketingConsent,
          marketingConsentDate: marketingConsent ? new Date() : null,
        },
        update: {
          name: customerName,
          phone: customerPhone ?? null,
          ...(marketingConsent ? { marketingConsent, marketingConsentDate: new Date() } : {}),
        },
      })

      const existing = await tx.waitlistEntry.findFirst({
        where: {
          centerId,
          serviceId,
          staffId: staffId ?? null,
          customerId: customer.id,
          requestedDate: date,
          status: 'WAITING',
        },
      })

      if (existing) return { alreadyJoined: true }

      await tx.waitlistEntry.create({
        data: {
          centerId,
          serviceId,
          staffId: staffId ?? null,
          customerId: customer.id,
          requestedDate: date,
        },
      })

      return { alreadyJoined: false }
    })

    return { success: true, alreadyJoined: result.alreadyJoined }
  } catch (err) {
    console.error('[waitlist] Error joining waitlist:', err)
    return { success: false, error: 'Error al unirte a la lista de espera. Intentalo de nuevo.' }
  }
}

export async function cancelBookingAction(
  confirmationCode: string,
  customerEmail: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const booking = await prisma.booking.findFirst({
    where: {
      confirmationCode,
      customer: { email: customerEmail },
    },
    include: { customer: true, service: true, center: true },
  })

  if (!booking) {
    return { success: false, error: 'Reserva no encontrada. Comprueba el código y el email.' }
  }

  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) {
    return { success: false, error: 'Esta reserva ya no se puede cancelar.' }
  }

  // Política de cancelación: 24h antes por defecto
  const now = new Date()
  const hoursUntilStart = (booking.startAt.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilStart < 24) {
    return {
      success: false,
      error: `La cancelación debe realizarse con al menos 24 horas de antelación. Tu cita es a las ${booking.startAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} del ${booking.startAt.toLocaleDateString('es-ES')}.`,
    }
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
      cancelledBy: 'CUSTOMER',
      cancellationReason: reason ?? null,
    },
  })

  return { success: true }
}

const rescheduleSchema = z.object({
  confirmationCode: z.string().length(8),
  customerEmail: z.string().email(),
  newStartAt: z.string().datetime(),
  newEndAt: z.string().datetime(),
})

export async function rescheduleBookingAction(input: unknown): Promise<
  { success: true } | { success: false; error: string }
> {
  const parsed = rescheduleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  const { confirmationCode, customerEmail, newStartAt, newEndAt } = parsed.data

  const booking = await prisma.booking.findFirst({
    where: { confirmationCode, customer: { email: customerEmail } },
  })

  if (!booking) {
    return { success: false, error: 'Reserva no encontrada.' }
  }

  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) {
    return { success: false, error: 'Esta reserva no se puede modificar.' }
  }

  const now = new Date()
  const hoursUntilStart = (booking.startAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (hoursUntilStart < 24) {
    return { success: false, error: 'La modificación debe realizarse con al menos 24 horas de antelación.' }
  }

  const newStart = new Date(newStartAt)
  const newEnd = new Date(newEndAt)

  if (newStart <= now) {
    return { success: false, error: 'La nueva fecha debe ser en el futuro.' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const conflicts = await tx.booking.count({
        where: {
          id: { not: booking.id },
          ...(booking.staffId ? { staffId: booking.staffId } : { centerId: booking.centerId }),
          status: { in: ['PENDING', 'CONFIRMED'] },
          AND: [{ startAt: { lt: newEnd } }, { endAt: { gt: newStart } }],
        },
      })

      if (conflicts > 0) throw new Error('SLOT_TAKEN')

      const prevDate = booking.startAt.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid',
      })
      const prevTime = booking.startAt.toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
      })

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          startAt: newStart,
          endAt: newEnd,
          notes: booking.notes
            ? `${booking.notes} | Reprogramada desde ${prevDate} ${prevTime}`
            : `Reprogramada desde ${prevDate} ${prevTime}`,
        },
      })
    })

    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'SLOT_TAKEN') {
      return { success: false, error: 'Ese horario ya está ocupado. Por favor elige otro.' }
    }
    console.error('[reschedule] Error:', err)
    return { success: false, error: 'Error al modificar la reserva. Inténtalo de nuevo.' }
  }
}

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
