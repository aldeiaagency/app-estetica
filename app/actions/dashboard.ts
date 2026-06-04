'use server'

import { prisma } from '@/lib/db/client'
import { slugify } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { BookingStatus, CenterCategory } from '@prisma/client'

export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus,
  orgId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId },
      include: { center: true },
    })

    if (!booking) return { success: false, error: 'Reserva no encontrada' }
    if (booking.center.organizationId !== orgId) return { success: false, error: 'Sin permisos' }

    await prisma.booking.update({
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
      },
    })

    revalidatePath('/dashboard/reservas')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar el estado' }
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
    const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
    if (!center) return { success: false, error: 'Centro no encontrado' }

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
  data: { name: string; role?: string; bio?: string },
  orgId: string
): Promise<{ success: boolean; error?: string; staffId?: string }> {
  if (!data.name || data.name.trim().length < 2) {
    return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
  }

  try {
    const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
    if (!center) return { success: false, error: 'Centro no encontrado' }

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
  data: { name?: string; role?: string; bio?: string },
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
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.role !== undefined ? { role: data.role?.trim() ?? null } : {}),
        ...(data.bio !== undefined ? { bio: data.bio?.trim() ?? null } : {}),
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
  category: z.string().min(1, 'Selecciona una categoría'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().min(1, 'La ciudad es obligatoria'),
  addressProvince: z.string().min(1, 'La provincia es obligatoria'),
  addressPostalCode: z.string().optional(),
})

export async function upsertCenterAction(
  data: {
    name: string
    description?: string
    category: string
    phone?: string
    whatsapp?: string
    email?: string
    website?: string
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
      category: parsed.data.category as CenterCategory,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
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
