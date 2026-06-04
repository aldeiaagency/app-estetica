import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAvailableSlots } from '@/lib/availability/engine'

const querySchema = z.object({
  centerId: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const parsed = querySchema.safeParse({
    centerId: searchParams.get('centerId'),
    serviceId: searchParams.get('serviceId'),
    staffId: searchParams.get('staffId') ?? undefined,
    date: searchParams.get('date'),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parámetros inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const slots = await getAvailableSlots(parsed.data)
    return NextResponse.json({ slots }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[availability]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
