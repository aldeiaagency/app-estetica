'use server'

import { nanoid } from 'nanoid'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { getBeautyProfile } from '@/app/actions/beauty-profile'
import type { BeautyArea, BeautyProfileWithGoals, HairType, SkinType } from '@/lib/beauty/recommendations'

export type BeautyRoutineStepType =
  | 'CLEANSER'
  | 'TONER'
  | 'SERUM'
  | 'MOISTURIZER'
  | 'SPF'
  | 'MASK'
  | 'HAIR_CARE'
  | 'NAIL_CARE'
  | 'BODY_CARE'
  | 'MAKEUP'
  | 'WELLNESS'
  | 'OTHER'

export type BeautyRoutineMoment = 'MORNING' | 'EVENING' | 'WEEKLY' | 'AS_NEEDED'
export type BeautyRoutineStepStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'REMOVED'
export type ProductUsageStatus = 'IN_USE' | 'PAUSED' | 'FINISHED' | 'REPLENISH_SOON'

export type SmartProductRecord = {
  id: string
  centerId: string
  centerName: string
  centerSlug: string
  name: string
  slug: string | null
  description: string | null
  brand: string | null
  priceCents: number
  stock: number | null
  image: string | null
  active: boolean
  usageInstructions: string | null
  recommendedFor: string | null
  notRecommendedFor: string | null
  expectedDurationDays: number | null
  replenishmentIntervalDays: number | null
  routineStepType: BeautyRoutineStepType | null
  compatibilityTags: string[]
  recommendationTags: string[]
  alternativeProductId: string | null
  alternativeProductName: string | null
  alternativeProductPriceCents: number | null
  createdAt: Date
}

export type RoutineStepRecord = {
  id: string
  routineId: string
  productId: string | null
  title: string
  stepType: BeautyRoutineStepType
  moment: BeautyRoutineMoment
  instructions: string | null
  order: number
  status: BeautyRoutineStepStatus
  pausedAt: Date | null
  finishedAt: Date | null
  productName: string | null
  productBrand: string | null
  productImage: string | null
  productPriceCents: number | null
  usageId: string | null
  usageStatus: ProductUsageStatus | null
  expectedEndAt: Date | null
  replenishmentEnabled: boolean | null
  replenishmentIntervalDays: number | null
}

export type ReplenishmentRecord = {
  usageId: string
  stepId: string | null
  productId: string
  productName: string
  productBrand: string | null
  productImage: string | null
  productPriceCents: number
  centerName: string
  centerSlug: string
  status: ProductUsageStatus
  expectedEndAt: Date | null
  replenishmentEnabled: boolean
  replenishmentIntervalDays: number | null
  alternativeProductId: string | null
  alternativeProductName: string | null
  alternativeProductPriceCents: number | null
}

export type ProductRecommendation = SmartProductRecord & {
  score: number
  reason: string
}

const GOAL_TO_STEP: Record<BeautyArea, BeautyRoutineStepType[]> = {
  SKIN: ['CLEANSER', 'SERUM', 'MOISTURIZER', 'SPF', 'MASK'],
  HAIR: ['HAIR_CARE'],
  NAILS: ['NAIL_CARE'],
  BROWS_LASHES: ['MAKEUP', 'OTHER'],
  MAKEUP: ['MAKEUP'],
  BODY: ['BODY_CARE'],
  WELLNESS: ['WELLNESS'],
}

const STEP_LABELS: Record<BeautyRoutineStepType, string> = {
  CLEANSER: 'Limpieza',
  TONER: 'Tonico',
  SERUM: 'Serum',
  MOISTURIZER: 'Hidratacion',
  SPF: 'Proteccion solar',
  MASK: 'Mascarilla',
  HAIR_CARE: 'Cabello',
  NAIL_CARE: 'Unas',
  BODY_CARE: 'Cuerpo',
  MAKEUP: 'Maquillaje',
  WELLNESS: 'Bienestar',
  OTHER: 'Rutina',
}

function normalizeTags(tags: string[]) {
  return tags.map(tag => tag.toLowerCase().trim()).filter(Boolean)
}

