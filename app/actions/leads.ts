'use server'

import { prisma } from '@/lib/db/client'
import { notifyBusinessLead } from '@/lib/integrations/n8n'
import { nanoid } from 'nanoid'
import { z } from 'zod'

export type LeadFormState = {
  success?: boolean
  message?: string
  error?: string
}

const leadSchema = z.object({
  businessName: z.string().trim().min(2, 'Indica el nombre del negocio.').max(120),
  contactName: z.string().trim().max(120).optional(),
  email: z.string().trim().email('Indica un email valido.').max(180),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  plan: z.string().trim().max(60).optional(),
  message: z.string().trim().max(1200).optional(),
  consentAccepted: z.literal('on', {
    errorMap: () => ({ message: 'Debes aceptar la politica de privacidad.' }),
  }),
})

function emptyToNull(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function submitBusinessLead(
  _prevState: LeadFormState | null,
  formData: FormData
): Promise<LeadFormState> {
  const parsed = leadSchema.safeParse({
    businessName: formData.get('businessName'),
    contactName: formData.get('contactName') ?? undefined,
    email: formData.get('email'),
    phone: formData.get('phone') ?? undefined,
    city: formData.get('city') ?? undefined,
    plan: formData.get('plan') ?? undefined,
    message: formData.get('message') ?? undefined,
    consentAccepted: formData.get('consentAccepted'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? 'Revisa los datos del formulario.',
    }
  }

  const data = parsed.data

  try {
    const leadId = nanoid(24)
    const normalized = {
      businessName: data.businessName,
      contactName: emptyToNull(data.contactName),
      email: data.email.toLowerCase(),
      phone: emptyToNull(data.phone),
      city: emptyToNull(data.city),
      plan: emptyToNull(data.plan),
      message: emptyToNull(data.message),
      source: 'para-negocios',
      consentGivenAt: new Date().toISOString(),
    }

    await prisma.$executeRaw`
      INSERT INTO "Lead" (
        "id",
        "businessName",
        "contactName",
        "email",
        "phone",
        "city",
        "plan",
        "message",
        "source",
        "consentGivenAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${leadId},
        ${normalized.businessName},
        ${normalized.contactName},
        ${normalized.email},
        ${normalized.phone},
        ${normalized.city},
        ${normalized.plan},
        ${normalized.message},
        ${normalized.source},
        NOW(),
        NOW(),
        NOW()
      )
    `

    await notifyBusinessLead({
      id: leadId,
      ...normalized,
    })

    return {
      success: true,
      message: 'Solicitud recibida. Revisaremos tu caso y te contactaremos con el siguiente paso.',
    }
  } catch (error) {
    console.error('[lead] Error creating B2B lead:', error)
    return {
      success: false,
      error: 'No hemos podido guardar la solicitud. Intentalo de nuevo en unos minutos.',
    }
  }
}
