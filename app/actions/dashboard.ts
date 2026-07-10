'use server'

import { Prisma } from '@prisma/client'
import type { BookingStatus, CenterCategory, OrderStatus, WaitlistStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { scheduleFollowUpsForCompletedBooking } from '@/app/actions/follow-ups'
import { requireOrganization } from '@/lib/auth/authorization'
import { PLAN_FEATURES } from '@/lib/billing/plans'
import { prisma } from '@/lib/db/client'
import { sendBookingCancellation, sendBookingConfirmation } from '@/lib/email/templates'
import { formatDate, formatTime, slugify } from '@/lib/utils'
import { notifyWaitlistEntry, notifyWaitlistForBookingOpening } from '@/lib/waitlist/notifications'

const VALID_ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'READY', 'COMPLETED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const VALID_BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']
const VALID_WAITLIST_STATUSES: WaitlistStatus[] = ['WAITING', 'NOTIFIED', 'BOOKED', 'EXPIRED']

async function getBusinessContext() {
  const context = await requireOrganization()
  return {
    ...context,
    features: PLAN_FEATURES[context.plan],
  }
}

async function getOwnedCenter(organizationId: string) {
  return prisma.center.findFirst({ where: { organizationId } })
}

function hasReachedLimit(current: number, limit: number) {
  return limit !== -1 && current >= limit
}

const optionalUrl = z.string().trim().url('URL inválida').optional().or(z.literal(''))

function cleanOptionalUrl(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed || null
}

function cleanUrlList(values?: string[]) {
  return (values ?? []).map(value => value.trim()).filter(Boolean).slice(0, 8)
}

function actionError(error: unknown, fallback: string) {
  console.error('[dashboard-action]', error)
  return { success: false as const, error: fallback }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_ORDER_STATUSES.includes(status)) return { success: false, error: 'Estado inválido' }
  try {
    const { organizationId } = await getBusinessContext()
    const order = await prisma.order.findFirst({
      where: { id: orderId, center: { organizationId } },
    })
    if (!order) return { success: false, error: 'Pedido no encontrado' }
    await prisma.order.update({ where: { id: order.id }, data: { status } })
    revalidatePath('/dashboard/pedidos')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al actualizar el estado')
  }
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus,
  _legacyOrganizationId?: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_BOOKING_STATUSES.includes(status)) return { success: false, error: 'Estado inválido' }
  try {
    const { organizationId } = await getBusinessContext()
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, center: { organizationId } },
      include: {
        center: { select: { name: true, slug: true } },
        customer: { select: { name: true, email: true } },
        service: { select: { name: true } },
        staff: { select: { name: true } },
      },
    })
    if (!booking) return { success: false, error: 'Reserva no encontrada' }

    await prisma.$transaction(async tx => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status,
          ...(status === 'CANCELLED' ? {
            cancelledAt: new Date(),
            cancelledBy: 'BUSINESS',
            cancellationReason: reason?.trim().slice(0, 500) || null,
          } : {}),
          ...(status === 'NO_SHOW' ? { noShowAt: new Date() } : {}),
        },
      })
      if (status === 'NO_SHOW' && booking.status !== 'NO_SHOW') {
        await tx.customer.update({ where: { id: booking.customerId }, data: { noShowCount: { increment: 1 } } })
      }
    })

    const emailParams = {
      to: booking.customer.email,
      customerName: booking.customer.name,
      serviceName: booking.service.name,
      centerName: booking.center.name,
      centerSlug: booking.center.slug,
      date: formatDate(booking.startAt, { day: 'numeric', month: 'long', year: 'numeric' }),
      time: formatTime(booking.startAt),
      staffName: booking.staff?.name ?? null,
    }

    if (status === 'CONFIRMED') {
      sendBookingConfirmation(emailParams).catch(() => undefined)
    } else if (status === 'CANCELLED') {
      sendBookingCancellation({ ...emailParams, reason }).catch(() => undefined)
      notifyWaitlistForBookingOpening({
        centerId: booking.centerId,
        serviceId: booking.serviceId,
        staffId: booking.staffId,
        startAt: booking.startAt,
      }).catch(() => undefined)
    } else if (status === 'COMPLETED' && booking.status !== 'COMPLETED') {
      scheduleFollowUpsForCompletedBooking(booking.id, organizationId).catch(() => undefined)
    }

    revalidatePath('/dashboard/reservas')
    if (status === 'COMPLETED') {
      revalidatePath('/dashboard/seguimientos')
      revalidatePath('/dashboard/recurrencia')
    }
    if (status === 'NO_SHOW') revalidatePath('/dashboard/clientes')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al actualizar el estado')
  }
}

