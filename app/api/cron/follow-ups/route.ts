import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { sendFollowUpMessage } from '@/lib/email/templates'
import { isEmailConfigured } from '@/lib/email/client'

// Procesa los seguimientos/campañas programados por email cuya fecha ya venció.
// Reutiliza CRON_SECRET / RESEND_API_KEY / EMAIL_FROM (mismas vars que el resto de crons).
const BATCH_SIZE = 100

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({
      ok: true,
      emailConfigured: false,
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      skippedReason: 'RESEND_API_KEY no configurado',
    })
  }

  const due = await prisma.followUpMessage.findMany({
    where: {
      channel: 'EMAIL',
      status: { in: ['SCHEDULED', 'READY'] },
      scheduledFor: { lte: new Date() },
    },
    include: {
      customer: { select: { name: true, email: true, marketingConsent: true } },
      center: { select: { name: true } },
    },
    orderBy: { scheduledFor: 'asc' },
    take: BATCH_SIZE,
  })

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const message of due) {
    // GDPR: si es marketing y la clienta revocó el consentimiento tras programarse, no se envía.
    if (message.purpose === 'MARKETING' && !message.customer.marketingConsent) {
      await prisma.followUpMessage.update({
        where: { id: message.id },
        data: { status: 'CANCELLED' },
      })
      skipped += 1
      continue
    }

    if (!message.customer.email) {
      await prisma.followUpMessage.update({
        where: { id: message.id },
        data: { status: 'FAILED' },
      })
      failed += 1
      continue
    }

    try {
      await sendFollowUpMessage({
        to: message.customer.email,
        subject: message.subject,
        body: message.body,
        centerName: message.center.name,
        marketing: message.purpose === 'MARKETING',
      })

      await prisma.followUpMessage.update({
        where: { id: message.id },
        data: { status: 'SENT', sentAt: new Date() },
      })
      sent += 1
    } catch (err) {
      await prisma.followUpMessage.update({
        where: { id: message.id },
        data: { status: 'FAILED' },
      })
      failed += 1
      console.error('[cron/follow-ups] Failed to send message:', message.id, err)
    }
  }

  return NextResponse.json({
    ok: true,
    total: due.length,
    sent,
    failed,
    skipped,
  })
}
