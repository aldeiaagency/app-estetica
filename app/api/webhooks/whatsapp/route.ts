import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { normalizeWhatsAppPhone } from '@/lib/notifications/whatsapp'

export const runtime = 'nodejs'

function signatureMatches(rawBody: string, signature: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret || !signature?.startsWith('sha256=')) return false
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`)
  const received = Buffer.from(signature)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Verificación inválida' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  if (!signatureMatches(rawBody, request.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as {
    entry?: Array<{ changes?: Array<{ value?: {
      messages?: Array<{ id?: string; from?: string; text?: { body?: string } }>
      statuses?: Array<{ id?: string; status?: string; errors?: Array<{ code?: string }> }>
    } }> }>
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value
      for (const status of value?.statuses ?? []) {
        if (!status.id) continue
        const mapped = status.status === 'delivered'
          ? 'DELIVERED'
          : status.status === 'read'
            ? 'READ'
            : status.status === 'failed'
              ? 'FAILED'
              : 'SENT'
        await prisma.whatsAppDelivery.updateMany({
          where: { providerMessageId: status.id },
          data: { status: mapped, errorCode: status.errors?.[0]?.code ?? null },
        })
      }

      for (const message of value?.messages ?? []) {
        const phone = normalizeWhatsAppPhone(message.from)
        if (!phone) continue
        const customers = await prisma.customer.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true } })
        const matched = customers.find(customer => normalizeWhatsAppPhone(customer.phone) === phone)
        if (!matched) continue
        const body = message.text?.body?.trim().toLowerCase() ?? ''
        const optedOut = ['baja', 'stop', 'parar', 'cancelar'].includes(body)
        await prisma.customer.update({
          where: { id: matched.id },
          data: optedOut ? { whatsappConsent: false, whatsappOptedOutAt: new Date() } : {},
        })
        if (message.id) {
          await prisma.whatsAppDelivery.upsert({
            where: { providerMessageId: message.id },
            create: { providerMessageId: message.id, customerId: matched.id, status: optedOut ? 'OPTED_OUT' : 'RECEIVED' },
            update: { status: optedOut ? 'OPTED_OUT' : 'RECEIVED' },
          })
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
