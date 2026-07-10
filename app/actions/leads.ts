'use server'

import { nanoid } from 'nanoid'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { notifyBusinessLead } from '@/lib/integrations/n8n'
import { enforceRateLimit, getRequestFingerprint } from '@/lib/security/rate-limit'

export type LeadFormState = {
  success?: boolean
  message?: string
  error?: string
}

const leadSchema = z.object({
  businessName: z.string().trim().min(2, 'Indica el nombre del negocio.').max(120),
  contactName: z.string().trim().max(120).optional(),
  email: z.string().trim().email('Indica un email válido.').max(180).transform(value => value.toLowerCase()),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  plan: z.string().trim().max(60).optional(),
  message: z.string().trim().max(1200).optional(),
  website: z.string().max(0).optional(),
  consentAccepted: z.literal('on', {
    errorMap: () => ({ message: 'Debes aceptar la política de privacidad.' }),
  }),
})

function emptyToNull(value?: string) {
  const trimmed = value?.trim()
  return trimmed || null
}

export async function submitBusinessLead(
  _previousState: LeadFormState | null,
  formData: FormData,
): Promise<LeadFormState> {
  const parsed = leadSchema.safeParse({
    businessName: formData.get('businessName'),
    contactName: formData.get('contactName') ?? undefined,
    email: formData.get('email'),
    phone: formData.get('phone') ?? undefined,
    city: formData.get('city') ?? undefined,
    plan: formData.get('plan') ?? undefined,
    message: formData.get('message') ?? undefined,
    website: formData.get('website') ?? undefined,
    consentAccepted: formData.get('consentAccepted'),
  })
  if (!parsed.success) {
    const honeypot = String(formData.get('website') ?? '')
    if (honeypot) return { success: true, message: 'Solicitud recibida.' }
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Revisa los datos del formulario.' }
  }

  const data = parsed.data
  try {
    await enforceRateLimit('lead', await getRequestFingerprint(data.email))
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return { success: false, error: 'Ya hemos recibido varias solicitudes. Espera antes de volver a intentarlo.' }
    }
  }

  try {
    const leadId = nanoid(24)
    const normalized = {
      businessName: data.businessName,
      contactName: emptyToNull(data.contactName),
      email: data.email,
      phone: emptyToNull(data.phone),
      city: emptyToNull(data.city),
      plan: emptyToNull(data.plan),
      message: emptyToNull(data.message),
      source: 'para-negocios',
      consentGivenAt: new Date().toISOString(),
    }

    await prisma.$executeRaw`
      INSERT INTO "Lead" (
        "id", "businessName", "contactName", "email", "phone", "city",
        "plan", "message", "source", "consentGivenAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${leadId}, ${normalized.businessName}, ${normalized.contactName}, ${normalized.email},
        ${normalized.phone}, ${normalized.city}, ${normalized.plan}, ${normalized.message},
        ${normalized.source}, NOW(), NOW(), NOW()
      )
    `

    await notifyBusinessLead({ id: leadId, ...normalized })
    return {
      success: true,
      message: 'Solicitud recibida. Revisaremos tu caso y te contactaremos con el siguiente paso.',
    }
  } catch (error) {
    console.error('[lead] creation failed', error)
    return { success: false, error: 'No hemos podido guardar la solicitud. Inténtalo de nuevo en unos minutos.' }
  }
}
