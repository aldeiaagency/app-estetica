import { NextRequest, NextResponse } from 'next/server'
import { expireOrderStockReservations } from '@/lib/billing/payment-integrity'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const released = await expireOrderStockReservations(200)
    return NextResponse.json({ ok: true, released, checkedAt: new Date().toISOString() })
  } catch (error) {
    console.error('[cron:order-reservations] failed', error)
    return NextResponse.json({ error: 'Stock reservation cleanup failed' }, { status: 500 })
  }
}