function inferStepType(product: Pick<SmartProductRecord, 'name' | 'description' | 'routineStepType'>): BeautyRoutineStepType {
  if (product.routineStepType) return product.routineStepType
  const text = `${product.name} ${product.description ?? ''}`.toLowerCase()
  if (text.includes('limpia') || text.includes('cleanser')) return 'CLEANSER'
  if (text.includes('serum')) return 'SERUM'
  if (text.includes('solar') || text.includes('spf') || text.includes('protector')) return 'SPF'
  if (text.includes('hidrat') || text.includes('crema')) return 'MOISTURIZER'
  if (text.includes('mascarilla')) return 'MASK'
  if (text.includes('champ') || text.includes('cabello') || text.includes('pelo')) return 'HAIR_CARE'
  if (text.includes('una') || text.includes('unas') || text.includes('manicura')) return 'NAIL_CARE'
  if (text.includes('cuerpo') || text.includes('body')) return 'BODY_CARE'
  if (text.includes('maquill')) return 'MAKEUP'
  return 'OTHER'
}

function defaultMoment(stepType: BeautyRoutineStepType): BeautyRoutineMoment {
  if (stepType === 'SPF') return 'MORNING'
  if (stepType === 'MASK') return 'WEEKLY'
  if (stepType === 'MAKEUP' || stepType === 'WELLNESS') return 'AS_NEEDED'
  return 'EVENING'
}

