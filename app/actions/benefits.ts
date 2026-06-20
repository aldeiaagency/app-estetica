'use server'

import { nanoid } from 'nanoid'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { getBeautyProfile } from '@/app/actions/beauty-profile'

export type BeautyBenefitType =
  | 'DISCOUNT'
  | 'PRIORITY_BOOKING'
  | 'FREE_DIAGNOSIS'
  | 'GIFT'
  | 'MEMBER_ONLY_PACK'
  | 'FREE_REVIEW'
  | 'CASHBACK'
  | 'POINTS'

export type BeautyBenefitRecord = {
  id: string
  centerId: string | null
  centerName: string | null
  centerSlug: string | null
  title: string
  description: string | null
  benefitType: BeautyBenefitType
  value: string | null
  startsAt: Date | null
  endsAt: Date | null
  active: boolean
  membersOnly: boolean
  createdAt: Date
  userBenefitId: string | null
  userBenefitStatus: 'ACTIVE' | 'CLAIMED' | 'USED' | 'EXPIRED' | null
}

const benefitInputSchema = z.object({
  title: z.string().trim().min(3, 'El titulo debe tener al menos 3 caracteres').max(120),
  description: z.string().trim().max(280).optional(),
  benefitType: z.enum(['DISCOUNT', 'PRIORITY_BOOKING', 'FREE_DIAGNOSIS', 'GIFT', 'MEMBER_ONLY_PACK', 'FREE_REVIEW', 'CASHBACK', 'POINTS']),
  value: z.string().trim().max(40).optional(),
  membersOnly: z.boolean().optional(),
})

export type BenefitInput = z.infer<typeof benefitInputSchema>

export async function getAvailableBenefits(profileId?: string | null, limit = 12) {
  try {
    return await prisma.$queryRaw<BeautyBenefitRecord[]>`
      SELECT
        b."id",
        b."centerId",
        c."name" AS "centerName",
        c."slug" AS "centerSlug",
        b."title",
        b."description",
        b."benefitType",
        b."value",
        b."startsAt",
        b."endsAt",
        b."active",
        b."membersOnly",
        b."createdAt",
        ub."id" AS "userBenefitId",
        ub."status" AS "userBenefitStatus"
      FROM "BeautyBenefit" b
      LEFT JOIN "Center" c ON c."id" = b."centerId"
      LEFT JOIN "UserBenefit" ub ON ub."benefitId" = b."id" AND (${profileId ?? null}::text IS NOT NULL AND ub."profileId" = ${profileId ?? null})
      WHERE b."active" = true
        AND (b."startsAt" IS NULL OR b."startsAt" <= CURRENT_TIMESTAMP)
        AND (b."endsAt" IS NULL OR b."endsAt" >= CURRENT_TIMESTAMP)
      ORDER BY b."createdAt" DESC
      LIMIT ${limit}
    `
  } catch {
    return []
  }
}

export async function getBenefitsForCenterIds(centerIds: string[]) {
  if (centerIds.length === 0) return []
  try {
    return await prisma.$queryRaw<BeautyBenefitRecord[]>`
      SELECT
        b."id",
        b."centerId",
        c."name" AS "centerName",
        c."slug" AS "centerSlug",
        b."title",
        b."description",
        b."benefitType",
        b."value",
        b."startsAt",
        b."endsAt",
        b."active",
        b."membersOnly",
        b."createdAt",
        NULL AS "userBenefitId",
        NULL AS "userBenefitStatus"
      FROM "BeautyBenefit" b
      LEFT JOIN "Center" c ON c."id" = b."centerId"
      WHERE b."active" = true
        AND b."centerId" IN (${Prisma.join(centerIds)})
        AND (b."startsAt" IS NULL OR b."startsAt" <= CURRENT_TIMESTAMP)
        AND (b."endsAt" IS NULL OR b."endsAt" >= CURRENT_TIMESTAMP)
      ORDER BY b."createdAt" DESC
    `
  } catch {
    return []
  }
}

export async function getBenefitsForOrganization(orgId: string) {
  try {
    return await prisma.$queryRaw<BeautyBenefitRecord[]>`
      SELECT
        b."id",
        b."centerId",
        c."name" AS "centerName",
        c."slug" AS "centerSlug",
        b."title",
        b."description",
        b."benefitType",
        b."value",
        b."startsAt",
        b."endsAt",
        b."active",
        b."membersOnly",
        b."createdAt",
        NULL AS "userBenefitId",
        NULL AS "userBenefitStatus"
      FROM "BeautyBenefit" b
      JOIN "Center" c ON c."id" = b."centerId"
      WHERE c."organizationId" = ${orgId}
      ORDER BY b."createdAt" DESC
    `
  } catch {
    return []
  }
}