export async function notifyWaitlistEntryAction(
  entryId: string,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await getBusinessContext()
    const result = await notifyWaitlistEntry(entryId, { orgId: organizationId })
    revalidatePath('/dashboard/reservas')
    return result
  } catch (error) {
    return actionError(error, 'Error al avisar al cliente')
  }
}

export async function updateWaitlistStatusAction(
  entryId: string,
  status: WaitlistStatus,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_WAITLIST_STATUSES.includes(status)) return { success: false, error: 'Estado inválido' }
  try {
    const { organizationId } = await getBusinessContext()
    const entry = await prisma.waitlistEntry.findFirst({
      where: { id: entryId, center: { organizationId } },
    })
    if (!entry) return { success: false, error: 'Solicitud no encontrada' }
    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        status,
        ...(status === 'NOTIFIED' ? { notifiedAt: new Date() } : {}),
        ...(status === 'WAITING' ? { notifiedAt: null } : {}),
      },
    })
    revalidatePath('/dashboard/reservas')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al actualizar la lista de espera')
  }
}

const serviceSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  description: z.string().trim().max(2000).optional(),
  durationMinutes: z.number().int().min(5).max(720),
  priceCents: z.number().int().min(0).max(10_000_000),
  depositRequired: z.boolean().optional(),
  depositCents: z.number().int().min(0).optional(),
  bufferMinutesBefore: z.number().int().min(0).max(240).optional(),
  bufferMinutesAfter: z.number().int().min(0).max(240).optional(),
})

function validateDeposit(data: z.infer<typeof serviceSchema>) {
  if (data.depositRequired && (!data.depositCents || data.depositCents <= 0)) return 'Introduce una señal mayor que 0'
  if (data.depositRequired && data.depositCents && data.depositCents > data.priceCents) return 'La señal no puede superar el precio del servicio'
  return null
}

export async function createServiceAction(
  data: z.input<typeof serviceSchema>,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string; serviceId?: string }> {
  const parsed = serviceSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  const depositError = validateDeposit(parsed.data)
  if (depositError) return { success: false, error: depositError }

  try {
    const { organizationId, features } = await getBusinessContext()
    const center = await prisma.center.findFirst({
      where: { organizationId },
      include: { _count: { select: { services: true } } },
    })
    if (!center) return { success: false, error: 'Centro no encontrado' }
    if (hasReachedLimit(center._count.services, features.maxServicesPerCenter)) {
      return { success: false, error: 'Has alcanzado el límite de servicios de tu plan.' }
    }
    const lastService = await prisma.service.findFirst({ where: { centerId: center.id }, orderBy: { order: 'desc' } })
    const service = await prisma.service.create({
      data: {
        centerId: center.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        durationMinutes: parsed.data.durationMinutes,
        priceCents: parsed.data.priceCents,
        depositRequired: parsed.data.depositRequired ?? false,
        depositCents: parsed.data.depositRequired ? parsed.data.depositCents ?? null : null,
        bufferMinutesBefore: parsed.data.bufferMinutesBefore ?? 0,
        bufferMinutesAfter: parsed.data.bufferMinutesAfter ?? 0,
        order: (lastService?.order ?? 0) + 1,
      },
    })
    revalidatePath('/dashboard/servicios')
    return { success: true, serviceId: service.id }
  } catch (error) {
    return actionError(error, 'Error al crear el servicio')
  }
}

const updateServiceSchema = serviceSchema.extend({ active: z.boolean().optional() })

