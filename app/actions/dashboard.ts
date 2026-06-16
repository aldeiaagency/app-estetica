'use server'

import { prisma } from '@/lib/db/client'
import { slugify, formatDate, formatTime } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendBookingConfirmation, sendBookingCancellation } from '@/lib/email/templates'
import { PLAN_FEATURES } from '@/lib/billing/plans'
import { notifyWaitlistEntry, notifyWaitlistForBookingOpening } from '@/lib/waitlist/notifications'
import type { BookingStatus, CenterCategory, OrderStatus, WaitlistStatus } from '@prisma/client'

const VALID_ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'READY', 'COMPLETED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const VALID_WAITLIST_STATUSES: WaitlistStatus[] = ['WAITING', 'NOTIFIED', 'BOOKED', 'EXPIRED']

async function getOrganizationFeatures(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  })

  return org ? PLAN_FEATURES[org.plan] : null
}

function hasReachedLimit(current: number, limit: number) {
  return limit !== -1 && current >= limit
}

const optionalUrl = z.string().url('URL invalida').optional().or(z.literal(''))

function cleanOptionalUrl(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function cleanUrlList(values?: string[]) {
  return (values ?? [])
    .map(value => value.trim())
    .filter(Boolean)
    .slice(0, 8)
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_ORDER_STATUSES.includes(status)) {
    return { success: false, error: 'Estado inválido' }
  }
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { center: { select: { organizationId: true } } },
    })
    if (!order) return { success: false, error: 'Pedido no encontrado' }
    if (order.center.organizationId !== orgId) return { success: false, error: 'Sin permisos' }

    await prisma.order.update({ where: { id: orderId }, data: { status } })
    revalidatePath('/dashboard/pedidos')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar el estado' }
  }
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus,
  orgId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId },
      include: {
        center:   { select: { organizationId: true, name: true, slug: true } },
        customer: { select: { name: true, email: true } },
        service:  { select: { name: true } },
        staff:    { select: { name: true } },
      },
    })

    if (!booking) return { success: false, error: 'Reserva no encontrada' }
    if (booking.center.organizationId !== orgId) return { success: false, error: 'Sin permisos' }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status,
          ...(status === 'CANCELLED'
            ? {
                cancelledAt: new Date(),
                cancelledBy: 'BUSINESS',
                ...(reason ? { cancellationReason: reason } : {}),
              }
            : {}),
          ...(status === 'NO_SHOW' ? { noShowAt: new Date() } : {}),
        },
      })

      if (status === 'NO_SHOW' && booking.status !== 'NO_SHOW') {
        await tx.customer.update({
          where: { id: booking.customerId },
          data: { noShowCount: { increment: 1 } },
        })
      }
    })

    // Send email — fire and forget (do not block the action)
    const emailParams = {
      to:          booking.customer.email,
      customerName: booking.customer.name,
      serviceName: booking.service.name,
      centerName:  booking.center.name,
      centerSlug:  booking.center.slug,
      date:        formatDate(booking.startAt, { day: 'numeric', month: 'long', year: 'numeric' }),
      time:        formatTime(booking.startAt),
      staffName:   booking.staff?.name ?? null,
    }

    if (status === 'CONFIRMED') {
      sendBookingConfirmation(emailParams).catch(() => {})
    } else if (status === 'CANCELLED') {
      sendBookingCancellation({ ...emailParams, reason }).catch(() => {})
      notifyWaitlistForBookingOpening({
        centerId: booking.centerId,
        serviceId: booking.serviceId,
        staffId: booking.staffId,
        startAt: booking.startAt,
      }).catch(() => {})
    }

    revalidatePath('/dashboard/reservas')
    if (status === 'NO_SHOW') revalidatePath('/dashboard/clientes')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar el estado' }
  }
}

export async function notifyWaitlistEntryAction(
  entryId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await notifyWaitlistEntry(entryId, { orgId })
    revalidatePath('/dashboard/reservas')
    return result
  } catch {
    return { success: false, error: 'Error al avisar al cliente' }
  }
}

export async function updateWaitlistStatusAction(
  entryId: string,
  status: WaitlistStatus,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_WAITLIST_STATUSES.includes(status)) {
    return { success: false, error: 'Estado invalido' }
  }

  try {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: entryId },
      include: { center: { select: { organizationId: true } } },
    })

    if (!entry) return { success: false, error: 'Solicitud no encontrada' }
    if (entry.center.organizationId !== orgId) return { success: false, error: 'Sin permisos' }

    await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status,
        ...(status === 'NOTIFIED' ? { notifiedAt: new Date() } : {}),
        ...(status === 'WAITING' ? { notifiedAt: null } : {}),
      },
    })

    revalidatePath('/dashboard/reservas')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar la lista de espera' }
  }
}

const serviceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive('La duración debe ser mayor que 0'),
  priceCents: z.number().int().min(0, 'El precio no puede ser negativo'),
  bufferMinutesBefore: z.number().int().min(0).optional(),
  bufferMinutesAfter: z.number().int().min(0).optional(),
})

export async function createServiceAction(
  data: {
    name: string
    description?: string
    durationMinutes: number
    priceCents: number
    bufferMinutesBefore?: number
    bufferMinutesAfter?: number
  },
  orgId: string
): Promise<{ success: boolean; error?: string; serviceId?: string }> {
  const parsed = serviceSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const [features, center] = await Promise.all([
      getOrganizationFeatures(orgId),
      prisma.center.findFirst({
        where: { organizationId: orgId },
        include: { _count: { select: { services: true } } },
      }),
    ])
    if (!features) return { success: false, error: 'Organizacion no encontrada' }
    if (!center) return { success: false, error: 'Centro no encontrado' }
    if (hasReachedLimit(center._count.services, features.maxServicesPerCenter)) {
      return { success: false, error: 'Has alcanzado el limite de servicios de tu plan. Actualiza tu plan para anadir mas.' }
    }

    const lastService = await prisma.service.findFirst({
      where: { centerId: center.id },
      orderBy: { order: 'desc' },
    })

    const service = await prisma.service.create({
      data: {
        centerId: center.id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        durationMinutes: parsed.data.durationMinutes,
        priceCents: parsed.data.priceCents,
        bufferMinutesBefore: parsed.data.bufferMinutesBefore ?? 0,
        bufferMinutesAfter: parsed.data.bufferMinutesAfter ?? 0,
        order: (lastService?.order ?? 0) + 1,
      },
    })

    revalidatePath('/dashboard/servicios')
    return { success: true, serviceId: service.id }
  } catch {
    return { success: false, error: 'Error al crear el servicio' }
  }
}

const updateServiceSchema = serviceSchema.extend({
  active: z.boolean().optional(),
})

export async function updateServiceAction(
  serviceId: string,
  data: {
    name: string
    description?: string
    durationMinutes: number
    priceCents: number
    bufferMinutesBefore?: number
    bufferMinutesAfter?: number
    active?: boolean
  },
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = updateServiceSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const service = await prisma.service.findFirst({
      where: { id: serviceId },
      include: { center: true },
    })

    if (!service) return { success: false, error: 'Servicio no encontrado' }
    if (service.center.organizationId !== orgId) return { success: false, error: 'Sin permisos' }

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        durationMinutes: parsed.data.durationMinutes,
        priceCents: parsed.data.priceCents,
        bufferMinutesBefore: parsed.data.bufferMinutesBefore ?? 0,
        bufferMinutesAfter: parsed.data.bufferMinutesAfter ?? 0,
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      },
    })

    revalidatePath('/dashboard/servicios')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar el servicio' }
  }
}

export async function toggleServiceActiveAction(
  serviceId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const service = await prisma.service.findFirst({
      where: { id: serviceId },
      include: { center: true },
    })

    if (!service) return { success: false, error: 'Servicio no encontrado' }
    if (service.center.organizationId !== orgId) return { success: false, error: 'Sin permisos' }

    await prisma.service.update({
      where: { id: serviceId },
      data: { active: !service.active },
    })

    revalidatePath('/dashboard/servicios')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar el servicio' }
  }
}

export async function createStaffAction(
  data: { name: string; role?: string; bio?: string; image?: string },
  orgId: string
): Promise<{ success: boolean; error?: string; staffId?: string }> {
  if (!data.name || data.name.trim().length < 2) {
    return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
  }
  const parsedImage = optionalUrl.safeParse(data.image ?? '')
  if (!parsedImage.success) {
    return { success: false, error: parsedImage.error.errors[0]?.message ?? 'URL invalida' }
  }

  try {
    const [features, center] = await Promise.all([
      getOrganizationFeatures(orgId),
      prisma.center.findFirst({
        where: { organizationId: orgId },
        include: { _count: { select: { staff: true } } },
      }),
    ])
    if (!features) return { success: false, error: 'Organizacion no encontrada' }
    if (!center) return { success: false, error: 'Centro no encontrado' }
    if (hasReachedLimit(center._count.staff, features.maxStaffPerCenter)) {
      return { success: false, error: 'Has alcanzado el limite de profesionales de tu plan. Actualiza tu plan para anadir mas.' }
    }

    const lastStaff = await prisma.staff.findFirst({
      where: { centerId: center.id },
      orderBy: { order: 'desc' },
    })

    const staff = await prisma.staff.create({
      data: {
        centerId: center.id,
        name: data.name.trim(),
        role: data.role?.trim() ?? null,
        bio: data.bio?.trim() ?? null,
        image: cleanOptionalUrl(parsedImage.data),
        order: (lastStaff?.order ?? 0) + 1,
      },
    })

    revalidatePath('/dashboard/staff')
    return { success: true, staffId: staff.id }
  } catch {
    return { success: false, error: 'Error al crear el profesional' }
  }
}

