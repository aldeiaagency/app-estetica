import { prisma } from '@/lib/db/client'
import { addMinutes, endOfDay, format, parseISO, startOfDay } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import {
  buildCandidateSlots,
  computeTotalDuration,
  localDayOfWeekMondayZero,
  type Block,
} from './slots'

const TIMEZONE = 'Europe/Madrid'
const SLOT_GRANULARITY_MINUTES = 15

export interface TimeSlot {
  time: string
  startAt: Date
  endAt: Date
  staffId: string
  available: boolean
}

export interface AvailabilityQuery {
  centerId: string
  serviceId: string
  staffId?: string
  date: string
  excludeBookingId?: string
}

export async function getAvailableSlots(query: AvailabilityQuery): Promise<TimeSlot[]> {
  const { centerId, serviceId, date } = query
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      centerId,
      active: true,
      center: { published: true },
    },
  })
  if (!service) return []

  const staffLinks = await prisma.serviceStaff.findMany({
    where: {
      serviceId,
      ...(query.staffId ? { staffId: query.staffId } : {}),
      staff: { centerId, active: true },
    },
    select: { staffId: true },
  })
  const staffIds = staffLinks.map(link => link.staffId)
  if (staffIds.length === 0) return []

  const localDate = parseISO(date)
  if (Number.isNaN(localDate.getTime())) return []
  const dayOfWeek = localDayOfWeekMondayZero(localDate)
  const totalDuration = computeTotalDuration(service)
  const allSlots: TimeSlot[] = []

  for (const staffId of staffIds) {
    allSlots.push(...await getSlotsForStaff({
      centerId,
      staffId,
      dayOfWeek,
      localDate,
      totalDuration,
      service,
      excludeBookingId: query.excludeBookingId,
    }))
  }

  // Keep one staff assignment per displayed time. The selected slot still contains
  // the concrete staffId so creation never stores an unassigned booking.
  const seen = new Set<string>()
  return allSlots.filter(slot => {
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
  excludeBookingId,
}: {
  centerId: string
  staffId: string
  dayOfWeek: number
  localDate: Date
  totalDuration: number
  service: { bufferMinutesBefore: number; durationMinutes: number }
  excludeBookingId?: string
}): Promise<TimeSlot[]> {
  const localDayStart = startOfDay(localDate)
  const localDayEnd = endOfDay(localDate)

  const exception = await prisma.scheduleException.findFirst({
    where: {
      date: { gte: localDayStart, lte: localDayEnd },
      OR: [
        { staffId },
        { centerId, staffId: null },
      ],
    },
    orderBy: { staffId: 'desc' },
  })

  let openTime: string
  let closeTime: string

  if (exception) {
    if (exception.isClosed || !exception.openTime || !exception.closeTime) return []
    openTime = exception.openTime
    closeTime = exception.closeTime
  } else {
    const rule = await prisma.scheduleRule.findFirst({
      where: {
        dayOfWeek,
        active: true,
        OR: [
          { staffId },
          { centerId, staffId: null },
        ],
      },
      orderBy: { staffId: 'desc' },
    })
    if (!rule) return []
    openTime = rule.openTime
    closeTime = rule.closeTime
  }

  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)
  if (![openH, openM, closeH, closeM].every(Number.isFinite)) return []

  const workStartLocal = new Date(localDate)
  workStartLocal.setHours(openH, openM, 0, 0)
  const workEndLocal = new Date(localDate)
  workEndLocal.setHours(closeH, closeM, 0, 0)
  const workStartUTC = fromZonedTime(workStartLocal, TIMEZONE)
  const workEndUTC = fromZonedTime(workEndLocal, TIMEZONE)

  const dayStartUTC = fromZonedTime(localDayStart, TIMEZONE)
  const dayEndUTC = fromZonedTime(localDayEnd, TIMEZONE)
  const now = new Date()

  const existingBookings = await prisma.booking.findMany({
    where: {
      staffId,
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      OR: [
        { status: 'CONFIRMED' },
        {
          status: 'PENDING',
          OR: [
            { depositExpiresAt: null },
            { depositExpiresAt: { gt: now } },
          ],
        },
      ],
      startAt: { lt: dayEndUTC },
      endAt: { gt: dayStartUTC },
    },
    select: { startAt: true, endAt: true },
  })

  const manualBlocks = await prisma.manualBlock.findMany({
    where: {
      OR: [
        { staffId },
        { centerId, staffId: null },
      ],
      startAt: { lt: dayEndUTC },
      endAt: { gt: dayStartUTC },
    },
    select: { startAt: true, endAt: true },
  })

  const occupiedBlocks: Block[] = [
    ...existingBookings.map(booking => ({
      start: addMinutes(booking.startAt, -service.bufferMinutesBefore),
      end: booking.endAt,
    })),
    ...manualBlocks.map(block => ({ start: block.startAt, end: block.endAt })),
  ]

  const candidates = buildCandidateSlots({
    workStartUTC,
    workEndUTC,
    totalDuration,
    granularityMinutes: SLOT_GRANULARITY_MINUTES,
    now,
    occupiedBlocks,
  })

  return candidates.map(({ startAt, endAt }) => ({
    time: format(toZonedTime(startAt, TIMEZONE), 'HH:mm'),
    startAt,
    endAt,
    staffId,
    available: true,
  }))
}
