'use server'

import type { AddOnType, Plan } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requirePlatformAdmin } from '@/lib/auth/authorization'
import { prisma } from '@/lib/db/client'

const idSchema = z.string().trim().min(1).max(191)
const planSchema = z.enum(['BASIC', 'PRO', 'GROWTH', 'PREMIUM'])
const addOnTypeSchema = z.enum([
  'WHATSAPP',
  'SMS',
  'AI_RECEPTIONIST',
  'REBOOKING',
  'FEATURED_LISTING',
  'CUSTOM_DOMAIN',
  'ADVANCED_ANALYTICS',
  'PRIORITY_SUPPORT',
  'DATA_MIGRATION',
  'ASSISTED_ONBOARDING',
])

function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) return error.errors[0]?.message ?? 'Datos invalidos'
  return error instanceof Error ? error.message : 'Error desconocido'
}

export async function publishCenterAction(
  centerId: string,
  _legacyActorId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requirePlatformAdmin()
    const parsedCenterId = idSchema.parse(centerId)

    await prisma.$transaction([
      prisma.center.update({
        where: { id: parsedCenterId },
        data: { published: true, approvedAt: new Date() },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: 'PUBLISH_CENTER',
          targetType: 'Center',
          targetId: parsedCenterId,
        },
      }),
    ])
    revalidatePath('/admin/centros')
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function unpublishCenterAction(
  centerId: string,
  _legacyActorId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requirePlatformAdmin()
    const parsedCenterId = idSchema.parse(centerId)

    await prisma.$transaction([
      prisma.center.update({
        where: { id: parsedCenterId },
        data: { published: false, approvedAt: null },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: 'UNPUBLISH_CENTER',
          targetType: 'Center',
          targetId: parsedCenterId,
        },
      }),
    ])
    revalidatePath('/admin/centros')
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function updateOrganizationPlanAction(
  orgId: string,
  plan: string,
  _legacyActorId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requirePlatformAdmin()
    const parsedOrgId = idSchema.parse(orgId)
    const parsedPlan = planSchema.parse(plan) as Plan

    await prisma.$transaction([
      prisma.organization.update({
        where: { id: parsedOrgId },
        data: { plan: parsedPlan },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: 'CHANGE_PLAN',
          targetType: 'Organization',
          targetId: parsedOrgId,
          metadata: { plan: parsedPlan },
        },
      }),
    ])
    revalidatePath('/admin/organizaciones')
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function toggleCenterSeoNoindexAction(
  centerId: string,
  seoNoindex: boolean,
  _legacyActorId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requirePlatformAdmin()
    const parsed = z.object({ centerId: idSchema, seoNoindex: z.boolean() }).parse({ centerId, seoNoindex })

    await prisma.$transaction([
      prisma.center.update({
        where: { id: parsed.centerId },
        data: { seoNoindex: parsed.seoNoindex },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: parsed.seoNoindex ? 'SET_NOINDEX' : 'REMOVE_NOINDEX',
          targetType: 'Center',
          targetId: parsed.centerId,
        },
      }),
    ])
    revalidatePath('/admin/seo')
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function toggleAddOnAction(
  orgId: string,
  addOnType: string,
  active: boolean,
  _legacyActorId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requirePlatformAdmin()
    const parsed = z.object({
      orgId: idSchema,
      addOnType: addOnTypeSchema,
      active: z.boolean(),
    }).parse({ orgId, addOnType, active })
    const now = new Date()

    await prisma.$transaction(async tx => {
      if (parsed.active) {
        const existing = await tx.organizationAddOn.findFirst({
          where: { organizationId: parsed.orgId, addOnType: parsed.addOnType as AddOnType },
          select: { id: true },
        })

        if (existing) {
          await tx.organizationAddOn.update({
            where: { id: existing.id },
            data: { active: true, activeFrom: now, activeTo: null },
          })
        } else {
          await tx.organizationAddOn.create({
            data: {
              organizationId: parsed.orgId,
              addOnType: parsed.addOnType as AddOnType,
              active: true,
              activeFrom: now,
            },
          })
        }
      } else {
        await tx.organizationAddOn.updateMany({
          where: { organizationId: parsed.orgId, addOnType: parsed.addOnType as AddOnType },
          data: { active: false, activeTo: now },
        })
      }

      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: parsed.active ? 'ENABLE_ADDON' : 'DISABLE_ADDON',
          targetType: 'OrganizationAddOn',
          targetId: parsed.orgId,
          metadata: { addOnType: parsed.addOnType },
        },
      })
    })

    revalidatePath('/admin/organizaciones')
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessage(error) }
  }
}
