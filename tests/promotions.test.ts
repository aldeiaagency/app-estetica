import { describe, expect, it } from 'vitest'
import { calculatePromotion, chooseBestPromotion, normalizeCouponCode, type PromotionRule } from '@/lib/marketplace/promotions'

const basePromotion: PromotionRule = {
  id: 'promotion-1',
  scope: 'PRODUCT',
  code: null,
  discountType: 'PERCENTAGE',
  discountValue: 10,
  minimumOrderCents: null,
  maxDiscountCents: null,
  maxUses: null,
  usedCount: 0,
  perCustomerLimit: 1,
  productIds: ['product-1'],
  categoryId: null,
  startsAt: new Date('2026-01-01T00:00:00Z'),
  endsAt: new Date('2026-12-31T23:59:59Z'),
  active: true,
}

describe('marketplace promotions', () => {
  it('calculates a product percentage discount only on eligible lines', () => {
    const result = calculatePromotion(basePromotion, [
      { productId: 'product-1', categoryId: null, unitPriceCents: 1000, quantity: 2 },
      { productId: 'product-2', categoryId: null, unitPriceCents: 500, quantity: 1 },
    ], new Date('2026-06-01T12:00:00Z'))

    expect(result?.eligibleSubtotalCents).toBe(2000)
    expect(result?.discountCents).toBe(200)
  })

  it('respects maximum discount and never goes below zero', () => {
    const result = calculatePromotion({
      ...basePromotion,
      discountType: 'FIXED_AMOUNT',
      discountValue: 5000,
      maxDiscountCents: 750,
    }, [{ productId: 'product-1', categoryId: null, unitPriceCents: 1000, quantity: 1 }], new Date('2026-06-01T12:00:00Z'))

    expect(result?.discountCents).toBe(750)
  })

  it('chooses the largest eligible non-stacking discount', () => {
    const small = calculatePromotion(basePromotion, [{ productId: 'product-1', categoryId: null, unitPriceCents: 1000, quantity: 1 }], new Date('2026-06-01T12:00:00Z'))!
    const large = calculatePromotion({ ...basePromotion, id: 'promotion-2', discountValue: 25 }, [{ productId: 'product-1', categoryId: null, unitPriceCents: 1000, quantity: 1 }], new Date('2026-06-01T12:00:00Z'))!

    expect(chooseBestPromotion([small, large])?.promotion.id).toBe('promotion-2')
  })

  it('normalizes coupon codes consistently', () => {
    expect(normalizeCouponCode('  belleza10 ')).toBe('BELLEZA10')
    expect(normalizeCouponCode('')).toBeNull()
  })
})
