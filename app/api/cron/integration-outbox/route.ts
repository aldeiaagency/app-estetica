import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { postN8nWebhook } from '@/lib/integrations/n8n'

const BATCH_SIZE = 50

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const due = await prisma.integrationOutbox.findMany({
    where: {
      status: { in: ['PENDING', 'RETRY'] },
      availableAt: { lte: new Date() },
      OR: [{ processingAt: null }, { processingAt: { lt: new Date(Date.now() - 15 * 60 * 1000) } }],
    },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  })

  let delivered = 0
  let failed = 0
  for (const event of due) {
    const claim = await prisma.integrationOutbox.updateMany({
      where: {
        id: event.id,
        status: { in: ['PENDING', 'RETRY'] },
        OR: [{ processingAt: null }, { processingAt: { lt: new Date(Date.now() - 15 * 60 * 1000) } }],
      },
      data: { status: 'PROCESSING', processingAt: new Date(), attempts: { increment: 1 } },
    })
    if (claim.count !== 1) continue

    try {
      const url = event.destination === 'N8N_LEAD_B2B' ? process.env.N8N_WEBHOOK_LEAD_B2B_URL : undefined
      if (!url) throw new Error(`Webhook destination ${event.destination} is not configured`)
      await postN8nWebhook(url, event.payload, event.id)
      await prisma.integrationOutbox.update({
        where: { id: event.id },
        data: { status: 'DELIVERED', deliveredAt: new Date(), processingAt: null, lastError: null },
      })
      delivered += 1
    } catch (error) {
      const attempts = event.attempts + 1
      const terminal = attempts >= 10
      await prisma.integrationOutbox.update({
        where: { id: event.id },
        data: {
          status: terminal ? 'FAILED' : 'RETRY',
          processingAt: null,
          availableAt: new Date(Date.now() + Math.min(3600, 2 ** attempts * 30) * 1000),
          lastError: error instanceof Error ? error.message.slice(0, 500) : 'Delivery failed',
        },
      })
      failed += 1
    }
  }

  return NextResponse.json({ ok: true, total: due.length, delivered, failed })
}
