import { prisma } from '@/lib/db/client'
import { addMinutes, format, parseISO, isAfter, startOfDay, endOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const TIMEZONE = 'Europe/Madrid'
const SLOT_GRANULARITY_MINUTES = 15

export interface TimeSlot {
  time: string      // "09:00" en hora local
  startAt: Date     // UTC
  endAt: Date       // UTC
  staffId: string
  available: boolean
}

export interface AvailabilityQuery {
  centerId: string
  serviceId: string
  staffId?: string
  date: string      // "YYYY-MM-DD"
}

export async function getAvailableSlots(query: AvailabilityQuery): Promise<TimeSlot[]> {
  const { centerId, serviceId, date } = query

  // 1. Cargar servicio
  const service = await prisma.service.findFirst({
    where: { id: serviceId, centerId, active: true },
  })
  if (!service) return []

  const totalDuration =
    service.bufferMinutesBefore + service.durationMinutes + service.bufferMinutesAfter

  // 2. Resolver staff elegible
  let staffIds: string[]
  if (query.staffId) {
    staffIds = [query.staffId]
  } else {
    const staffLinks = await prisma.serviceStaff.findMany({
      where: { serviceId },
      select: { staffId: true },
    })
    staffIds = staffLinks.map((s) => s.staffId)
  }

  if (staffIds.length === 0) return []

  // 3. Calcular slots para cada staff
  const localDate = parseISO(date) // date en zona local
  const dayOfWeek = localDate.getDay() === 0 ? 6 : localDate.getDay() - 1 // 0=lunes

  const allSlots: TimeSlot[] = []

  for (const staffId of staffIds) {
    const slots = await getSlotsForStaff({
      centerId,
      staffId,
      dayOfWeek,
      localDate,
      totalDuration,
      service,
    })
    allSlots.push(...slots)
  }

  // Deduplicar por time (si varios staff tienen el mismo slot, mostrar una vez)
  const seen = new Set<string>()
  return allSlots.filter((slot) => {
    if (seen.has(slot.time)) return false
    seen.add(slot.time)
    return true
  })
}

async function getSlotsForStaff({
  centerId,
  staffId,
  dayOfWeek,
  localDate,
  totalDuration,
  service,
}: {
  centerId: string
  staffId: string
  dayOfWeek: number
  localDate: Date
  totalDuration: number
  service: { bufferMinutesBefore: number; durationMinutes: number }
}): Promise<TimeSlot[]> {

  // a. Obtener horario del día
  const exception = await prisma.scheduleException.findFirst({
    where: {
      staffId,
      date: { gte: startOfDay(localDate), lte: endOfDay(localDate) },
    },
  })

  let openTime: string
  let closeTime: string

  if (exception) {
    if (exception.isClosed) return []
    openTime = exception.openTime!
    closeTime = exception.closeTime!
  } else {
    const rule = await prisma.scheduleRule.findFirst({
      where: { OR: [{ staffId }, { centerId }], dayOfWeek, active: true },
      orderBy: { staffId: 'desc' }, // priorizar regla de staff sobre centro
    })
    if (!rule) return []
    openTime = rule.openTime
    closeTime = rule.closeTime
  }

  // b. Convertir a UTC
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)

  const workStartLocal = new Date(localDate)
  workStartLocal.setHours(openH, openM, 0, 0)
  const workEndLocal = new Date(localDate)
  workEndLocal.setHours(closeH, closeM, 0, 0)

  const workStartUTC = fromZonedTime(workStartLocal, TIMEZONE)
  const workEndUTC = fromZonedTime(workEndLocal, TIMEZONE)

  // c. Obtener bloques ocupados
  const dayStart = fromZonedTime(startOfDay(localDate), TIMEZONE)
  const dayEnd = fromZonedTime(endOfDay(localDate), TIMEZONE)

  const existingBookings = await prisma.booking.findMany({
    where: {
      staffId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
    select: { startAt: true, endAt: true },
  })

  const manualBlocks = await prisma.manualBlock.findMany({
    where: {
      staffId,
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
    select: { startAt: true, endAt: true },
  })

  const occupiedBlocks: { start: Date; end: Date }[] = [
    ...existingBookings.map((b) => ({
      start: addMinutes(b.startAt, -service.bufferMinutesBefore),
      end: b.endAt,
    })),
    ...manualBlocks.map((b) => ({ start: b.startAt, end: b.endAt })),
  ]

  // d. Generar slots candidatos
  const now = new Date()
  const slots: TimeSlot[] = []
  let cursor = workStartUTC

  while (addMinutes(cursor, totalDuration) <= workEndUTC) {
    const slotStart = cursor
    const slotEnd = addMinutes(cursor, totalDuration)

    // No mostrar slots en el pasado
    if (isAfter(slotStart, now)) {
      const hasConflict = occupiedBlocks.some(
        (b) => slotStart < b.end && slotEnd > b.start
      )

      if (!hasConflict) {
        const localStart = toZonedTime(slotStart, TIMEZONE)
        slots.push({
          time: format(localStart, 'HH:mm'),
          startAt: slotStart,
          endAt: slotEnd,
          staffId,
          available: true,
        })
      }
    }

    cursor = addMinutes(cursor, SLOT_GRANULARITY_MINUTES)
  }

  return slots
}

export async function createBookingWithLock({
  centerId,
  serviceId,
  staffId,
  startAt,
  endAt,
  customerData,
}: {
  centerId: string
  serviceId: string
  staffId: string
  startAt: Date
  endAt: Date
  customerData: { name: string; email: string; phone?: string }
}) {
  return prisma.$transaction(async (tx) => {
    // Re-verificar disponibilidad dentro de la transacción
    const conflicts = await tx.booking.count({
      where: {
        staffId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
      },
    })

    if (conflicts > 0) {
      throw new Error('SLOT_TAKEN')
    }

    // Crear o actualizar cliente
    const customer = await tx.customer.upsert({
      where: { email_centerId: { email: customerData.email, centerId } },
      create: {
        centerId,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        consentGivenAt: new Date(),
      },
      update: { name: customerData.name, phone: customerData.phone },
    })

    // Generar código de confirmación
    const confirmationCode = generateConfirmationCode()

    // Crear reserva
    const booking = await tx.booking.create({
      data: {
        confirmationCode,
        centerId,
        serviceId,
        staffId,
        customerId: customer.id,
        startAt,
        endAt,
        status: 'CONFIRMED',
        source: 'WEB',
      },
    })

    return { booking, customer }
  })
}

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
