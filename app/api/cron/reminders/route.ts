import { NextRequest, NextResponse } from 'next/server'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { prisma } from '@/lib/db/client'
import { sendBookingReminder } from '@/lib/email/templates'
import { formatDate } from '@/lib/utils'

const TIMEZONE = 'Europe/Madrid'

function getTomorrowWindow() {
  const nowMadrid = toZonedTime(new Date(), TIMEZONE)
  const startLocal = new Date(nowMadrid)
  startLocal.setDate(nowMadrid.getDate() + 1)
  startLocal.setHours(0, 0, 0, 0)

  const endLocal = new Date(startLocal)
  endLocal.setHours(23, 59, 59, 999)

  return {
    start: fromZonedTime(startLocal, TIMEZONE),
    end: fromZonedTime(endLocal, TIMEZONE),
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { start, end } = getTomorrowWindow()
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      reminderSentAt: null,
      startAt: { gte: start, lte: end },
    },
    include: {
      center: { select: { name: true, slug: true } },
      service: { select: { name: true } },
      staff: { select: { name: true } },
      customer: { select: { name: true, email: true } },
    },
    orderBy: { startAt: 'asc' },
    take: 200,
  })

  let sent = 0
  let failed = 0

  for (const booking of bookings) {
    try {
      await sendBookingReminder({
        to: booking.customer.email,
        customerName: booking.customer.name,
        serviceName: booking.service.name,
        centerName: booking.center.name,
        centerSlug: booking.center.slug,
        date: formatDate(booking.startAt, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: TIMEZONE,
        }),
        time: booking.startAt.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: TIMEZONE,
        }),
        staffName: booking.staff?.name ?? null,
      })

      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: new Date() },
      })
      sent += 1
    } catch (err) {
      failed += 1
      console.error('[cron/reminders] Failed to send reminder:', booking.id, err)
    }
  }

  return NextResponse.json({
    ok: true,
    window: { start: start.toISOString(), end: end.toISOString() },
    total: bookings.length,
    sent,
    failed,
  })
}
