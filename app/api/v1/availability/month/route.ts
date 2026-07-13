import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { addMinutes, endOfDay, format, startOfDay } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { buildCandidateSlots, computeTotalDuration, localDayOfWeekMondayZero, type Block } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

const TIMEZONE = 'Europe/Madrid'
const SLOT_GRANULARITY_MINUTES = 15

const querySchema = z.object({
  centerId: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de mes invalido (YYYY-MM)'),
})

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const parsed = querySchema.safeParse({
    centerId: searchParams.get('centerId'),
    serviceId: searchParams.get('serviceId'),
    staffId: searchParams.get('staffId') ?? undefined,
    month: searchParams.get('month'),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parametros invalidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { centerId, serviceId, staffId, month } = parsed.data
  const [year, monthIndexOneBased] = month.split('-').map(Number)
  const start = new Date(year, monthIndexOneBased - 1, 1)
  const end = new Date(year, monthIndexOneBased, 0)

  try {
    const dates: Array<{ date: string; localDate: Date }> = []
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      dates.push({ date: formatDate(day), localDate: new Date(day) })
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        centerId,
        active: true,
        center: { published: true },
      },
      select: {
        durationMinutes: true,
        bufferMinutesBefore: true,
        bufferMinutesAfter: true,
      },
    })

    if (!service) {
      return NextResponse.json({ month, days: dates.map(({ date }) => ({ date, count: 0 })) }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const staffLinks = await prisma.serviceStaff.findMany({
      where: {
        serviceId,
        ...(staffId ? { staffId } : {}),
        staff: { centerId, active: true },
      },
      select: { staffId: true },
    })
    const staffIds = staffLinks.map(link => link.staffId)

    if (staffIds.length === 0) {
      return NextResponse.json({ month, days: dates.map(({ date }) => ({ date, count: 0 })) }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const monthLocalStart = startOfDay(start)
    const monthLocalEnd = endOfDay(end)
    const monthStartUTC = fromZonedTime(monthLocalStart, TIMEZONE)
    const monthEndUTC = fromZonedTime(monthLocalEnd, TIMEZONE)
    const now = new Date()

    const [rules, exceptions, bookings, manualBlocks] = await prisma.$transaction([
      prisma.scheduleRule.findMany({
        where: {
          active: true,
          OR: [
            { staffId: { in: staffIds } },
            { centerId, staffId: null },
          ],
        },
        select: { centerId: true, staffId: true, dayOfWeek: true, openTime: true, closeTime: true },
      }),
      prisma.scheduleException.findMany({
        where: {
          date: { gte: monthLocalStart, lte: monthLocalEnd },
          OR: [
            { staffId: { in: staffIds } },
            { centerId, staffId: null },
          ],
        },
        select: { centerId: true, staffId: true, date: true, isClosed: true, openTime: true, closeTime: true },
      }),
      prisma.booking.findMany({
        where: {
          staffId: { in: staffIds },
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
          startAt: { lt: monthEndUTC },
          endAt: { gt: monthStartUTC },
        },
        select: { staffId: true, startAt: true, endAt: true },
      }),
      prisma.manualBlock.findMany({
        where: {
          OR: [
            { staffId: { in: staffIds } },
            { centerId, staffId: null },
          ],
          startAt: { lt: monthEndUTC },
          endAt: { gt: monthStartUTC },
        },
        select: { staffId: true, startAt: true, endAt: true },
      }),
    ])

    const totalDuration = computeTotalDuration(service)

    const days = dates.map(({ date, localDate }) => {
      const localDayStart = startOfDay(localDate)
      const localDayEnd = endOfDay(localDate)
      const dayStartUTC = fromZonedTime(localDayStart, TIMEZONE)
      const dayEndUTC = fromZonedTime(localDayEnd, TIMEZONE)
      const dayOfWeek = localDayOfWeekMondayZero(localDate)
      const times = new Set<string>()

      for (const currentStaffId of staffIds) {
        const exception = exceptions.find(item =>
          item.staffId === currentStaffId &&
          item.date >= localDayStart &&
          item.date <= localDayEnd
        ) ?? exceptions.find(item =>
          item.staffId === null &&
          item.centerId === centerId &&
          item.date >= localDayStart &&
          item.date <= localDayEnd
        )

        let openTime: string | null | undefined
        let closeTime: string | null | undefined

        if (exception) {
          if (exception.isClosed || !exception.openTime || !exception.closeTime) continue
          openTime = exception.openTime
          closeTime = exception.closeTime
        } else {
          const rule = rules.find(item => item.staffId === currentStaffId && item.dayOfWeek === dayOfWeek)
            ?? rules.find(item => item.staffId === null && item.centerId === centerId && item.dayOfWeek === dayOfWeek)
          if (!rule) continue
          openTime = rule.openTime
          closeTime = rule.closeTime
        }

        const [openH, openM] = openTime.split(':').map(Number)
        const [closeH, closeM] = closeTime.split(':').map(Number)
        if (![openH, openM, closeH, closeM].every(Number.isFinite)) continue

        const workStartLocal = new Date(localDate)
        workStartLocal.setHours(openH, openM, 0, 0)
        const workEndLocal = new Date(localDate)
        workEndLocal.setHours(closeH, closeM, 0, 0)
        const workStartUTC = fromZonedTime(workStartLocal, TIMEZONE)
        const workEndUTC = fromZonedTime(workEndLocal, TIMEZONE)

        const occupiedBlocks: Block[] = [
          ...bookings
            .filter(booking =>
              booking.staffId === currentStaffId &&
              booking.startAt < dayEndUTC &&
              booking.endAt > dayStartUTC
            )
            .map(booking => ({
              start: addMinutes(booking.startAt, -service.bufferMinutesBefore),
              end: booking.endAt,
            })),
          ...manualBlocks
            .filter(block =>
              (block.staffId === currentStaffId || block.staffId === null) &&
              block.startAt < dayEndUTC &&
              block.endAt > dayStartUTC
            )
            .map(block => ({ start: block.startAt, end: block.endAt })),
        ]

        const slots = buildCandidateSlots({
          workStartUTC,
          workEndUTC,
          totalDuration,
          granularityMinutes: SLOT_GRANULARITY_MINUTES,
          now,
          occupiedBlocks,
        })

        for (const slot of slots) {
          times.add(format(toZonedTime(slot.startAt, TIMEZONE), 'HH:mm'))
        }
      }

      return { date, count: times.size }
    })

    return NextResponse.json({ month, days }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[availability/month]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
