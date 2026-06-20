'use server'

import { nanoid } from 'nanoid'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { PLAN_FEATURES } from '@/lib/billing/plans'
import { prisma } from '@/lib/db/client'
import {
  BEAUTY_AREAS,
  MAINTENANCE_LEVELS,
  type BeautyArea,
  type BeautyProfileWithGoals,
} from '@/lib/beauty/recommendations'

const BEAUTY_PACK_ITEM_TYPES = ['SERVICE', 'PRODUCT', 'BONUS_SESSION', 'CONSULTATION', 'FOLLOW_UP', 'OTHER'] as const

export type BeautyPackItemType = typeof BEAUTY_PACK_ITEM_TYPES[number]

export type BeautyPackItemRecord = {
  id: string
  packId: string
  label: string
  itemType: BeautyPackItemType
  quantity: number
  serviceId: string | null
  productId: string | null
  note: string | null
  order: number
  createdAt: Date
}

export type BeautyPackRecord = {
  id: string
  centerId: string
  centerName: string
  centerSlug: string
  bonoId: string | null
  bonoName: string | null
  name: string
  slug: string | null
  objective: string
  description: string | null
  audience: string | null
  notFor: string | null
  expectedResult: string | null
  priceCents: number
  compareAtPriceCents: number | null
  durationDays: number | null
  preferredArea: BeautyArea | null
  minMaintenanceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null
  active: boolean
  featured: boolean
  createdAt: Date
  updatedAt: Date
  items: BeautyPackItemRecord[]
}

type BeautyPackRow = Omit<BeautyPackRecord, 'items'>

const packItemInputSchema = z.object({
  label: z.string().trim().min(2, 'Cada linea del pack necesita un nombre').max(120),
  itemType: z.enum(BEAUTY_PACK_ITEM_TYPES).default('SERVICE'),
  quantity: z.number().int().min(1).max(99).default(1),
  serviceId: z.string().trim().optional(),
  productId: z.string().trim().optional(),
  note: z.string().trim().max(180).optional(),
})

const packInputSchema = z.object({
  name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(120),
  objective: z.string().trim().min(3, 'Define el objetivo principal').max(160),
  description: z.string().trim().max(360).optional(),
  audience: z.string().trim().max(220).optional(),
  notFor: z.string().trim().max(220).optional(),
  expectedResult: z.string().trim().max(220).optional(),
  priceCents: z.number().int().min(0, 'El precio no puede ser negativo'),
  compareAtPriceCents: z.number().int().min(0).optional(),
  durationDays: z.number().int().min(1).max(730).optional(),
  preferredArea: z.enum(BEAUTY_AREAS).optional(),
  minMaintenanceLevel: z.enum(MAINTENANCE_LEVELS).optional(),
  bonoId: z.string().trim().optional(),
  featured: z.boolean().optional(),
  items: z.array(packItemInputSchema).min(1, 'Incluye al menos una accion, servicio o producto').max(8),
})

export type BeautyPackInput = z.infer<typeof packInputSchema>

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'pack'
}

async function hydratePackItems(packs: BeautyPackRow[]): Promise<BeautyPackRecord[]> {
  if (packs.length === 0) return []

  const packIds = packs.map(pack => pack.id)
  const items = await prisma.$queryRaw<BeautyPackItemRecord[]>`
    SELECT
      "id",
      "packId",
      "label",
      "itemType",
      "quantity",
      "serviceId",
      "productId",
      "note",
      "order",
      "createdAt"
    FROM "BeautyPackItem"
    WHERE "packId" IN (${Prisma.join(packIds)})
    ORDER BY "order" ASC, "createdAt" ASC
  `

  const byPack = new Map<string, BeautyPackItemRecord[]>()
  for (const item of items) {
    const current = byPack.get(item.packId) ?? []
    current.push(item)
    byPack.set(item.packId, current)
  }

  return packs.map(pack => ({ ...pack, items: byPack.get(pack.id) ?? [] }))
}

