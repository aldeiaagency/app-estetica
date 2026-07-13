import { getPublicAppUrl } from '@/lib/config/app-url'
import { createHmac } from 'node:crypto'

type BusinessLeadPayload = {
  id: string
  businessName: string
  contactName: string | null
  email: string
  phone: string | null
  city: string | null
  plan: string | null
  message: string | null
  source: string
  consentGivenAt: string
}

export async function postN8nWebhook(url: string, payload: unknown, eventId: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const body = JSON.stringify(payload)
    const timestamp = String(Date.now())
    const signingSecret = process.env.N8N_WEBHOOK_SIGNING_SECRET
    if (!signingSecret) throw new Error('N8N_WEBHOOK_SIGNING_SECRET is not configured')
    const signature = createHmac('sha256', signingSecret).update(`${timestamp}.${body}`).digest('hex')
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-belleza-event-id': eventId,
        'x-belleza-timestamp': timestamp,
        'x-belleza-signature': `sha256=${signature}`,
      },
      body,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`n8n responded ${response.status}: ${(await response.text()).slice(0, 200)}`)
    }
  } catch (error) {
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export function businessLeadEvent(payload: BusinessLeadPayload) {
  return {
    event: 'lead.b2b.created',
    appUrl: getPublicAppUrl(),
    ...payload,
  }
}