export async function updateStaffAction(
  staffId: string,
  data: { name?: string; role?: string; bio?: string; image?: string },
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  const parsedImage = data.image === undefined ? null : optionalUrl.safeParse(data.image)
  if (parsedImage && !parsedImage.success) {
    return { success: false, error: parsedImage.error.errors[0]?.message ?? 'URL invalida' }
  }

  try {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId },
      include: { center: true },
    })

    if (!staff) return { success: false, error: 'Profesional no encontrado' }
    if (staff.center.organizationId !== orgId) return { success: false, error: 'Sin permisos' }

    await prisma.staff.update({
      where: { id: staffId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.role !== undefined ? { role: data.role?.trim() ?? null } : {}),
        ...(data.bio !== undefined ? { bio: data.bio?.trim() ?? null } : {}),
        ...(data.image !== undefined ? { image: cleanOptionalUrl(parsedImage?.data) } : {}),
      },
    })

    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar el profesional' }
  }
}

export async function toggleStaffActiveAction(
  staffId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId },
      include: { center: true },
    })

    if (!staff) return { success: false, error: 'Profesional no encontrado' }
    if (staff.center.organizationId !== orgId) return { success: false, error: 'Sin permisos' }

    await prisma.staff.update({
      where: { id: staffId },
      data: { active: !staff.active },
    })

    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar el profesional' }
  }
}

const scheduleRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  active: z.boolean(),
})

export async function upsertScheduleRuleAction(
  data: { dayOfWeek: number; openTime: string; closeTime: string; active: boolean },
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = scheduleRuleSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
    if (!center) return { success: false, error: 'Centro no encontrado' }

    const existing = await prisma.scheduleRule.findFirst({
      where: { centerId: center.id, dayOfWeek: parsed.data.dayOfWeek, staffId: null },
    })

    if (existing) {
      await prisma.scheduleRule.update({
        where: { id: existing.id },
        data: {
          openTime: parsed.data.openTime,
          closeTime: parsed.data.closeTime,
          active: parsed.data.active,
        },
      })
    } else {
      await prisma.scheduleRule.create({
        data: {
          centerId: center.id,
          staffId: null,
          dayOfWeek: parsed.data.dayOfWeek,
          openTime: parsed.data.openTime,
          closeTime: parsed.data.closeTime,
          active: parsed.data.active,
        },
      })
    }

    revalidatePath('/dashboard/horarios')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al guardar el horario' }
  }
}

const centerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  descriptionLong: z.string().optional(),
  category: z.string().min(1, 'Selecciona una categoría'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().optional(),
  coverImage: optionalUrl,
  galleryImages: z.array(z.string().url('URL de galeria invalida')).max(8).optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().min(1, 'La ciudad es obligatoria'),
  addressProvince: z.string().min(1, 'La provincia es obligatoria'),
  addressPostalCode: z.string().optional(),
})

// ─────────────────────────────────────────────────────
// BONOS
// ─────────────────────────────────────────────────────

const bonoSchema = z.object({
  name:          z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description:   z.string().optional(),
  sessions:      z.number().int().positive('Debe tener al menos 1 sesión'),
  validityDays:  z.number().int().positive('Debe tener al menos 1 día de validez'),
  priceCents:    z.number().int().min(0, 'El precio no puede ser negativo'),
  serviceId:     z.string().optional(),
})

export async function createBonoAction(
  data: {
    name: string
    description?: string
    sessions: number
    validityDays: number
    priceCents: number
    serviceId?: string
  },
  orgId: string
): Promise<{ success: boolean; error?: string; bonoId?: string }> {
  const parsed = bonoSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }

  try {
    const [features, center] = await Promise.all([
      getOrganizationFeatures(orgId),
      prisma.center.findFirst({ where: { organizationId: orgId } }),
    ])
    if (!features) return { success: false, error: 'Organizacion no encontrada' }
    if (!center) return { success: false, error: 'Centro no encontrado' }
    if (!features.hasBonos) {
      return { success: false, error: 'Los bonos estan disponibles a partir del plan Pro.' }
    }

    const bono = await prisma.bono.create({
      data: {
        centerId:     center.id,
        name:         parsed.data.name,
        description:  parsed.data.description || null,
        sessions:     parsed.data.sessions,
        validityDays: parsed.data.validityDays,
        priceCents:   parsed.data.priceCents,
        serviceId:    parsed.data.serviceId || null,
      },
    })

    revalidatePath('/dashboard/bonos')
    return { success: true, bonoId: bono.id }
  } catch {
    return { success: false, error: 'Error al crear el bono' }
  }
}