export async function getBeautyPacksForOrganization(orgId: string) {
  try {
    const packs = await prisma.$queryRaw<BeautyPackRow[]>`
      SELECT
        p."id",
        p."centerId",
        c."name" AS "centerName",
        c."slug" AS "centerSlug",
        p."bonoId",
        b."name" AS "bonoName",
        p."name",
        p."slug",
        p."objective",
        p."description",
        p."audience",
        p."notFor",
        p."expectedResult",
        p."priceCents",
        p."compareAtPriceCents",
        p."durationDays",
        p."preferredArea",
        p."minMaintenanceLevel",
        p."active",
        p."featured",
        p."createdAt",
        p."updatedAt"
      FROM "BeautyPack" p
      JOIN "Center" c ON c."id" = p."centerId"
      LEFT JOIN "Bono" b ON b."id" = p."bonoId"
      WHERE c."organizationId" = ${orgId}
      ORDER BY p."createdAt" DESC
    `

    return hydratePackItems(packs)
  } catch {
    return []
  }
}

export async function getBeautyPacksForCenterIds(centerIds: string[], limit = 12) {
  if (centerIds.length === 0) return []

  try {
    const packs = await prisma.$queryRaw<BeautyPackRow[]>`
      SELECT
        p."id",
        p."centerId",
        c."name" AS "centerName",
        c."slug" AS "centerSlug",
        p."bonoId",
        b."name" AS "bonoName",
        p."name",
        p."slug",
        p."objective",
        p."description",
        p."audience",
        p."notFor",
        p."expectedResult",
        p."priceCents",
        p."compareAtPriceCents",
        p."durationDays",
        p."preferredArea",
        p."minMaintenanceLevel",
        p."active",
        p."featured",
        p."createdAt",
        p."updatedAt"
      FROM "BeautyPack" p
      JOIN "Center" c ON c."id" = p."centerId"
      LEFT JOIN "Bono" b ON b."id" = p."bonoId"
      WHERE p."active" = true
        AND p."centerId" IN (${Prisma.join(centerIds)})
      ORDER BY p."featured" DESC, p."createdAt" DESC
      LIMIT ${limit}
    `

    return hydratePackItems(packs)
  } catch {
    return []
  }
}