export async function updateServiceAction(
  serviceId: string,
  data: z.input<typeof updateServiceSchema>,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = updateServiceSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  const depositError = validateDeposit(parsed.data)
  if (depositError) return { success: false, error: depositError }

  try {
    const { organizationId } = await getBusinessContext()
    const service = await prisma.service.findFirst({ where: { id: serviceId, center: { organizationId } } })
    if (!service) return { success: false, error: 'Servicio no encontrado' }
    await prisma.service.update({
      where: { id: service.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        durationMinutes: parsed.data.durationMinutes,
        priceCents: parsed.data.priceCents,
        depositRequired: parsed.data.depositRequired ?? false,
        depositCents: parsed.data.depositRequired ? parsed.data.depositCents ?? null : null,
        bufferMinutesBefore: parsed.data.bufferMinutesBefore ?? 0,
        bufferMinutesAfter: parsed.data.bufferMinutesAfter ?? 0,
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      },
    })
    revalidatePath('/dashboard/servicios')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al actualizar el servicio')
  }
}

export async function toggleServiceActiveAction(
  serviceId: string,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await getBusinessContext()
    const service = await prisma.service.findFirst({ where: { id: serviceId, center: { organizationId } } })
    if (!service) return { success: false, error: 'Servicio no encontrado' }
    await prisma.service.update({ where: { id: service.id }, data: { active: !service.active } })
    revalidatePath('/dashboard/servicios')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al actualizar el servicio')
  }
}

export async function createStaffAction(
  data: { name: string; role?: string; bio?: string; image?: string },
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string; staffId?: string }> {
  if (!data.name || data.name.trim().length < 2) return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
  const parsedImage = optionalUrl.safeParse(data.image ?? '')
  if (!parsedImage.success) return { success: false, error: parsedImage.error.errors[0]?.message ?? 'URL inválida' }

  try {
    const { organizationId, features } = await getBusinessContext()
    const center = await prisma.center.findFirst({
      where: { organizationId },
      include: { _count: { select: { staff: true } } },
    })
    if (!center) return { success: false, error: 'Centro no encontrado' }
    if (hasReachedLimit(center._count.staff, features.maxStaffPerCenter)) {
      return { success: false, error: 'Has alcanzado el límite de profesionales de tu plan.' }
    }
    const lastStaff = await prisma.staff.findFirst({ where: { centerId: center.id }, orderBy: { order: 'desc' } })
    const staff = await prisma.staff.create({
      data: {
        centerId: center.id,
        name: data.name.trim().slice(0, 120),
        role: data.role?.trim().slice(0, 120) || null,
        bio: data.bio?.trim().slice(0, 2000) || null,
        image: cleanOptionalUrl(parsedImage.data),
        order: (lastStaff?.order ?? 0) + 1,
      },
    })
    revalidatePath('/dashboard/staff')
    return { success: true, staffId: staff.id }
  } catch (error) {
    return actionError(error, 'Error al crear el profesional')
  }
}

export async function updateStaffAction(
  staffId: string,
  data: { name?: string; role?: string; bio?: string; image?: string },
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  const parsedImage = data.image === undefined ? null : optionalUrl.safeParse(data.image)
  if (parsedImage && !parsedImage.success) return { success: false, error: parsedImage.error.errors[0]?.message ?? 'URL inválida' }
  try {
    const { organizationId } = await getBusinessContext()
    const staff = await prisma.staff.findFirst({ where: { id: staffId, center: { organizationId } } })
    if (!staff) return { success: false, error: 'Profesional no encontrado' }
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        ...(data.name ? { name: data.name.trim().slice(0, 120) } : {}),
        ...(data.role !== undefined ? { role: data.role.trim().slice(0, 120) || null } : {}),
        ...(data.bio !== undefined ? { bio: data.bio.trim().slice(0, 2000) || null } : {}),
        ...(data.image !== undefined ? { image: cleanOptionalUrl(parsedImage?.data) } : {}),
      },
    })
    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al actualizar el profesional')
  }
}

export async function toggleStaffActiveAction(
  staffId: string,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await getBusinessContext()
    const staff = await prisma.staff.findFirst({ where: { id: staffId, center: { organizationId } } })
    if (!staff) return { success: false, error: 'Profesional no encontrado' }
    await prisma.staff.update({ where: { id: staff.id }, data: { active: !staff.active } })
    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al actualizar el profesional')
  }
}

const scheduleRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  active: z.boolean(),
}).refine(data => data.closeTime > data.openTime, { message: 'La hora de cierre debe ser posterior a la apertura' })