function expectedEndFrom(days: number | null | undefined) {
  if (!days) return null
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

async function getProfileSafely(userId: string) {
  try {
    return await getBeautyProfile(userId)
  } catch {
    return null
  }
}

async function getOrCreateRoutine(profileId: string) {
  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "BeautyRoutine"
    WHERE "profileId" = ${profileId}
      AND "status" = 'ACTIVE'::"BeautyRoutineStatus"
    ORDER BY "createdAt" ASC
    LIMIT 1
  `

  if (existing[0]) return existing[0].id

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO "BeautyRoutine" ("id", "profileId", "title", "updatedAt")
    VALUES (${nanoid()}, ${profileId}, 'Mi rutina de belleza', CURRENT_TIMESTAMP)
    RETURNING "id"
  `

  return rows[0]?.id
}

export async function getSmartProduct(productId: string) {
  try {
    const rows = await prisma.$queryRaw<SmartProductRecord[]>`
      SELECT
        p."id",
        p."centerId",
        c."name" AS "centerName",
        c."slug" AS "centerSlug",
        p."name",
        p."slug",
        p."description",
        p."brand",
        p."priceCents",
        p."stock",
        p."image",
        p."active",
        p."usageInstructions",
        p."recommendedFor",
        p."notRecommendedFor",
        p."expectedDurationDays",
        p."replenishmentIntervalDays",
        p."routineStepType",
        p."compatibilityTags",
        p."recommendationTags",
        p."alternativeProductId",
        alt."name" AS "alternativeProductName",
        alt."priceCents" AS "alternativeProductPriceCents",
        p."createdAt"
      FROM "Product" p
      JOIN "Center" c ON c."id" = p."centerId"
      LEFT JOIN "Product" alt ON alt."id" = p."alternativeProductId"
      WHERE p."id" = ${productId}
      LIMIT 1
    `

    return rows[0] ?? null
  } catch {
    return null
  }
}

export async function getSmartProducts(productIds: string[]) {
  if (productIds.length === 0) return []

  try {
    return await prisma.$queryRaw<SmartProductRecord[]>`
      SELECT
        p."id",
        p."centerId",
        c."name" AS "centerName",
        c."slug" AS "centerSlug",
        p."name",
        p."slug",
        p."description",
        p."brand",
        p."priceCents",
        p."stock",
        p."image",
        p."active",
        p."usageInstructions",
        p."recommendedFor",
        p."notRecommendedFor",
        p."expectedDurationDays",
        p."replenishmentIntervalDays",
        p."routineStepType",
        p."compatibilityTags",
        p."recommendationTags",
        p."alternativeProductId",
        alt."name" AS "alternativeProductName",
        alt."priceCents" AS "alternativeProductPriceCents",
        p."createdAt"
      FROM "Product" p
      JOIN "Center" c ON c."id" = p."centerId"
      LEFT JOIN "Product" alt ON alt."id" = p."alternativeProductId"
      WHERE p."id" IN (${Prisma.join(productIds)})
    `
  } catch {
    return []
  }
}

export async function getRoutineForUser(userId: string) {
  const profile = await getProfileSafely(userId)
  if (!profile) return { profile: null, routineId: null, steps: [] as RoutineStepRecord[] }

  try {
    const routines = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "BeautyRoutine"
      WHERE "profileId" = ${profile.id}
        AND "status" = 'ACTIVE'::"BeautyRoutineStatus"
      ORDER BY "createdAt" ASC
      LIMIT 1
    `

    const routineId = routines[0]?.id ?? null
    if (!routineId) return { profile, routineId: null, steps: [] as RoutineStepRecord[] }

    const steps = await prisma.$queryRaw<RoutineStepRecord[]>`
      SELECT
        s."id",
        s."routineId",
        s."productId",
        s."title",
        s."stepType",
        s."moment",
        s."instructions",
        s."order",
        s."status",
        s."pausedAt",
        s."finishedAt",
        p."name" AS "productName",
        p."brand" AS "productBrand",
        p."image" AS "productImage",
        p."priceCents" AS "productPriceCents",
        u."id" AS "usageId",
        u."status" AS "usageStatus",
        u."expectedEndAt",
        u."replenishmentEnabled",
        u."replenishmentIntervalDays"
      FROM "BeautyRoutineStep" s
      LEFT JOIN "Product" p ON p."id" = s."productId"
      LEFT JOIN "ProductUsage" u ON u."stepId" = s."id" AND u."profileId" = ${profile.id}
      WHERE s."routineId" = ${routineId}
        AND s."status" <> 'REMOVED'::"BeautyRoutineStepStatus"
      ORDER BY s."order" ASC, s."createdAt" ASC
    `

    return { profile, routineId, steps }
  } catch {
    return { profile, routineId: null, steps: [] as RoutineStepRecord[] }
  }
}

export async function addProductToRoutineAction(productId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { success: false, error: 'Inicia sesion para guardar productos en tu rutina.' }

  const profile = await getProfileSafely(userId)
  if (!profile) return { success: false, error: 'Completa primero tu Beauty Profile.' }

  const product = await getSmartProduct(productId)
  if (!product || !product.active) return { success: false, error: 'Producto no disponible.' }

  try {
    const routineId = await getOrCreateRoutine(profile.id)
    if (!routineId) return { success: false, error: 'No pudimos preparar tu rutina.' }

    const duplicate = await prisma.$queryRaw<{ id: string }[]>`
      SELECT s."id"
      FROM "BeautyRoutineStep" s
      WHERE s."routineId" = ${routineId}
        AND s."productId" = ${productId}
        AND s."status" IN ('ACTIVE'::"BeautyRoutineStepStatus", 'PAUSED'::"BeautyRoutineStepStatus")
      LIMIT 1
    `

    if (duplicate[0]) {
      revalidatePath('/rutina')
      return { success: true }
    }

    const stepType = inferStepType(product)
    const moment = defaultMoment(stepType)
    const instructions = product.usageInstructions || `Usalo en la fase de ${STEP_LABELS[stepType].toLowerCase()} segun tolerancia y recomendacion del centro.`
    const interval = product.replenishmentIntervalDays ?? product.expectedDurationDays ?? null
    const expectedEndAt = expectedEndFrom(interval)

    await prisma.$transaction(async (tx) => {
      const orderRows = await tx.$queryRaw<{ nextOrder: number }[]>`
        SELECT COALESCE(MAX("order"), -1) + 1 AS "nextOrder"
        FROM "BeautyRoutineStep"
        WHERE "routineId" = ${routineId}
      `
      const stepId = nanoid()

      await tx.$executeRaw`
        INSERT INTO "BeautyRoutineStep" (
          "id",
          "routineId",
          "productId",
          "title",
          "stepType",
          "moment",
          "instructions",
          "order",
          "updatedAt"
        )
        VALUES (
          ${stepId},
          ${routineId},
          ${product.id},
          ${product.name},
          ${stepType}::"BeautyRoutineStepType",
          ${moment}::"BeautyRoutineMoment",
          ${instructions},
          ${orderRows[0]?.nextOrder ?? 0},
          CURRENT_TIMESTAMP
        )
      `

      await tx.$executeRaw`
        INSERT INTO "ProductUsage" (
          "id",
          "profileId",
          "productId",
          "stepId",
          "expectedEndAt",
          "replenishmentEnabled",
          "replenishmentIntervalDays",
          "updatedAt"
        )
        VALUES (
          ${nanoid()},
          ${profile.id},
          ${product.id},
          ${stepId},
          ${expectedEndAt},
          false,
          ${interval},
          CURRENT_TIMESTAMP
        )
      `
    })

    revalidatePath('/rutina')
    revalidatePath('/reposicion')
    revalidatePath('/mi-plan')
    return { success: true }
  } catch (error) {
    console.error('[beauty-routine] add product failed:', error)
    return { success: false, error: 'No pudimos guardar el producto en tu rutina.' }
  }
}

export async function updateRoutineStepStatusAction(
  stepId: string,
  status: Extract<BeautyRoutineStepStatus, 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'REMOVED'>
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { success: false, error: 'Inicia sesion para actualizar tu rutina.' }

  const profile = await getProfileSafely(userId)
  if (!profile) return { success: false, error: 'Completa primero tu Beauty Profile.' }

  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT s."id"
      FROM "BeautyRoutineStep" s
      JOIN "BeautyRoutine" r ON r."id" = s."routineId"
      WHERE s."id" = ${stepId} AND r."profileId" = ${profile.id}
      LIMIT 1
    `

    if (!rows[0]) return { success: false, error: 'No encontramos ese paso en tu rutina.' }

    const usageStatus = status === 'FINISHED' ? 'FINISHED' : status === 'PAUSED' ? 'PAUSED' : 'IN_USE'

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "BeautyRoutineStep"
        SET
          "status" = ${status}::"BeautyRoutineStepStatus",
          "pausedAt" = CASE WHEN ${status}::"BeautyRoutineStepStatus" = 'PAUSED'::"BeautyRoutineStepStatus" THEN CURRENT_TIMESTAMP ELSE "pausedAt" END,
          "finishedAt" = CASE WHEN ${status}::"BeautyRoutineStepStatus" = 'FINISHED'::"BeautyRoutineStepStatus" THEN CURRENT_TIMESTAMP ELSE "finishedAt" END,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${stepId}
      `

      await tx.$executeRaw`
        UPDATE "ProductUsage"
        SET
          "status" = ${usageStatus}::"ProductUsageStatus",
          "pausedAt" = CASE WHEN ${usageStatus}::"ProductUsageStatus" = 'PAUSED'::"ProductUsageStatus" THEN CURRENT_TIMESTAMP ELSE "pausedAt" END,
          "finishedAt" = CASE WHEN ${usageStatus}::"ProductUsageStatus" = 'FINISHED'::"ProductUsageStatus" THEN CURRENT_TIMESTAMP ELSE "finishedAt" END,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "stepId" = ${stepId} AND "profileId" = ${profile.id}
      `
    })

    revalidatePath('/rutina')
    revalidatePath('/reposicion')
    revalidatePath('/mi-plan')
    return { success: true }
  } catch (error) {
    console.error('[beauty-routine] update step failed:', error)
    return { success: false, error: 'No pudimos actualizar tu rutina.' }
  }
}

export async function toggleReplenishmentAction(usageId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { success: false, error: 'Inicia sesion para actualizar reposicion.' }

  const profile = await getProfileSafely(userId)
  if (!profile) return { success: false, error: 'Completa primero tu Beauty Profile.' }

  try {
    const rows = await prisma.$queryRaw<{ id: string; intervalDays: number | null }[]>`
      SELECT
        u."id",
        COALESCE(u."replenishmentIntervalDays", p."replenishmentIntervalDays", p."expectedDurationDays") AS "intervalDays"
      FROM "ProductUsage" u
      JOIN "Product" p ON p."id" = u."productId"
      WHERE u."id" = ${usageId} AND u."profileId" = ${profile.id}
      LIMIT 1
    `

    const usage = rows[0]
    if (!usage) return { success: false, error: 'No encontramos ese producto en tu rutina.' }

    await prisma.$executeRaw`
      UPDATE "ProductUsage"
      SET
        "replenishmentEnabled" = ${enabled},
        "replenishmentIntervalDays" = COALESCE("replenishmentIntervalDays", ${usage.intervalDays}),
        "expectedEndAt" = CASE
          WHEN ${enabled} = true AND "expectedEndAt" IS NULL AND ${usage.intervalDays}::int IS NOT NULL
          THEN CURRENT_TIMESTAMP + (${usage.intervalDays}::int || ' days')::interval
          ELSE "expectedEndAt"
        END,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${usageId}
    `

    revalidatePath('/rutina')
    revalidatePath('/reposicion')
    return { success: true }
  } catch (error) {
    console.error('[beauty-routine] toggle replenishment failed:', error)
    return { success: false, error: 'No pudimos actualizar la reposicion.' }
  }
}

export async function markUsageFinishedAction(usageId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { success: false, error: 'Inicia sesion para actualizar reposicion.' }

  const profile = await getProfileSafely(userId)
  if (!profile) return { success: false, error: 'Completa primero tu Beauty Profile.' }

  try {
    await prisma.$executeRaw`
      UPDATE "ProductUsage"
      SET
        "status" = 'FINISHED'::"ProductUsageStatus",
        "finishedAt" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${usageId} AND "profileId" = ${profile.id}
    `

    revalidatePath('/rutina')
    revalidatePath('/reposicion')
    return { success: true }
  } catch (error) {
    console.error('[beauty-routine] finish usage failed:', error)
    return { success: false, error: 'No pudimos marcar el producto como terminado.' }
  }
}

export async function getReplenishmentForUser(userId: string) {
  const profile = await getProfileSafely(userId)
  if (!profile) return { profile: null, items: [] as ReplenishmentRecord[] }

  try {
    const items = await prisma.$queryRaw<ReplenishmentRecord[]>`
      SELECT
        u."id" AS "usageId",
        u."stepId",
        p."id" AS "productId",
        p."name" AS "productName",
        p."brand" AS "productBrand",
        p."image" AS "productImage",
        p."priceCents" AS "productPriceCents",
        c."name" AS "centerName",
        c."slug" AS "centerSlug",
        u."status",
        u."expectedEndAt",
        u."replenishmentEnabled",
        u."replenishmentIntervalDays",
        p."alternativeProductId",
        alt."name" AS "alternativeProductName",
        alt."priceCents" AS "alternativeProductPriceCents"
      FROM "ProductUsage" u
      JOIN "Product" p ON p."id" = u."productId"
      JOIN "Center" c ON c."id" = p."centerId"
      LEFT JOIN "Product" alt ON alt."id" = p."alternativeProductId"
      WHERE u."profileId" = ${profile.id}
        AND u."status" IN ('IN_USE'::"ProductUsageStatus", 'PAUSED'::"ProductUsageStatus", 'REPLENISH_SOON'::"ProductUsageStatus")
      ORDER BY u."replenishmentEnabled" DESC, u."expectedEndAt" ASC NULLS LAST, u."createdAt" DESC
    `

    return { profile, items }
  } catch {
    return { profile, items: [] as ReplenishmentRecord[] }
  }
}

function scoreProduct(product: SmartProductRecord, profile: BeautyProfileWithGoals) {
  const goalStepTypes = new Set(profile.goals.flatMap(goal => GOAL_TO_STEP[goal.area] ?? []))
  const tags = normalizeTags([...product.compatibilityTags, ...product.recommendationTags])
  const text = `${product.name} ${product.description ?? ''} ${tags.join(' ')}`.toLowerCase()
  let score = 0

  if (product.routineStepType && goalStepTypes.has(product.routineStepType)) score += 8
  for (const goal of profile.goals) {
    if (text.includes(goal.area.toLowerCase())) score += 2
  }
  if (profile.skinType && matchesSkin(profile.skinType, text, tags)) score += 4
  if (profile.hairType && matchesHair(profile.hairType, text, tags)) score += 4
  if (product.expectedDurationDays || product.replenishmentIntervalDays) score += 1
  if (product.usageInstructions) score += 1
  if (product.notRecommendedFor && profile.fear && product.notRecommendedFor.toLowerCase().includes(profile.fear.toLowerCase())) score -= 3

  return score
}

function matchesSkin(skinType: SkinType, text: string, tags: string[]) {
  const needles: Record<SkinType, string[]> = {
    DRY: ['seca', 'dry', 'hidrat'],
    OILY: ['grasa', 'oily', 'sebo'],
    COMBINATION: ['mixta', 'combination'],
    SENSITIVE: ['sensible', 'sensitive', 'calm'],
    NORMAL: ['normal'],
    UNKNOWN: [],
  }
  return needles[skinType].some(needle => text.includes(needle) || tags.includes(needle))
}

function matchesHair(hairType: HairType, text: string, tags: string[]) {
  const needles: Record<HairType, string[]> = {
    STRAIGHT: ['liso', 'straight'],
    WAVY: ['ondulado', 'wavy'],
    CURLY: ['rizado', 'curly'],
    COILY: ['coily', 'afro'],
    FINE: ['fino', 'fine'],
    THICK: ['grueso', 'thick'],
    COLORED: ['color', 'coloreado', 'tenido'],
    DAMAGED: ['danado', 'reparador'],
    UNKNOWN: [],
  }
  return needles[hairType].some(needle => text.includes(needle) || tags.includes(needle))
}

function recommendationReason(product: SmartProductRecord, profile: BeautyProfileWithGoals) {
  const stepType = product.routineStepType ?? inferStepType(product)
  const goalAreas = profile.goals.map(goal => goal.area)
  if (stepType === 'HAIR_CARE' && goalAreas.includes('HAIR')) return 'Encaja con tu objetivo de cabello y puede tener reposicion planificada.'
  if (['CLEANSER', 'SERUM', 'MOISTURIZER', 'SPF', 'MASK'].includes(stepType) && goalAreas.includes('SKIN')) return 'Encaja con tu objetivo de piel y explica como integrarlo en rutina.'
  if (stepType === 'NAIL_CARE' && goalAreas.includes('NAILS')) return 'Puede ayudarte a mantener el resultado entre visitas de unas.'
  if (product.expectedDurationDays || product.replenishmentIntervalDays) return 'Tiene duracion orientativa, asi que la app puede ayudarte a no recomprar ni tarde ni pronto.'
  return 'Producto con instrucciones suficientes para valorar si entra en tu rutina.'
}

export async function getRecommendedProductsForProfile(profile: BeautyProfileWithGoals, limit = 3) {
  try {
    const products = await prisma.$queryRaw<SmartProductRecord[]>`
      SELECT
        p."id",
        p."centerId",
        c."name" AS "centerName",
        c."slug" AS "centerSlug",
        p."name",
        p."slug",
        p."description",
        p."brand",
        p."priceCents",
        p."stock",
        p."image",
        p."active",
        p."usageInstructions",
        p."recommendedFor",
        p."notRecommendedFor",
        p."expectedDurationDays",
        p."replenishmentIntervalDays",
        p."routineStepType",
        p."compatibilityTags",
        p."recommendationTags",
        p."alternativeProductId",
        alt."name" AS "alternativeProductName",
        alt."priceCents" AS "alternativeProductPriceCents",
        p."createdAt"
      FROM "Product" p
      JOIN "Center" c ON c."id" = p."centerId"
      LEFT JOIN "Product" alt ON alt."id" = p."alternativeProductId"
      WHERE p."active" = true
        AND c."published" = true
      ORDER BY p."createdAt" DESC
      LIMIT 40
    `

    return products
      .map(product => ({ ...product, score: scoreProduct(product, profile), reason: recommendationReason(product, profile) }))
      .filter(product => product.score > 0)
      .sort((a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit) satisfies ProductRecommendation[]
  } catch {
    return []
  }
}
