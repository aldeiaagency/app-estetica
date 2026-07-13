'use server'

import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/config'
import { getBeautyProfileByUserId } from '@/lib/beauty/profile-data'
import { prisma } from '@/lib/db/client'
import { generateBeautyPlan, type BeautyPlanRecommendation, type GeneratedBeautyPlan } from '@/lib/beauty/recommendations'

export type BeautyPlanItemStatus = 'PENDING' | 'DONE' | 'SKIPPED' | 'DISMISSED'
export type BeautyPlanItemType = 'SERVICE' | 'PRODUCT' | 'PACK' | 'REMINDER' | 'AVOID' | 'EDUCATION'

export type PersistedBeautyPlanItem = {
  id: string
  planId: string
  type: BeautyPlanItemType
  title: string
  reason: string | null
  priority: number
  serviceId: string | null
  productId: string | null
  packId: string | null
  centerId: string | null
  recommendedDate: Date | null
  estimatedPriceCents: number | null
  status: BeautyPlanItemStatus
}

export type PersistedBeautyPlan = {
  id: string
  profileId: string
  title: string
  month: string
  summary: string | null
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  estimatedBudgetCents: number | null
  createdAt: Date
  updatedAt: Date
  items: PersistedBeautyPlanItem[]
}

function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function recommendationToType(item: BeautyPlanRecommendation): BeautyPlanItemType {
  if (item.href.startsWith('/productos')) return 'PRODUCT'
  if (item.href.includes('/buscar')) return 'SERVICE'
  return 'REMINDER'
}

function estimateToCents(estimate: string) {
  const matches = Array.from(estimate.matchAll(/(\d+)/g)).map(match => Number(match[1]))
  if (matches.length === 0) return null
  return Math.round(Math.max(...matches) * 100)
}

async function getPlanItems(planId: string) {
  return prisma.$queryRaw<PersistedBeautyPlanItem[]>`
    SELECT
      "id",
      "planId",
      "type",
      "title",
      "reason",
      "priority",
      "serviceId",
      "productId",
      "packId",
      "centerId",
      "recommendedDate",
      "estimatedPriceCents",
      "status"
    FROM "BeautyPlanItem"
    WHERE "planId" = ${planId}
    ORDER BY "priority" ASC
  `
}

async function readPlan(planId: string): Promise<PersistedBeautyPlan | null> {
  const plans = await prisma.$queryRaw<Omit<PersistedBeautyPlan, 'items'>[]>`
    SELECT
      "id",
      "profileId",
      "title",
      "month",
      "summary",
      "status",
      "estimatedBudgetCents",
      "createdAt",
      "updatedAt"
    FROM "BeautyPlan"
    WHERE "id" = ${planId}
    LIMIT 1
  `

  const plan = plans[0]
  if (!plan) return null
  const items = await getPlanItems(plan.id)
  return { ...plan, items }
}

async function replacePlanItems(planId: string, generated: GeneratedBeautyPlan) {
  await prisma.$executeRaw`DELETE FROM "BeautyPlanItem" WHERE "planId" = ${planId}`

  let priority = 0

  for (const item of generated.recommendations) {
    await prisma.$executeRaw`
      INSERT INTO "BeautyPlanItem" (
        "id",
        "planId",
        "type",
        "title",
        "reason",
        "priority",
        "estimatedPriceCents"
      )
      VALUES (
        ${nanoid()},
        ${planId},
        ${recommendationToType(item)}::"BeautyPlanItemType",
        ${item.title},
        ${item.reason},
        ${priority++},
        ${estimateToCents(item.estimate)}
      )
    `
  }

  for (const item of generated.avoid) {
    await prisma.$executeRaw`
      INSERT INTO "BeautyPlanItem" (
        "id",
        "planId",
        "type",
        "title",
        "reason",
        "priority"
      )
      VALUES (
        ${nanoid()},
        ${planId},
        'AVOID'::"BeautyPlanItemType",
        ${item.title},
        ${item.reason},
        ${priority++}
      )
    `
  }

  for (const step of generated.nextSteps) {
    await prisma.$executeRaw`
      INSERT INTO "BeautyPlanItem" (
        "id",
        "planId",
        "type",
        "title",
        "priority"
      )
      VALUES (
        ${nanoid()},
        ${planId},
        'REMINDER'::"BeautyPlanItemType",
        ${step},
        ${priority++}
      )
    `
  }
}

