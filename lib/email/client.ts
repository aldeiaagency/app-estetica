import { Resend } from 'resend'

let _resend: Resend | null = null

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }

  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return (getResend() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Belleza Local <noreply@bellezalocal.es>'

export async function sendTransactionalEmail(params: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  if (!isEmailConfigured()) {
    console.log('[email] RESEND_API_KEY no configurado; email omitido:', params.subject, params.to)
    return { sent: false, skipped: true }
  }

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })

  return { sent: true, skipped: false }
}
