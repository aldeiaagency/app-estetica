import { getPublicAppUrl } from '@/lib/config/app-url'
import { createConfirmationToken } from '@/lib/security/confirmation-token'

const API_VERSION = process.env.WHATSAPP_API_VERSION ?? 'v21.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const TEMPLATE_NAME = process.env.WHATSAPP_REMINDER_TEMPLATE ?? 'belleza_local_booking_reminder'
const TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? 'es'

export function isWhatsAppConfigured() {
  return Boolean(PHONE_NUMBER_ID && ACCESS_TOKEN)
}

export function normalizeWhatsAppPhone(value: string | null | undefined) {
  const normalized = value?.replace(/[\s().-]/g, '')
  if (!normalized || !/^\+[1-9]\d{7,14}$/.test(normalized)) return null
  return normalized
}

type BookingReminderWhatsAppParams = {
  to: string
  customerName: string
  centerName: string
  date: string
  time: string
  confirmationCode: string
  customerEmail: string
}

export async function sendBookingReminderWhatsApp(params: BookingReminderWhatsAppParams) {
  if (!isWhatsAppConfigured()) throw new Error('WHATSAPP_NOT_CONFIGURED')
  const phone = normalizeWhatsAppPhone(params.to)
  if (!phone) throw new Error('WHATSAPP_INVALID_PHONE')

  const token = createConfirmationToken('booking', params.confirmationCode, params.customerEmail)
  const manageUrl = `${getPublicAppUrl()}/reserva/confirmada/${params.confirmationCode}?token=${encodeURIComponent(token)}`
  const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: TEMPLATE_NAME,
        language: { code: TEMPLATE_LANGUAGE },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: params.customerName },
            { type: 'text', text: params.centerName },
            { type: 'text', text: params.date },
            { type: 'text', text: params.time },
            { type: 'text', text: manageUrl },
          ],
        }],
      },
    }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`WHATSAPP_API_${response.status}:${(await response.text()).slice(0, 200)}`)
  const payload = await response.json() as { messages?: Array<{ id?: string }> }
  return { messageId: payload.messages?.[0]?.id ?? null }
}
