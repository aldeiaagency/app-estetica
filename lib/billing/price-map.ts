import type { Plan } from '@prisma/client'

export const PRICE_ID_TO_PLAN: Record<string, Plan> = {}
export const PLAN_TO_PRICE_ID: Partial<Record<Plan, string>> = {}

const entries: [string, Plan][] = [
  [process.env.STRIPE_PRICE_BASIC_MONTHLY  ?? '', 'BASIC'],
  [process.env.STRIPE_PRICE_PRO_MONTHLY    ?? '', 'PRO'],
  [process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? '', 'GROWTH'],
  [process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? '', 'PREMIUM'],
]

for (const [priceId, plan] of entries) {
  if (priceId) {
    PRICE_ID_TO_PLAN[priceId] = plan
    PLAN_TO_PRICE_ID[plan] = priceId
  }
}
