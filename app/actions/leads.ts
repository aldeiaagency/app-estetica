'use server'

import { prisma } from '@/lib/db/client'
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
        ${nanoid(24)},
        ${data.businessName},
        ${emptyToNull(data.contactName)},
        ${data.email.toLowerCase()},
        ${emptyToNull(data.phone)},
        ${emptyToNull(data.city)},
        ${emptyToNull(data.plan)},
        ${emptyToNull(data.message)},
        ${'para-negocios'},
        NOW(),
        NOW(),
        NOW()
      )
    `

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