export async function getRecommendedBeautyPacksForProfile(profile: BeautyProfileWithGoals, limit = 3) {
  try {
    const packs = await prisma.$queryRaw<BeautyPackRow[]>`
      SELECT
        p."id",
        p."centerId",
        c."name" AS "centerName",
        c."slug" AS "centerSlug",
        p."bonoId",
        b."name" AS "bonoName",
        p."name",
        p."slug",
        p."objective",
        p."description",
        p."audience",
        p."notFor",
        p."expectedResult",
        p."priceCents",
        p."compareAtPriceCents",
        p."durationDays",
        p."preferredArea",
        p."minMaintenanceLevel",
        p."active",
        p."featured",
        p."createdAt",
        p."updatedAt"
      FROM "BeautyPack" p
      JOIN "Center" c ON c."id" = p."centerId"
      LEFT JOIN "Bono" b ON b."id" = p."bonoId"
      WHERE p."active" = true
      ORDER BY p."featured" DESC, p."createdAt" DESC
      LIMIT 24
    `

    const hydrated = await hydratePackItems(packs)
    const goalAreas = new Set(profile.goals.map(goal => goal.area))
    const budget = profile.monthlyBudgetCents ?? 0

    return hydrated
      .map(pack => ({
        pack,
        score:
          (pack.preferredArea && goalAreas.has(pack.preferredArea) ? 10 : 0) +
          (pack.priceCents <= budget || budget === 0 ? 3 : 0) +
          (pack.minMaintenanceLevel && pack.minMaintenanceLevel === profile.maintenanceLevel ? 2 : 0) +
          (pack.featured ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score || b.pack.createdAt.getTime() - a.pack.createdAt.getTime())
      .slice(0, limit)
      .map(item => item.pack)
  } catch {
    return []
  }
}

export async function createBeautyPackAction(input: unknown): Promise<{ success: boolean; error?: string; packId?: string }> {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) return { success: false, error: 'Sin permisos' }

  const parsed = packInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Revisa los datos del pack' }
  }

  try {
    const [org, center] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } }),
      prisma.center.findFirst({ where: { organizationId: orgId }, select: { id: true, slug: true } }),
    ])

    if (!org) return { success: false, error: 'Organizacion no encontrada' }
    if (!center) return { success: false, error: 'Centro no encontrado' }
    if (!PLAN_FEATURES[org.plan].hasBonos) {
      return { success: false, error: 'Los packs por objetivo estan disponibles a partir del plan Growth.' }
    }

    const data = parsed.data
    if (data.bonoId) {
      const linkedBono = await prisma.bono.findFirst({ where: { id: data.bonoId, centerId: center.id }, select: { id: true } })
      if (!linkedBono) return { success: false, error: 'El bono asociado no pertenece a este centro.' }
    }

    const packId = nanoid()
    const slug = `${slugify(data.name)}-${nanoid(6)}`

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "BeautyPack" (
          "id",
          "centerId",
          "bonoId",
          "name",
          "slug",
          "objective",
          "description",
          "audience",
          "notFor",
          "expectedResult",
          "priceCents",
          "compareAtPriceCents",
          "durationDays",
          "preferredArea",
          "minMaintenanceLevel",
          "active",
          "featured",
          "updatedAt"
        )
        VALUES (
          ${packId},
          ${center.id},
          ${data.bonoId || null},
          ${data.name},
          ${slug},
          ${data.objective},
          ${data.description || null},
          ${data.audience || null},
          ${data.notFor || null},
          ${data.expectedResult || null},
          ${data.priceCents},
          ${data.compareAtPriceCents ?? null},
          ${data.durationDays ?? null},
          ${data.preferredArea ?? null}::"BeautyArea",
          ${data.minMaintenanceLevel ?? null}::"MaintenanceLevel",
          true,
          ${data.featured ?? false},
          CURRENT_TIMESTAMP
        )
      `

      for (const [index, item] of data.items.entries()) {
        await tx.$executeRaw`
          INSERT INTO "BeautyPackItem" (
            "id",
            "packId",
            "label",
            "itemType",
            "quantity",
            "serviceId",
            "productId",
            "note",
            "order"
          )
          VALUES (
            ${nanoid()},
            ${packId},
            ${item.label},
            ${item.itemType}::"BeautyPackItemType",
            ${item.quantity},
            ${item.serviceId || null},
            ${item.productId || null},
            ${item.note || null},
            ${index}
          )
        `
      }
    })

    revalidatePath('/dashboard/packs')
    revalidatePath(`/centro/${center.slug}`)
    revalidatePath('/mi-plan')
    revalidatePath('/buscar')

    return { success: true, packId }
  } catch (error) {
    console.error('[beauty-packs] create failed:', error)
    return { success: false, error: 'No pudimos crear el pack.' }
  }
}

export async function toggleBeautyPackActiveAction(packId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) return { success: false, error: 'Sin permisos' }

  try {
    const rows = await prisma.$queryRaw<{ id: string; active: boolean; centerSlug: string }[]>`
      SELECT p."id", p."active", c."slug" AS "centerSlug"
      FROM "BeautyPack" p
      JOIN "Center" c ON c."id" = p."centerId"
      WHERE p."id" = ${packId} AND c."organizationId" = ${orgId}
      LIMIT 1
    `

    const pack = rows[0]
    if (!pack) return { success: false, error: 'Pack no encontrado' }

    await prisma.$executeRaw`
      UPDATE "BeautyPack"
      SET "active" = ${!pack.active}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${packId}
    `

    revalidatePath('/dashboard/packs')
    revalidatePath(`/centro/${pack.centerSlug}`)
    revalidatePath('/mi-plan')
    revalidatePath('/buscar')

    return { success: true }
  } catch (error) {
    console.error('[beauty-packs] toggle failed:', error)
    return { success: false, error: 'No pudimos actualizar el pack.' }
  }
}
