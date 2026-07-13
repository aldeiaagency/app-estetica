import { prisma } from '@/lib/db/client'

export type BonoRedemptionResult =
  | { success: true; sessionsRemaining: number }
  | { success: false; reason: 'NOT_FOUND' | 'EMPTY' | 'EXPIRED' }

export async function redeemBonoSessionAtomic(
  instanceId: string,
  organizationId: string,
): Promise<BonoRedemptionResult> {
  const rows = await prisma.$queryRaw<{ sessionsRemaining: number }[]>`
    UPDATE "BonoInstance" AS instance
    SET "sessionsRemaining" = instance."sessionsRemaining" - 1
    FROM "Center" AS center
    WHERE instance."id" = ${instanceId}
      AND center."id" = instance."centerId"
      AND center."organizationId" = ${organizationId}
      AND instance."sessionsRemaining" > 0
      AND (instance."expiresAt" IS NULL OR instance."expiresAt" > CURRENT_TIMESTAMP)
    RETURNING instance."sessionsRemaining"
  `
  if (rows.length === 1) {
    return { success: true, sessionsRemaining: rows[0].sessionsRemaining }
  }

  const instance = await prisma.bonoInstance.findFirst({
    where: { id: instanceId, bono: { center: { organizationId } } },
    select: { sessionsRemaining: true, expiresAt: true },
  })
  if (!instance) return { success: false, reason: 'NOT_FOUND' }
  if (instance.expiresAt && instance.expiresAt <= new Date()) {
    return { success: false, reason: 'EXPIRED' }
  }
  return { success: false, reason: 'EMPTY' }
}
