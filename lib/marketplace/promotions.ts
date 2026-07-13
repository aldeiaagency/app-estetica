export type PromotionRule = {
  id: string
  scope: 'SERVICE' | 'PRODUCT' | 'CATEGORY' | 'ORDER'
  code: string | null
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minimumOrderCents: number | null
  maxDiscountCents: number | null
  maxUses: number | null
  usedCount: number
  perCustomerLimit: number
  productIds: string[]
  categoryId: string | null
  startsAt: Date
  endsAt: Date
  active: boolean
}

export type PromotionLine = {
  productId: string
  categoryId: string | null
  unitPriceCents: number
  quantity: number
}

export type PromotionResult = {
  promotion: PromotionRule
  discountCents: number
  eligibleSubtotalCents: number
}

function clampDiscount(value: number, subtotalCents: number, maxDiscountCents: number | null) {
  const capped = maxDiscountCents === null ? value : Math.min(value, maxDiscountCents)
  return Math.max(0, Math.min(capped, subtotalCents))
}

export function getEligibleSubtotal(promotion: PromotionRule, lines: PromotionLine[]) {
  if (promotion.scope === 'ORDER') {
    return lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  }

  if (promotion.scope === 'PRODUCT') {
    return lines
      .filter(line => promotion.productIds.includes(line.productId))
      .reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  }

  if (promotion.scope === 'CATEGORY' && promotion.categoryId) {
    return lines
      .filter(line => line.categoryId === promotion.categoryId)
      .reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  }

  return 0
}

export function calculatePromotion(
  promotion: PromotionRule,
  lines: PromotionLine[],
  now = new Date(),
): PromotionResult | null {
  if (!promotion.active || promotion.scope === 'SERVICE') return null
  if (now < promotion.startsAt || now > promotion.endsAt) return null

  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  if (promotion.minimumOrderCents !== null && subtotalCents < promotion.minimumOrderCents) return null

  const eligibleSubtotalCents = getEligibleSubtotal(promotion, lines)
  if (eligibleSubtotalCents <= 0) return null

  const rawDiscount = promotion.discountType === 'PERCENTAGE'
    ? Math.floor(eligibleSubtotalCents * promotion.discountValue / 100)
    : promotion.discountValue

  return {
    promotion,
    eligibleSubtotalCents,
    discountCents: clampDiscount(rawDiscount, eligibleSubtotalCents, promotion.maxDiscountCents),
  }
}

export function chooseBestPromotion(results: PromotionResult[]) {
  return results
    .filter(result => result.discountCents > 0)
    .sort((left, right) => right.discountCents - left.discountCents)[0] ?? null
}

export function normalizeCouponCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase()
  return normalized ? normalized.slice(0, 40) : null
}
