import { addMonths } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { prisma } from '@/lib/db/client'
import { getAvailableSlots } from '@/lib/availability/engine'

const TIMEZONE = 'Europe/Madrid'
const MAX_BOOKING_MONTHS = 6

export type BookingSlotErrorCode =
  | 'CENTER_UNAVAILABLE'
  | 'SERVICE_UNAVAILABLE'
  | 'STAFF_UNAVAILABLE'
  | 'INVALID_START'
  | 'OUTSIDE_BOOKING_WINDOW'
  | 'SLOT_UNAVAILABLE'

export class BookingSlotError extends Error {
  constructor(public readonly code: BookingSlotErrorCode) {
    super(code)
    this.name = 'BookingSlotError'
  }
}

export async function resolveBookableSlot(input: {
  centerId: string
  serviceId: string
  staffId?: string | null
  startAt: string | Date
  excludeBookingId?: string
}) {
  const requestedStart = input.startAt instanceof Date ? input.startAt : new Date(input.startAt)
  if (Number.isNaN(requestedStart.getTime()) || requestedStart <= new Date()) {
    throw new BookingSlotError('INVALID_START')
  }
  if (requestedStart > addMonths(new Date(), MAX_BOOKING_MONTHS)) {
    throw new BookingSlotError('OUTSIDE_BOOKING_WINDOW')
  }

  const service = await prisma.service.findFirst({
    where: {
      id: input.serviceId,
      centerId: input.centerId,
      active: true,
      center: { published: true },
    },
    include: {
      center: true,
    },
  })
  if (!service) throw new BookingSlotError('SERVICE_UNAVAILABLE')
  if (!service.center.published) throw new BookingSlotError('CENTER_UNAVAILABLE')

  if (input.staffId) {
    const link = await prisma.serviceStaff.findFirst({
      where: {
        serviceId: service.id,
        staffId: input.staffId,
        staff: { centerId: input.centerId, active: true },
      },
      select: { staffId: true },
    })
    if (!link) throw new BookingSlotError('STAFF_UNAVAILABLE')
  }

  const date = formatInTimeZone(requestedStart, TIMEZONE, 'yyyy-MM-dd')
  const slots = await getAvailableSlots({
    centerId: input.centerId,
    serviceId: input.serviceId,
    ...(input.staffId ? { staffId: input.staffId } : {}),
    date,
    excludeBookingId: input.excludeBookingId,
  })

  const slot = slots.find(candidate => (
    candidate.startAt.getTime() === requestedStart.getTime()
    && (!input.staffId || candidate.staffId === input.staffId)
  ))
  if (!slot) throw new BookingSlotError('SLOT_UNAVAILABLE')

  const staff = await prisma.staff.findFirst({
    where: { id: slot.staffId, centerId: input.centerId, active: true },
  })
  if (!staff) throw new BookingSlotError('STAFF_UNAVAILABLE')

  return {
    center: service.center,
    service,
    staff,
    staffId: staff.id,
    startAt: slot.startAt,
    endAt: slot.endAt,
  }
}

export function bookingSlotErrorMessage(error: unknown): string {
  if (!(error instanceof BookingSlotError)) return 'El horario seleccionado no está disponible.'
  switch (error.code) {
    case 'CENTER_UNAVAILABLE':
      return 'El centro no está disponible para reservas.'
    case 'SERVICE_UNAVAILABLE':
      return 'El servicio ya no está disponible.'
    case 'STAFF_UNAVAILABLE':
      return 'El profesional no está disponible para este servicio.'
    case 'INVALID_START':
      return 'La fecha seleccionada debe ser futura.'
    case 'OUTSIDE_BOOKING_WINDOW':
      return 'La fecha está fuera de la ventana de reserva permitida.'
    case 'SLOT_UNAVAILABLE':
      return 'Ese horario ya no está disponible. Selecciona otro.'
  }
}

export function isBookingOverlapError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: string; meta?: { database_error?: string }; message?: string }
  return candidate.code === '23P01'
    || candidate.meta?.database_error?.includes('23P01') === true
    || candidate.message?.includes('Booking_no_overlap_active') === true
}