export async function toggleBonoActiveAction(
  bonoId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const bono = await prisma.bono.findFirst({ where: { id: bonoId }, include: { center: true } })
    if (!bono) return { success: false, error: 'Bono no encontrado' }
    if (bono.center.organizationId !== orgId) return { success: false, error: 'Sin permisos' }
    if (!bono.active) {
      const features = await getOrganizationFeatures(orgId)
      if (!features?.hasBonos) return { success: false, error: 'Los bonos estan disponibles a partir del plan Pro.' }
    }

    await prisma.bono.update({ where: { id: bonoId }, data: { active: !bono.active } })
    revalidatePath('/dashboard/bonos')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar el bono' }
  }
}

// ─────────────────────────────────────────────────────
// PRODUCTOS
// ─────────────────────────────────────────────────────

const productSchema = z.object({
  name:        z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  brand:       z.string().optional(),
  image:       optionalUrl,
  priceCents:  z.number().int().min(0, 'El precio no puede ser negativo'),
  stock:       z.number().int().min(0).optional(),
})

export async function createProductAction(
  data: {
    name: string
    description?: string
    brand?: string
    image?: string
    priceCents: number
    stock?: number
  },
  orgId: string
): Promise<{ success: boolean; error?: string; productId?: string }> {
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }

  try {
    const [features, center] = await Promise.all([
      getOrganizationFeatures(orgId),
      prisma.center.findFirst({ where: { organizationId: orgId } }),
    ])
    if (!features) return { success: false, error: 'Organizacion no encontrada' }
    if (!center) return { success: false, error: 'Centro no encontrado' }
    if (!features.hasProducts) {
      return { success: false, error: 'La venta de productos esta disponible a partir del plan Pro.' }
    }

    const product = await prisma.product.create({
      data: {
        centerId:    center.id,
        name:        parsed.data.name,
        description: parsed.data.description || null,
        brand:       parsed.data.brand || null,
        image:       cleanOptionalUrl(parsed.data.image),
        priceCents:  parsed.data.priceCents,
        stock:       parsed.data.stock ?? null,
      },
    })

    revalidatePath('/dashboard/productos')
    return { success: true, productId: product.id }
  } catch {
    return { success: false, error: 'Error al crear el producto' }
  }
}

export async function toggleProductActiveAction(
  productId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const product = await prisma.product.findFirst({ where: { id: productId }, include: { center: true } })
    if (!product) return { success: false, error: 'Producto no encontrado' }
    if (product.center.organizationId !== orgId) return { success: false, error: 'Sin permisos' }
    if (!product.active) {
      const features = await getOrganizationFeatures(orgId)
      if (!features?.hasProducts) return { success: false, error: 'La venta de productos esta disponible a partir del plan Pro.' }
    }

    await prisma.product.update({ where: { id: productId }, data: { active: !product.active } })
    revalidatePath('/dashboard/productos')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar el producto' }
  }
}

export async function upsertCenterAction(
  data: {
    name: string
    description?: string
    descriptionLong?: string
    category: string
    phone?: string
    whatsapp?: string
    email?: string
    website?: string
    coverImage?: string
    galleryImages?: string[]
    addressStreet?: string
    addressCity: string
    addressProvince: string
    addressPostalCode?: string
  },
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = centerSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const existing = await prisma.center.findFirst({ where: { organizationId: orgId } })

    const centerData = {
      name: parsed.data.name,
      description: parsed.data.description || null,
      descriptionLong: parsed.data.descriptionLong || null,
      category: parsed.data.category as CenterCategory,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      coverImage: cleanOptionalUrl(parsed.data.coverImage),
      galleryImages: cleanUrlList(parsed.data.galleryImages),
      addressStreet: parsed.data.addressStreet || '',
      addressCity: parsed.data.addressCity,
      addressProvince: parsed.data.addressProvince,
      addressPostalCode: parsed.data.addressPostalCode || '',
    }

    if (existing) {
      await prisma.center.update({
        where: { id: existing.id },
        data: centerData,
      })
    } else {
      const slug = slugify(parsed.data.name) + '-' + orgId.slice(-6)
      await prisma.center.create({
        data: {
          ...centerData,
          organizationId: orgId,
          slug,
        },
      })
    }

    revalidatePath('/dashboard/configuracion')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al guardar el centro' }
  }
}
