import { prisma } from '@/lib/db/client'
import { sendWaitlistAvailability } from '@/lib/email/templates'

const TIMEZONE = 'Europe/Madrid'

type BookingOpening = {
  centerId: string
  serviceId: string
  staffId: string | null
  startAt: Date
}

function requestedDateFromBooking(startAt: Date) {
  const dateKey = startAt.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  return new Date(`${dateKey}T00:00:00.000Z`)
}

function formatRequestedDate(date: Date) {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export async function notifyWaitlistEntry(entryId: string, options?: { orgId?: string }) {
  const entry = await prisma.waitlistEntry.findUnique({
    where: { id: entryId },
    include: {
      center: { select: { id: true, organizationId: true, name: true, slug: true } },
      customer: { select: { name: true, email: true } },
    },
  })

  if (!entry) return { success: false, error: 'Solicitud no encontrada' }
  if (options?.orgId && entry.center.organizationId !== options.orgId) {
    return { success: false, error: 'Sin permisos' }
  }

  const service = await prisma.service.findFirst({
    where: { id: entry.serviceId, centerId: entry.centerId },
    select: { name: true },
  })

  await sendWaitlistAvailability({
    to: entry.customer.email,
    customerName: entry.customer.name,
    centerName: entry.center.name,
    centerSlug: entry.center.slug,
    serviceName: service?.name ?? 'Servicio solicitado',
    requestedDate: formatRequestedDate(entry.requestedDate),
  })

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: {
      status: 'NOTIFIED',
      notifiedAt: new Date(),
    },
  })

  return { success: true }
}

export async function notifyWaitlistForBookingOpening(opening: BookingOpening, limit = 3) {
  const requestedDate = requestedDateFromBooking(opening.startAt)
  const entries = await prisma.waitlistEntry.findMany({
    where: {
      centerId: opening.centerId,
      serviceId: opening.serviceId,
      requestedDate,
      status: 'WAITING',
      OR: opening.staffId
        ? [{ staffId: opening.staffId }, { staffId: null }]
        : [{ staffId: null }],
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  let notified = 0
  for (const entry of entries) {
    try {
      const result = await notifyWaitlistEntry(entry.id)
      if (result.success) notified += 1
    } catch (err) {
      console.error('[waitlist] Failed to notify entry:', entry.id, err)
    }
  }

  return notified
}