export async function upsertScheduleRuleAction(
  data: z.input<typeof scheduleRuleSchema>,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = scheduleRuleSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  try {
    const { organizationId } = await getBusinessContext()
    const center = await getOwnedCenter(organizationId)
    if (!center) return { success: false, error: 'Centro no encontrado' }
    const existing = await prisma.scheduleRule.findFirst({
      where: { centerId: center.id, dayOfWeek: parsed.data.dayOfWeek, staffId: null },
    })
    if (existing) {
      await prisma.scheduleRule.update({ where: { id: existing.id }, data: parsed.data })
    } else {
      await prisma.scheduleRule.create({ data: { ...parsed.data, centerId: center.id, staffId: null } })
    }
    revalidatePath('/dashboard/horarios')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al guardar el horario')
  }
}

const centerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional(),
  descriptionLong: z.string().trim().max(8000).optional(),
  category: z.string().min(1, 'Selecciona una categoría'),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  website: z.string().trim().max(500).optional(),
  coverImage: optionalUrl,
  galleryImages: z.array(z.string().url('URL de galería inválida')).max(8).optional(),
  addressStreet: z.string().trim().max(250).optional(),
  addressCity: z.string().trim().min(1, 'La ciudad es obligatoria').max(120),
  addressProvince: z.string().trim().min(1, 'La provincia es obligatoria').max(120),
  addressPostalCode: z.string().trim().max(15).optional(),
})

const bonoSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  sessions: z.number().int().min(1).max(1000),
  validityDays: z.number().int().min(1).max(3650),
  priceCents: z.number().int().min(0).max(10_000_000),
  serviceId: z.string().cuid().optional(),
})

export async function createBonoAction(
  data: z.input<typeof bonoSchema>,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string; bonoId?: string }> {
  const parsed = bonoSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  try {
    const { organizationId, features } = await getBusinessContext()
    const center = await getOwnedCenter(organizationId)
    if (!center) return { success: false, error: 'Centro no encontrado' }
    if (!features.hasBonos) return { success: false, error: 'Los bonos están disponibles a partir del plan Growth.' }
    if (parsed.data.serviceId) {
      const service = await prisma.service.findFirst({ where: { id: parsed.data.serviceId, centerId: center.id } })
      if (!service) return { success: false, error: 'Servicio no encontrado' }
    }
    const bono = await prisma.bono.create({
      data: {
        centerId: center.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        sessions: parsed.data.sessions,
        validityDays: parsed.data.validityDays,
        priceCents: parsed.data.priceCents,
        serviceId: parsed.data.serviceId || null,
      },
    })
    revalidatePath('/dashboard/bonos')
    return { success: true, bonoId: bono.id }
  } catch (error) {
    return actionError(error, 'Error al crear el bono')
  }
}

export async function toggleBonoActiveAction(
  bonoId: string,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId, features } = await getBusinessContext()
    const bono = await prisma.bono.findFirst({ where: { id: bonoId, center: { organizationId } } })
    if (!bono) return { success: false, error: 'Bono no encontrado' }
    if (!bono.active && !features.hasBonos) return { success: false, error: 'Los bonos están disponibles a partir del plan Growth.' }
    await prisma.bono.update({ where: { id: bono.id }, data: { active: !bono.active } })
    revalidatePath('/dashboard/bonos')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al actualizar el bono')
  }
}

const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(3000).optional(),
  brand: z.string().trim().max(160).optional(),
  image: optionalUrl,
  priceCents: z.number().int().min(0).max(10_000_000),
  stock: z.number().int().min(0).max(10_000_000).optional(),
  usageInstructions: z.string().trim().max(3000).optional(),
  recommendedFor: z.string().trim().max(3000).optional(),
  notRecommendedFor: z.string().trim().max(3000).optional(),
  expectedDurationDays: z.number().int().min(1).max(730).optional(),
  replenishmentIntervalDays: z.number().int().min(1).max(730).optional(),
  routineStepType: z.enum(['CLEANSER', 'TONER', 'SERUM', 'MOISTURIZER', 'SPF', 'MASK', 'HAIR_CARE', 'NAIL_CARE', 'BODY_CARE', 'MAKEUP', 'WELLNESS', 'OTHER']).optional(),
  compatibilityTags: z.array(z.string().trim().max(80)).max(50).optional(),
  recommendationTags: z.array(z.string().trim().max(80)).max(50).optional(),
})

