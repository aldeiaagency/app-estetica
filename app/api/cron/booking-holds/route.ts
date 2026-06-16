import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { notifyWaitlistForBookingOpening } from '@/lib/waitlist/notifications'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = new Date()
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: 'PENDING',
      depositPaid: false,
      depositExpiresAt: { lt: now },
    },
    select: {
      id: true,
      centerId: true,
      serviceId: true,
      staffId: true,
      startAt: true,
    },
    take: 200,
  })

  if (expiredBookings.length === 0) {
    return NextResponse.json({ ok: true, expired: 0, cancelled: 0 })
  }

  const result = await prisma.booking.updateMany({
    where: {
      id: { in: expiredBookings.map(booking => booking.id) },
      status: 'PENDING',
      depositPaid: false,
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
      cancelledBy: 'SYSTEM',
      cancellationReason: 'Pago de senal no completado dentro del plazo.',
    },
  })

  await Promise.allSettled(
    expiredBookings.map(booking =>
      notifyWaitlistForBookingOpening({
        centerId: booking.centerId,
        serviceId: booking.serviceId,
        staffId: booking.staffId,
        startAt: booking.startAt,
      })
    )
  )

  return NextResponse.json({
    ok: true,
    expired: expiredBookings.length,
    cancelled: result.count,
  })
}
