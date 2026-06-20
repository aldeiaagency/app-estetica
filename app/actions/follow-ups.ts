'use server'

import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

export type FollowUpTemplateCategory = 'GENERIC' | 'MANICURE' | 'FACIAL' | 'COLORATION' | 'BROWS_LASHES' | 'WELLNESS'
export type CommunicationPurpose = 'TRANSACTIONAL' | 'FOLLOW_UP' | 'MARKETING'
export type CommunicationChannel = 'EMAIL' | 'IN_APP'
export type FollowUpMessageStatus = 'SCHEDULED' | 'READY' | 'SENT' | 'DISMISSED' | 'CANCELLED' | 'FAILED'

export type FollowUpTemplateRecord = {
  id: string
  centerId: string
  name: string
  category: FollowUpTemplateCategory
  purpose: CommunicationPurpose
  channel: CommunicationChannel
  serviceKeyword: string | null
  subject: string
  body: string
  sendAfterDays: number
  consentRequired: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export type FollowUpMessageRecord = {
  id: string
  centerId: string
  customerId: string
  customerName: string
  customerEmail: string
  marketingConsent: boolean
  bookingId: string | null
  serviceName: string | null
  bookingStartAt: Date | null
  templateId: string | null
  channel: CommunicationChannel
  purpose: CommunicationPurpose
  status: FollowUpMessageStatus
  subject: string
  body: string
  scheduledFor: Date
  sentAt: Date | null
  dismissedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type RebookingOpportunityRecord = {
  customerId: string
  customerName: string
  customerEmail: string
  marketingConsent: boolean
  lastBookingId: string
  serviceName: string
  lastVisitAt: Date
  daysSince: number
  bookingCount: number
  hasScheduledFollowUp: boolean
}

const TEMPLATE_CATEGORIES = ['GENERIC', 'MANICURE', 'FACIAL', 'COLORATION', 'BROWS_LASHES', 'WELLNESS'] as const
const PURPOSES = ['FOLLOW_UP', 'MARKETING'] as const
const CHANNELS = ['EMAIL', 'IN_APP'] as const

const templateInputSchema = z.object({
  name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(120),
  category: z.enum(TEMPLATE_CATEGORIES).default('GENERIC'),
  purpose: z.enum(PURPOSES).default('FOLLOW_UP'),
  channel: z.enum(CHANNELS).default('EMAIL'),
  serviceKeyword: z.string().trim().max(60).optional(),
  subject: z.string().trim().min(3, 'El asunto es obligatorio').max(140),
  body: z.string().trim().min(10, 'El mensaje necesita algo mas de contexto').max(1200),
  sendAfterDays: z.number().int().min(0).max(365).default(14),
  consentRequired: z.boolean().optional(),
})

const campaignInputSchema = z.object({
  subject: z.string().trim().min(3, 'El asunto es obligatorio').max(140),
  body: z.string().trim().min(10, 'La campana necesita un mensaje').max(1200),
  scheduledFor: z.date().optional(),
  channel: z.enum(CHANNELS).default('EMAIL'),
})

function renderTemplate(value: string, data: { customerName: string; serviceName: string; centerName: string }) {
  return value
    .replaceAll('{customerName}', data.customerName)
    .replaceAll('{serviceName}', data.serviceName)
    .replaceAll('{centerName}', data.centerName)
}

function scheduledDateFrom(start: Date, days: number) {
  const candidate = new Date(start)
  candidate.setDate(candidate.getDate() + days)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return candidate > tomorrow ? candidate : tomorrow
}

async function getCenterForCurrentUser() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) return null

  const center = await prisma.center.findFirst({
    where: { organizationId: orgId },
    select: { id: true, name: true, slug: true, organizationId: true },
  })

  return center ? { ...center, orgId } : null
}

