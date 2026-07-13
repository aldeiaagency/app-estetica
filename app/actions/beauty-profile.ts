'use server'

import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { getBeautyProfileByUserId } from '@/lib/beauty/profile-data'
import { prisma } from '@/lib/db/client'
import {
  BEAUTY_AREAS,
  BEAUTY_AREA_LABELS,
  BEAUTY_FEARS,
  BEAUTY_STYLES,
  BUYING_MOTIVATIONS,
  HAIR_TYPES,
  MAINTENANCE_LEVELS,
  PRICE_SENSITIVITIES,
  SKIN_TYPES,
} from '@/lib/beauty/recommendations'

const monthlyBudgetSchema = z.enum(['UNDER_40', 'BETWEEN_40_80', 'BETWEEN_80_150', 'OVER_150'])

const diagnosisSchema = z.object({
  goals: z.array(z.enum(BEAUTY_AREAS)).min(1, 'Elige al menos un objetivo').max(3, 'Elige como maximo 3 objetivos'),
  mainConcern: z.string().trim().min(3, 'Cuéntanos un poco más sobre tu objetivo').max(180),
  secondaryConcern: z.string().trim().max(180).optional(),
  skinType: z.enum(SKIN_TYPES).optional(),
  hairType: z.enum(HAIR_TYPES).optional(),
  beautyStyle: z.enum(BEAUTY_STYLES).optional(),
  monthlyBudget: monthlyBudgetSchema,
  maintenanceLevel: z.enum(MAINTENANCE_LEVELS),
  priceSensitivity: z.enum(PRICE_SENSITIVITIES),
  buyingMotivation: z.enum(BUYING_MOTIVATIONS),
  fear: z.enum(BEAUTY_FEARS).optional(),
  consentPersonalization: z.boolean().refine(value => value, 'Necesitamos tu consentimiento para personalizar tu plan'),
})

export type DiagnosisInput = z.infer<typeof diagnosisSchema>

export type DiagnosisActionResult =
  | { success: true; profileId: string }
  | { success: false; error: string }

function budgetToCents(value: z.infer<typeof monthlyBudgetSchema>) {
  const map = {
    UNDER_40: 4000,
    BETWEEN_40_80: 8000,
    BETWEEN_80_150: 15000,
    OVER_150: 20000,
  } satisfies Record<z.infer<typeof monthlyBudgetSchema>, number>

  return map[value]
}

export async function submitDiagnosisAction(input: unknown): Promise<DiagnosisActionResult> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { success: false, error: 'Inicia sesion para guardar tu Beauty Profile.' }
  }

  const parsed = diagnosisSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Revisa tu Beauty Profile.' }
  }

  const data = parsed.data

  try {
    const profile = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO "BeautyProfile" (
          "id",
          "userId",
          "skinType",
          "hairType",
          "beautyStyle",
          "monthlyBudgetCents",
          "maintenanceLevel",
          "mainConcern",
          "secondaryConcern",
          "priceSensitivity",
          "buyingMotivation",
          "fear",
          "consentPersonalizationAt",
          "profileCompletedAt",
          "updatedAt"
        )
        VALUES (
          ${nanoid()},
          ${userId},
          ${data.skinType ?? null}::"SkinType",
          ${data.hairType ?? null}::"HairType",
          ${data.beautyStyle ?? null}::"BeautyStyle",
          ${budgetToCents(data.monthlyBudget)},
          ${data.maintenanceLevel}::"MaintenanceLevel",
          ${data.mainConcern},
          ${data.secondaryConcern || null},
          ${data.priceSensitivity}::"PriceSensitivity",
          ${data.buyingMotivation}::"BuyingMotivation",
          ${data.fear ?? null}::"BeautyFear",
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT ("userId") DO UPDATE SET
          "skinType" = EXCLUDED."skinType",
          "hairType" = EXCLUDED."hairType",
          "beautyStyle" = EXCLUDED."beautyStyle",
          "monthlyBudgetCents" = EXCLUDED."monthlyBudgetCents",
          "maintenanceLevel" = EXCLUDED."maintenanceLevel",
          "mainConcern" = EXCLUDED."mainConcern",
          "secondaryConcern" = EXCLUDED."secondaryConcern",
          "priceSensitivity" = EXCLUDED."priceSensitivity",
          "buyingMotivation" = EXCLUDED."buyingMotivation",
          "fear" = EXCLUDED."fear",
          "consentPersonalizationAt" = EXCLUDED."consentPersonalizationAt",
          "profileCompletedAt" = EXCLUDED."profileCompletedAt",
          "updatedAt" = CURRENT_TIMESTAMP
        RETURNING "id"
      `

      const savedProfile = rows[0]
      if (!savedProfile) throw new Error('BeautyProfile upsert did not return a row')

      await tx.$executeRaw`DELETE FROM "BeautyGoal" WHERE "profileId" = ${savedProfile.id}`

      for (const [index, area] of data.goals.entries()) {
        await tx.$executeRaw`
          INSERT INTO "BeautyGoal" ("id", "profileId", "area", "objective", "priority", "active")
          VALUES (
            ${nanoid()},
            ${savedProfile.id},
            ${area}::"BeautyArea",
            ${`${BEAUTY_AREA_LABELS[area]}: ${data.mainConcern}`},
            ${index},
            true
          )
        `
      }

      return savedProfile
    })

    revalidatePath('/diagnostico')
    revalidatePath('/mi-plan')

    return { success: true, profileId: profile.id }
  } catch (error) {
    console.error('[beauty-profile] submit diagnosis failed:', error)
    return { success: false, error: 'No pudimos guardar tu Beauty Profile. Intentalo de nuevo.' }
  }
}

export async function getBeautyProfile(_legacyUserId?: string) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  return getBeautyProfileByUserId(userId)
}