export async function getOrCreateMonthlyBeautyPlan(_legacyUserId?: string): Promise<PersistedBeautyPlan | null> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const profile = await getBeautyProfileByUserId(userId)
  if (!profile) return null

  const month = currentMonthKey()
  try {
    const existing = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "BeautyPlan"
      WHERE "profileId" = ${profile.id} AND "month" = ${month} AND "status" = 'ACTIVE'
      ORDER BY "createdAt" DESC
      LIMIT 1
    `

    if (existing[0]) return readPlan(existing[0].id)

    const generated = generateBeautyPlan(profile)
    const planId = nanoid()

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "BeautyPlan" (
          "id",
          "profileId",
          "title",
          "month",
          "summary",
          "estimatedBudgetCents",
          "updatedAt"
        )
        VALUES (
          ${planId},
          ${profile.id},
          ${`Tu plan de belleza de ${generated.monthLabel}`},
          ${month},
          ${generated.summary},
          ${profile.monthlyBudgetCents},
          CURRENT_TIMESTAMP
        )
      `
    })

    await replacePlanItems(planId, generated)
    return readPlan(planId)
  } catch (error) {
    console.warn('[beauty-plan] persisted plan unavailable:', error)
    return null
  }
}

export async function regenerateBeautyPlanAction(): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { success: false, error: 'Inicia sesion para regenerar tu plan.' }

  const profile = await getBeautyProfileByUserId(userId)
  if (!profile) return { success: false, error: 'Completa primero tu Beauty Profile.' }

  const month = currentMonthKey()
  const generated = generateBeautyPlan(profile)

  try {
    const plans = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "BeautyPlan"
      WHERE "profileId" = ${profile.id} AND "month" = ${month} AND "status" = 'ACTIVE'
      ORDER BY "createdAt" DESC
      LIMIT 1
    `

    const planId = plans[0]?.id ?? nanoid()

    if (!plans[0]) {
      await prisma.$executeRaw`
        INSERT INTO "BeautyPlan" ("id", "profileId", "title", "month", "summary", "estimatedBudgetCents", "updatedAt")
        VALUES (
          ${planId},
          ${profile.id},
          ${`Tu plan de belleza de ${generated.monthLabel}`},
          ${month},
          ${generated.summary},
          ${profile.monthlyBudgetCents},
          CURRENT_TIMESTAMP
        )
      `
    } else {
      await prisma.$executeRaw`
        UPDATE "BeautyPlan"
        SET "title" = ${`Tu plan de belleza de ${generated.monthLabel}`},
            "summary" = ${generated.summary},
            "estimatedBudgetCents" = ${profile.monthlyBudgetCents},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${planId}
      `
    }

    await replacePlanItems(planId, generated)
    revalidatePath('/mi-plan')
    revalidatePath('/wallet')
    return { success: true }
  } catch (error) {
    console.error('[beauty-plan] regenerate failed:', error)
    return { success: false, error: 'No pudimos regenerar tu plan.' }
  }
}

export async function updatePlanItemStatusAction(
  itemId: string,
  status: BeautyPlanItemStatus
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { success: false, error: 'Inicia sesion para actualizar tu plan.' }
  if (!['PENDING', 'DONE', 'SKIPPED', 'DISMISSED'].includes(status)) {
    return { success: false, error: 'Estado no valido.' }
  }

  try {
    const rows = await prisma.$queryRaw<{ itemId: string }[]>`
      SELECT i."id" AS "itemId"
      FROM "BeautyPlanItem" i
      JOIN "BeautyPlan" p ON p."id" = i."planId"
      JOIN "BeautyProfile" bp ON bp."id" = p."profileId"
      WHERE i."id" = ${itemId} AND bp."userId" = ${userId}
      LIMIT 1
    `

    if (!rows[0]) return { success: false, error: 'No encontramos esa recomendacion en tu plan.' }

    await prisma.$executeRaw`
      UPDATE "BeautyPlanItem"
      SET "status" = ${status}::"BeautyPlanItemStatus"
      WHERE "id" = ${itemId}
    `

    revalidatePath('/mi-plan')
    revalidatePath('/wallet')
    return { success: true }
  } catch (error) {
    console.error('[beauty-plan] update item failed:', error)
    return { success: false, error: 'No pudimos actualizar la recomendacion.' }
  }
}
