import 'server-only'

import { prisma } from '@/lib/db/client'
import type { BeautyGoalRecord, BeautyProfileWithGoals } from '@/lib/beauty/recommendations'

export async function getBeautyProfileByUserId(userId: string) {
  const profiles = await prisma.$queryRaw<BeautyProfileWithGoals[]>`
    SELECT
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
      "createdAt",
      "updatedAt"
    FROM "BeautyProfile"
    WHERE "userId" = ${userId}
    LIMIT 1
  `

  const profile = profiles[0]
  if (!profile) return null

  const goals = await prisma.$queryRaw<BeautyGoalRecord[]>`
    SELECT "id", "profileId", "area", "objective", "priority", "active", "createdAt"
    FROM "BeautyGoal"
    WHERE "profileId" = ${profile.id} AND "active" = true
    ORDER BY "priority" ASC
  `

  return { ...profile, goals }
}
