import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAvailableSlots } from '@/lib/availability/engine'

export const dynamic = 'force-dynamic'

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
    const days: Array<{ date: string; count: number }> = []
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      const date = formatDate(day)
      const slots = await getAvailableSlots({ centerId, serviceId, staffId, date })
      days.push({ date, count: slots.length })
    }

    return NextResponse.json({ month, days }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[availability/month]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