export async function createBeautyBenefitAction(input: unknown): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) return { success: false, error: 'Sin permisos' }

  const parsed = benefitInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  try {
    const center = await prisma.center.findFirst({ where: { organizationId: orgId }, select: { id: true, slug: true } })
    if (!center) return { success: false, error: 'Centro no encontrado' }

    await prisma.$executeRaw`
      INSERT INTO "BeautyBenefit" (
        "id",
        "centerId",
        "title",
        "description",
        "benefitType",
        "value",
        "membersOnly"
      )
      VALUES (
        ${nanoid()},
        ${center.id},
        ${parsed.data.title},
        ${parsed.data.description || null},
        ${parsed.data.benefitType}::"BeautyBenefitType",
        ${parsed.data.value || null},
        ${parsed.data.membersOnly ?? true}
      )
    `

    revalidatePath('/dashboard/beneficios')
    revalidatePath(`/centro/${center.slug}`)
    revalidatePath('/buscar')
    revalidatePath('/wallet')
    return { success: true }
  } catch (error) {
    console.error('[benefits] create failed:', error)
    return { success: false, error: 'No pudimos crear el beneficio.' }
  }
}

export async function toggleBeautyBenefitActiveAction(benefitId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) return { success: false, error: 'Sin permisos' }

  try {
    const rows = await prisma.$queryRaw<{ id: string; active: boolean; centerSlug: string }[]>`
      SELECT b."id", b."active", c."slug" AS "centerSlug"
      FROM "BeautyBenefit" b
      JOIN "Center" c ON c."id" = b."centerId"
      WHERE b."id" = ${benefitId} AND c."organizationId" = ${orgId}
      LIMIT 1
    `

    const benefit = rows[0]
    if (!benefit) return { success: false, error: 'Beneficio no encontrado' }

    await prisma.$executeRaw`
      UPDATE "BeautyBenefit"
      SET "active" = ${!benefit.active}
      WHERE "id" = ${benefitId}
    `

    revalidatePath('/dashboard/beneficios')
    revalidatePath(`/centro/${benefit.centerSlug}`)
    revalidatePath('/buscar')
    revalidatePath('/wallet')
    return { success: true }
  } catch (error) {
    console.error('[benefits] toggle failed:', error)
    return { success: false, error: 'No pudimos actualizar el beneficio.' }
  }
}

export async function ensureStarterBenefitsAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const countRows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "BeautyBenefit"
      WHERE "centerId" IS NULL
    `
    if (Number(countRows[0]?.count ?? 0) > 0) return { success: true }

    await prisma.$executeRaw`
      INSERT INTO "BeautyBenefit" ("id", "title", "description", "benefitType", "value", "membersOnly")
      VALUES
        (${nanoid()}, 'Asesoria de bienvenida', 'Beneficio inicial para completar tu Beauty Profile y empezar con recomendaciones claras.', 'FREE_DIAGNOSIS'::"BeautyBenefitType", 'Incluido', true),
        (${nanoid()}, 'Primera visita facial seleccionada', 'Busca centros con precio visible y usa este beneficio como señal de primera visita cuidada.', 'DISCOUNT'::"BeautyBenefitType", '10%', true),
        (${nanoid()}, 'Revision de plan mensual', 'Recordatorio para revisar tu plan antes de comprar productos nuevos.', 'FREE_REVIEW'::"BeautyBenefitType", 'Mensual', true)
    `
    return { success: true }
  } catch (error) {
    console.error('[benefits] seed starter benefits failed:', error)
    return { success: false, error: 'No pudimos preparar los beneficios iniciales.' }
  }
}

export async function claimBenefitAction(benefitId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { success: false, error: 'Inicia sesion para guardar beneficios.' }

  const profile = await getBeautyProfile(userId)
  if (!profile) return { success: false, error: 'Completa primero tu Beauty Profile.' }

  try {
    const benefits = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "BeautyBenefit"
      WHERE "id" = ${benefitId}
        AND "active" = true
        AND ("startsAt" IS NULL OR "startsAt" <= CURRENT_TIMESTAMP)
        AND ("endsAt" IS NULL OR "endsAt" >= CURRENT_TIMESTAMP)
      LIMIT 1
    `

    if (!benefits[0]) return { success: false, error: 'Beneficio no disponible.' }

    await prisma.$executeRaw`
      INSERT INTO "UserBenefit" ("id", "profileId", "benefitId", "status", "claimedAt")
      VALUES (${nanoid()}, ${profile.id}, ${benefitId}, 'CLAIMED'::"UserBenefitStatus", CURRENT_TIMESTAMP)
      ON CONFLICT ("profileId", "benefitId") DO UPDATE SET
        "status" = CASE
          WHEN "UserBenefit"."status" = 'USED' THEN "UserBenefit"."status"
          ELSE 'CLAIMED'::"UserBenefitStatus"
        END,
        "claimedAt" = COALESCE("UserBenefit"."claimedAt", CURRENT_TIMESTAMP)
    `

    revalidatePath('/wallet')
    revalidatePath('/mi-plan')
    return { success: true }
  } catch (error) {
    console.error('[benefits] claim failed:', error)
    return { success: false, error: 'No pudimos guardar el beneficio.' }
  }
}