export async function createProductAction(
  data: z.input<typeof productSchema>,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string; productId?: string }> {
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  try {
    const { organizationId, features } = await getBusinessContext()
    const center = await getOwnedCenter(organizationId)
    if (!center) return { success: false, error: 'Centro no encontrado' }
    if (!features.hasProducts) return { success: false, error: 'La venta de productos está disponible a partir del plan Growth.' }

    const product = await prisma.product.create({
      data: {
        centerId: center.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        brand: parsed.data.brand || null,
        image: cleanOptionalUrl(parsed.data.image),
        priceCents: parsed.data.priceCents,
        stock: parsed.data.stock ?? null,
      },
    })

    try {
      const compatibilityTags = parsed.data.compatibilityTags ?? []
      const recommendationTags = parsed.data.recommendationTags ?? []
      const routineStepTypeSql = parsed.data.routineStepType
        ? Prisma.sql`${parsed.data.routineStepType}::"BeautyRoutineStepType"`
        : Prisma.sql`NULL`
      const compatibilityTagsSql = compatibilityTags.length
        ? Prisma.sql`ARRAY[${Prisma.join(compatibilityTags)}]::text[]`
        : Prisma.sql`ARRAY[]::text[]`
      const recommendationTagsSql = recommendationTags.length
        ? Prisma.sql`ARRAY[${Prisma.join(recommendationTags)}]::text[]`
        : Prisma.sql`ARRAY[]::text[]`

      await prisma.$executeRaw`
        UPDATE "Product"
        SET
          "usageInstructions" = ${parsed.data.usageInstructions || null},
          "recommendedFor" = ${parsed.data.recommendedFor || null},
          "notRecommendedFor" = ${parsed.data.notRecommendedFor || null},
          "expectedDurationDays" = ${parsed.data.expectedDurationDays ?? null},
          "replenishmentIntervalDays" = ${parsed.data.replenishmentIntervalDays ?? null},
          "routineStepType" = ${routineStepTypeSql},
          "compatibilityTags" = ${compatibilityTagsSql},
          "recommendationTags" = ${recommendationTagsSql}
        WHERE "id" = ${product.id}
      `
    } catch (error) {
      console.warn('[dashboard] smart product fields unavailable', error)
    }

    revalidatePath('/dashboard/productos')
    revalidatePath('/productos')
    revalidatePath('/mi-plan')
    return { success: true, productId: product.id }
  } catch (error) {
    return actionError(error, 'Error al crear el producto')
  }
}

export async function toggleProductActiveAction(
  productId: string,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId, features } = await getBusinessContext()
    const product = await prisma.product.findFirst({ where: { id: productId, center: { organizationId } } })
    if (!product) return { success: false, error: 'Producto no encontrado' }
    if (!product.active && !features.hasProducts) return { success: false, error: 'La venta de productos está disponible a partir del plan Growth.' }
    await prisma.product.update({ where: { id: product.id }, data: { active: !product.active } })
    revalidatePath('/dashboard/productos')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al actualizar el producto')
  }
}

export async function upsertCenterAction(
  data: z.input<typeof centerSchema>,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = centerSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  try {
    const { organizationId } = await getBusinessContext()
    const existing = await getOwnedCenter(organizationId)
    const centerData = {
      name: parsed.data.name,
      description: parsed.data.description || null,
      descriptionLong: parsed.data.descriptionLong || null,
      category: parsed.data.category as CenterCategory,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email?.toLowerCase() || null,
      website: parsed.data.website || null,
      coverImage: cleanOptionalUrl(parsed.data.coverImage),
      galleryImages: cleanUrlList(parsed.data.galleryImages),
      addressStreet: parsed.data.addressStreet || '',
      addressCity: parsed.data.addressCity,
      addressProvince: parsed.data.addressProvince,
      addressPostalCode: parsed.data.addressPostalCode || '',
    }
    if (existing) {
      await prisma.center.update({ where: { id: existing.id }, data: centerData })
    } else {
      await prisma.center.create({
        data: {
          ...centerData,
          organizationId,
          slug: `${slugify(parsed.data.name)}-${organizationId.slice(-6)}`,
        },
      })
    }
    revalidatePath('/dashboard/configuracion')
    return { success: true }
  } catch (error) {
    return actionError(error, 'Error al guardar el centro')
  }
}
