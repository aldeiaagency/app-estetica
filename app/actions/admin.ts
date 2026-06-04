'use server'

import { prisma } from '@/lib/db/client'
import { revalidatePath } from 'next/cache'
import type { Plan } from '@prisma/client'

const VALID_PLANS: Plan[] = ['BASIC', 'PRO', 'GROWTH', 'PREMIUM']

export async function publishCenterAction(
  centerId: string,
  actorId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction([
      prisma.center.update({
        where: { id: centerId },
        data: { published: true, approvedAt: new Date() },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorId,
          action: 'PUBLISH_CENTER',
          targetType: 'Center',
          targetId: centerId,
        },
      }),
    ])
    revalidatePath('/admin/centros')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function unpublishCenterAction(
  centerId: string,
  actorId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction([
      prisma.center.update({
        where: { id: centerId },
        data: { published: false, approvedAt: null },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorId,
          action: 'UNPUBLISH_CENTER',
          targetType: 'Center',
          targetId: centerId,
        },
      }),
    ])
    revalidatePath('/admin/centros')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function updateOrganizationPlanAction(
  orgId: string,
  plan: string,
  actorId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_PLANS.includes(plan as Plan)) {
    return { success: false, error: `Plan inválido: ${plan}` }
  }
  try {
    await prisma.$transaction([
      prisma.organization.update({
        where: { id: orgId },
        data: { plan: plan as Plan },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorId,
          action: 'CHANGE_PLAN',
          targetType: 'Organization',
          targetId: orgId,
          metadata: { plan },
        },
      }),
    ])
    revalidatePath('/admin/organizaciones')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function toggleCenterSeoNoindexAction(
  centerId: string,
  seoNoindex: boolean,
  actorId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction([
      prisma.center.update({
        where: { id: centerId },
        data: { seoNoindex },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorId,
          action: seoNoindex ? 'SET_NOINDEX' : 'REMOVE_NOINDEX',
          targetType: 'Center',
          targetId: centerId,
        },
      }),
    ])
    revalidatePath('/admin/seo')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function toggleAddOnAction(
  orgId: string,
  addOnType: string,
  active: boolean,
  actorId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date()

    if (active) {
      const existing = await prisma.organizationAddOn.findFirst({
        where: { organizationId: orgId, addOnType: addOnType as never },
        select: { id: true },
      })

      if (existing) {
        await prisma.organizationAddOn.update({
          where: { id: existing.id },
          data: { active: true, activeFrom: now, activeTo: null },
        })
      } else {
        await prisma.organizationAddOn.create({
          data: {
            organizationId: orgId,
            addOnType: addOnType as never,
            active: true,
            activeFrom: now,
          },
        })
      }
    } else {
      await prisma.organizationAddOn.updateMany({
        where: { organizationId: orgId, addOnType: addOnType as never },
        data: { active: false, activeTo: now },
      })
    }

    await prisma.adminAuditLog.create({
      data: {
        actorId,
        action: active ? 'ENABLE_ADDON' : 'DISABLE_ADDON',
        targetType: 'OrganizationAddOn',
        targetId: orgId,
        metadata: { addOnType },
      },
    })

    revalidatePath('/admin/organizaciones')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
