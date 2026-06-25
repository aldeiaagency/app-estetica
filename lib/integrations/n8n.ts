import { getPublicAppUrl } from '@/lib/config/app-url'

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

async function postWebhook(url: string, payload: unknown, label: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error(`[n8n] ${label} webhook failed:`, response.status, await response.text())
    }
  } catch (error) {
    console.error(`[n8n] ${label} webhook error:`, error)
  } finally {
    clearTimeout(timeout)
  }
}

export async function notifyBusinessLead(payload: BusinessLeadPayload) {
  const url = process.env.N8N_WEBHOOK_LEAD_B2B_URL
  if (!url) return

  await postWebhook(url, {
    event: 'lead.b2b.created',
    appUrl: getPublicAppUrl(),
    ...payload,
  }, 'lead-b2b')
}