export async function ensureStarterFollowUpTemplatesForCenter(centerId: string) {
  try {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "FollowUpTemplate"
      WHERE "centerId" = ${centerId}
    `

    if (Number(rows[0]?.count ?? 0) > 0) return { success: true }

    await prisma.$executeRaw`
      INSERT INTO "FollowUpTemplate" (
        "id",
        "centerId",
        "name",
        "category",
        "purpose",
        "channel",
        "serviceKeyword",
        "subject",
        "body",
        "sendAfterDays",
        "consentRequired",
        "updatedAt"
      )
      VALUES
        (${nanoid()}, ${centerId}, 'Revision tras manicura', 'MANICURE'::"FollowUpTemplateCategory", 'FOLLOW_UP'::"CommunicationPurpose", 'EMAIL'::"CommunicationChannel", 'manic', 'Como va tu manicura, {customerName}?', 'Hola {customerName}, han pasado unos dias desde tu {serviceName}. Si notas que el color pierde brillo o quieres mantener la forma, podemos ayudarte a planificar la siguiente visita sin prisas. - {centerName}', 14, false, CURRENT_TIMESTAMP),
        (${nanoid()}, ${centerId}, 'Seguimiento facial calmado', 'FACIAL'::"FollowUpTemplateCategory", 'FOLLOW_UP'::"CommunicationPurpose", 'EMAIL'::"CommunicationChannel", 'facial', 'Seguimiento de tu tratamiento facial', 'Hola {customerName}, esperamos que tu piel se sienta bien tras {serviceName}. Si necesitas ajustar rutina o resolver dudas, podemos revisar contigo el siguiente paso recomendado. - {centerName}', 10, false, CURRENT_TIMESTAMP),
        (${nanoid()}, ${centerId}, 'Mantenimiento de coloracion', 'COLORATION'::"FollowUpTemplateCategory", 'FOLLOW_UP'::"CommunicationPurpose", 'EMAIL'::"CommunicationChannel", 'color', 'Mantenimiento de color sin improvisar', 'Hola {customerName}, para cuidar el resultado de {serviceName}, te recomendamos revisar brillo, raiz o matiz antes de que sea urgente. Podemos buscar el momento adecuado. - {centerName}', 28, false, CURRENT_TIMESTAMP),
        (${nanoid()}, ${centerId}, 'Revision general postservicio', 'GENERIC'::"FollowUpTemplateCategory", 'FOLLOW_UP'::"CommunicationPurpose", 'IN_APP'::"CommunicationChannel", NULL, 'Seguimiento de tu ultima visita', 'Hola {customerName}, gracias por confiar en {centerName}. Si quieres mantener el resultado de {serviceName}, te dejamos abierta una revision o proxima reserva cuando te encaje.', 21, false, CURRENT_TIMESTAMP)
    `

    return { success: true }
  } catch (error) {
    console.warn('[follow-ups] starter templates unavailable:', error)
    return { success: false, error: 'No pudimos preparar las plantillas iniciales.' }
  }
}

export async function ensureStarterFollowUpTemplatesAction() {
  const center = await getCenterForCurrentUser()
  if (!center) return { success: false, error: 'Centro no encontrado' }

  const result = await ensureStarterFollowUpTemplatesForCenter(center.id)
  revalidatePath('/dashboard/seguimientos')
  return result
}

export async function getFollowUpTemplatesForOrganization(orgId: string) {
  try {
    return await prisma.$queryRaw<FollowUpTemplateRecord[]>`
      SELECT
        t."id",
        t."centerId",
        t."name",
        t."category",
        t."purpose",
        t."channel",
        t."serviceKeyword",
        t."subject",
        t."body",
        t."sendAfterDays",
        t."consentRequired",
        t."active",
        t."createdAt",
        t."updatedAt"
      FROM "FollowUpTemplate" t
      JOIN "Center" c ON c."id" = t."centerId"
      WHERE c."organizationId" = ${orgId}
      ORDER BY t."active" DESC, t."category" ASC, t."createdAt" DESC
    `
  } catch {
    return []
  }
}

export async function getFollowUpMessagesForOrganization(orgId: string, limit = 80) {
  try {
    return await prisma.$queryRaw<FollowUpMessageRecord[]>`
      SELECT
        m."id",
        m."centerId",
        m."customerId",
        cst."name" AS "customerName",
        cst."email" AS "customerEmail",
        cst."marketingConsent",
        m."bookingId",
        s."name" AS "serviceName",
        b."startAt" AS "bookingStartAt",
        m."templateId",
        m."channel",
        m."purpose",
        m."status",
        m."subject",
        m."body",
        m."scheduledFor",
        m."sentAt",
        m."dismissedAt",
        m."createdAt",
        m."updatedAt"
      FROM "FollowUpMessage" m
      JOIN "Center" c ON c."id" = m."centerId"
      JOIN "Customer" cst ON cst."id" = m."customerId"
      LEFT JOIN "Booking" b ON b."id" = m."bookingId"
      LEFT JOIN "Service" s ON s."id" = b."serviceId"
      WHERE c."organizationId" = ${orgId}
      ORDER BY m."scheduledFor" ASC
      LIMIT ${limit}
    `
  } catch {
    return []
  }
}

export async function getRebookingOpportunities(orgId: string, limit = 24) {
  try {
    return await prisma.$queryRaw<RebookingOpportunityRecord[]>`
      SELECT *
      FROM (
        SELECT DISTINCT ON (cst."id")
          cst."id" AS "customerId",
          cst."name" AS "customerName",
          cst."email" AS "customerEmail",
          cst."marketingConsent",
          b."id" AS "lastBookingId",
          s."name" AS "serviceName",
          b."startAt" AS "lastVisitAt",
          FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - b."startAt")) / 86400)::int AS "daysSince",
          (
            SELECT COUNT(*)::int
            FROM "Booking" bx
            WHERE bx."customerId" = cst."id"
              AND bx."status" = 'COMPLETED'::"BookingStatus"
          ) AS "bookingCount",
          EXISTS (
            SELECT 1
            FROM "FollowUpMessage" m
            WHERE m."bookingId" = b."id"
              AND m."status" IN ('SCHEDULED'::"FollowUpMessageStatus", 'READY'::"FollowUpMessageStatus")
          ) AS "hasScheduledFollowUp"
        FROM "Booking" b
        JOIN "Center" c ON c."id" = b."centerId"
        JOIN "Customer" cst ON cst."id" = b."customerId"
        JOIN "Service" s ON s."id" = b."serviceId"
        WHERE c."organizationId" = ${orgId}
          AND b."status" = 'COMPLETED'::"BookingStatus"
          AND b."startAt" <= CURRENT_TIMESTAMP
          AND NOT EXISTS (
            SELECT 1
            FROM "Booking" future
            WHERE future."customerId" = cst."id"
              AND future."startAt" > CURRENT_TIMESTAMP
              AND future."status" IN ('PENDING'::"BookingStatus", 'CONFIRMED'::"BookingStatus")
          )
        ORDER BY cst."id", b."startAt" DESC
      ) latest
      ORDER BY "hasScheduledFollowUp" ASC, "daysSince" DESC
      LIMIT ${limit}
    `
  } catch {
    return []
  }
}

export async function createFollowUpTemplateAction(input: unknown): Promise<{ success: boolean; error?: string }> {
  const center = await getCenterForCurrentUser()
  if (!center) return { success: false, error: 'Centro no encontrado' }

  const parsed = templateInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Revisa la plantilla' }
  }

  const data = parsed.data
  const consentRequired = data.purpose === 'MARKETING' ? true : data.consentRequired ?? false

  try {
    await prisma.$executeRaw`
      INSERT INTO "FollowUpTemplate" (
        "id",
        "centerId",
        "name",
        "category",
        "purpose",
        "channel",
        "serviceKeyword",
        "subject",
        "body",
        "sendAfterDays",
        "consentRequired",
        "updatedAt"
      )
      VALUES (
        ${nanoid()},
        ${center.id},
        ${data.name},
        ${data.category}::"FollowUpTemplateCategory",
        ${data.purpose}::"CommunicationPurpose",
        ${data.channel}::"CommunicationChannel",
        ${data.serviceKeyword || null},
        ${data.subject},
        ${data.body},
        ${data.sendAfterDays},
        ${consentRequired},
        CURRENT_TIMESTAMP
      )
    `

    revalidatePath('/dashboard/seguimientos')
    revalidatePath('/dashboard/campanas')
    return { success: true }
  } catch (error) {
    console.error('[follow-ups] create template failed:', error)
    return { success: false, error: 'No pudimos crear la plantilla.' }
  }
}

export async function toggleFollowUpTemplateActiveAction(templateId: string): Promise<{ success: boolean; error?: string }> {
  const center = await getCenterForCurrentUser()
  if (!center) return { success: false, error: 'Centro no encontrado' }

  try {
    const rows = await prisma.$queryRaw<{ id: string; active: boolean }[]>`
      SELECT t."id", t."active"
      FROM "FollowUpTemplate" t
      WHERE t."id" = ${templateId} AND t."centerId" = ${center.id}
      LIMIT 1
    `

    const template = rows[0]
    if (!template) return { success: false, error: 'Plantilla no encontrada' }

    await prisma.$executeRaw`
      UPDATE "FollowUpTemplate"
      SET "active" = ${!template.active}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${templateId}
    `

    revalidatePath('/dashboard/seguimientos')
    revalidatePath('/dashboard/campanas')
    return { success: true }
  } catch (error) {
    console.error('[follow-ups] toggle template failed:', error)
    return { success: false, error: 'No pudimos actualizar la plantilla.' }
  }
}

export async function scheduleFollowUpsForCompletedBooking(bookingId: string, orgId?: string) {
  try {
    const bookings = await prisma.$queryRaw<{
      id: string
      centerId: string
      customerId: string
      endAt: Date
      serviceName: string
      customerName: string
      customerEmail: string
      marketingConsent: boolean
      centerName: string
      organizationId: string
    }[]>`
      SELECT
        b."id",
        b."centerId",
        b."customerId",
        b."endAt",
        s."name" AS "serviceName",
        cst."name" AS "customerName",
        cst."email" AS "customerEmail",
        cst."marketingConsent",
        c."name" AS "centerName",
        c."organizationId"
      FROM "Booking" b
      JOIN "Service" s ON s."id" = b."serviceId"
      JOIN "Customer" cst ON cst."id" = b."customerId"
      JOIN "Center" c ON c."id" = b."centerId"
      WHERE b."id" = ${bookingId}
        AND b."status" = 'COMPLETED'::"BookingStatus"
      LIMIT 1
    `

    const booking = bookings[0]
    if (!booking) return { success: false, error: 'Reserva completada no encontrada' }
    if (orgId && booking.organizationId !== orgId) return { success: false, error: 'Sin permisos' }

    await ensureStarterFollowUpTemplatesForCenter(booking.centerId)

    const templates = await prisma.$queryRaw<FollowUpTemplateRecord[]>`
      SELECT
        "id",
        "centerId",
        "name",
        "category",
        "purpose",
        "channel",
        "serviceKeyword",
        "subject",
        "body",
        "sendAfterDays",
        "consentRequired",
        "active",
        "createdAt",
        "updatedAt"
      FROM "FollowUpTemplate"
      WHERE "centerId" = ${booking.centerId}
        AND "active" = true
        AND "purpose" IN ('FOLLOW_UP'::"CommunicationPurpose", 'MARKETING'::"CommunicationPurpose")
        AND ("serviceKeyword" IS NULL OR LOWER(${booking.serviceName}) LIKE '%' || LOWER("serviceKeyword") || '%')
      ORDER BY ("serviceKeyword" IS NULL) ASC, "sendAfterDays" ASC
      LIMIT 1
    `

    const template = templates[0]
    if (!template) return { success: false, error: 'No hay plantilla activa para esta reserva' }

    if ((template.purpose === 'MARKETING' || template.consentRequired) && !booking.marketingConsent) {
      return { success: false, error: 'La clienta no tiene consentimiento para comunicaciones promocionales.' }
    }

    const renderData = {
      customerName: booking.customerName,
      serviceName: booking.serviceName,
      centerName: booking.centerName,
    }

    await prisma.$executeRaw`
      INSERT INTO "FollowUpMessage" (
        "id",
        "centerId",
        "customerId",
        "bookingId",
        "templateId",
        "channel",
        "purpose",
        "status",
        "subject",
        "body",
        "scheduledFor",
        "updatedAt"
      )
      VALUES (
        ${nanoid()},
        ${booking.centerId},
        ${booking.customerId},
        ${booking.id},
        ${template.id},
        ${template.channel}::"CommunicationChannel",
        ${template.purpose}::"CommunicationPurpose",
        'SCHEDULED'::"FollowUpMessageStatus",
        ${renderTemplate(template.subject, renderData)},
        ${renderTemplate(template.body, renderData)},
        ${scheduledDateFrom(booking.endAt, template.sendAfterDays)},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("bookingId", "templateId") DO NOTHING
    `

    revalidatePath('/dashboard/seguimientos')
    revalidatePath('/dashboard/recurrencia')
    return { success: true }
  } catch (error) {
    console.warn('[follow-ups] schedule after booking unavailable:', error)
    return { success: false, error: 'No pudimos programar el seguimiento.' }
  }
}

export async function scheduleFollowUpForBookingAction(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const center = await getCenterForCurrentUser()
  if (!center) return { success: false, error: 'Centro no encontrado' }

  return scheduleFollowUpsForCompletedBooking(bookingId, center.orgId)
}

export async function updateFollowUpMessageStatusAction(
  messageId: string,
  status: Extract<FollowUpMessageStatus, 'SENT' | 'DISMISSED' | 'CANCELLED' | 'READY'>
): Promise<{ success: boolean; error?: string }> {
  const center = await getCenterForCurrentUser()
  if (!center) return { success: false, error: 'Centro no encontrado' }

  try {
    const rows = await prisma.$queryRaw<{
      id: string
      purpose: CommunicationPurpose
      marketingConsent: boolean
    }[]>`
      SELECT m."id", m."purpose", cst."marketingConsent"
      FROM "FollowUpMessage" m
      JOIN "Customer" cst ON cst."id" = m."customerId"
      WHERE m."id" = ${messageId} AND m."centerId" = ${center.id}
      LIMIT 1
    `

    const message = rows[0]
    if (!message) return { success: false, error: 'Mensaje no encontrado' }
    if (message.purpose === 'MARKETING' && status === 'SENT' && !message.marketingConsent) {
      return { success: false, error: 'No se puede enviar marketing sin opt-in.' }
    }

    await prisma.$executeRaw`
      UPDATE "FollowUpMessage"
      SET
        "status" = ${status}::"FollowUpMessageStatus",
        "sentAt" = CASE WHEN ${status}::"FollowUpMessageStatus" = 'SENT'::"FollowUpMessageStatus" THEN CURRENT_TIMESTAMP ELSE "sentAt" END,
        "dismissedAt" = CASE WHEN ${status}::"FollowUpMessageStatus" IN ('DISMISSED'::"FollowUpMessageStatus", 'CANCELLED'::"FollowUpMessageStatus") THEN CURRENT_TIMESTAMP ELSE "dismissedAt" END,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${messageId}
    `

    revalidatePath('/dashboard/seguimientos')
    revalidatePath('/dashboard/campanas')
    revalidatePath('/dashboard/recurrencia')
    return { success: true }
  } catch (error) {
    console.error('[follow-ups] update message failed:', error)
    return { success: false, error: 'No pudimos actualizar el mensaje.' }
  }
}

export async function createMarketingCampaignAction(input: unknown): Promise<{ success: boolean; error?: string; scheduled?: number }> {
  const center = await getCenterForCurrentUser()
  if (!center) return { success: false, error: 'Centro no encontrado' }

  const parsed = campaignInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Revisa la campana' }
  }

  const data = parsed.data
  const scheduledFor = data.scheduledFor ?? new Date(Date.now() + 24 * 60 * 60 * 1000)

  try {
    const customers = await prisma.customer.findMany({
      where: { centerId: center.id, marketingConsent: true },
      select: { id: true, name: true },
      take: 250,
    })

    if (customers.length === 0) {
      return { success: false, error: 'No hay clientas con opt-in de marketing.' }
    }

    await prisma.$transaction(async (tx) => {
      for (const customer of customers) {
        await tx.$executeRaw`
          INSERT INTO "FollowUpMessage" (
            "id",
            "centerId",
            "customerId",
            "channel",
            "purpose",
            "status",
            "subject",
            "body",
            "scheduledFor",
            "updatedAt"
          )
          VALUES (
            ${nanoid()},
            ${center.id},
            ${customer.id},
            ${data.channel}::"CommunicationChannel",
            'MARKETING'::"CommunicationPurpose",
            'SCHEDULED'::"FollowUpMessageStatus",
            ${renderTemplate(data.subject, { customerName: customer.name, serviceName: 'tu ultima visita', centerName: center.name })},
            ${renderTemplate(data.body, { customerName: customer.name, serviceName: 'tu ultima visita', centerName: center.name })},
            ${scheduledFor},
            CURRENT_TIMESTAMP
          )
        `
      }
    })

    revalidatePath('/dashboard/campanas')
    revalidatePath('/dashboard/seguimientos')
    return { success: true, scheduled: customers.length }
  } catch (error) {
    console.error('[follow-ups] create campaign failed:', error)
    return { success: false, error: 'No pudimos crear la campana.' }
  }
}
