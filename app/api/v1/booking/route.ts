import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  code: z.string().length(8),
  email: z.string().email(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = querySchema.safeParse({
    code: searchParams.get('code') ?? '',
    email: searchParams.get('email') ?? '',
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const { code, email } = parsed.data

  const booking = await prisma.booking.findFirst({
    where: {
      confirmationCode: code.toUpperCase(),
      customer: { email: email.toLowerCase() },
    },
    include: {
      center: { select: { name: true, slug: true, addressCity: true } },
      service: { select: { name: true, durationMinutes: true, priceCents: true } },
      staff: { select: { name: true, role: true } },
      customer: { select: { name: true, email: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  const now = new Date()
  const hoursUntilStart = (booking.startAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  const isActive = !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)
  const canCancel = isActive && hoursUntilStart >= 24
  const cancelMessage = isActive && !canCancel
    ? `La cancelación solo es posible con al menos 24h de antelación. Tu cita es el ${booking.startAt.toLocaleDateString('es-ES')}.`
    : undefined

  return NextResponse.json({
    id: booking.id,
    confirmationCode: booking.confirmationCode,
    status: booking.status,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    service: booking.service,
    staff: booking.staff,
    center: booking.center,
    customer: booking.customer,
    canCancel,
    cancelMessage,
  })
}
