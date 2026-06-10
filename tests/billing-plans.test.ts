import { describe, it, expect } from 'vitest'
import {
  PLAN_FEATURES,
  PLAN_PRICES_CENTS,
  canUsePlanFeature,
  getPlanUpgrade,
} from '@/lib/billing/plans'

const PLANS = ['BASIC', 'PRO', 'GROWTH', 'PREMIUM'] as const

describe('PLAN_FEATURES integrity', () => {
  it('defines all 4 plans', () => {
    for (const plan of PLANS) {
      expect(PLAN_FEATURES[plan]).toBeDefined()
    }
  })

  it('BASIC has most restrictive limits', () => {
    const basic = PLAN_FEATURES.BASIC
    expect(basic.maxCenters).toBe(1)
    expect(basic.maxServicesPerCenter).toBe(10)
    expect(basic.maxStaffPerCenter).toBe(3)
    expect(basic.hasAI).toBe(false)
    expect(basic.hasCRM).toBe(false)
  })

  it('PREMIUM has all features enabled', () => {
    const premium = PLAN_FEATURES.PREMIUM
    expect(premium.hasAI).toBe(true)
    expect(premium.hasCRM).toBe(true)
    expect(premium.hasMultiCenter).toBe(true)
    expect(premium.hasWhiteLabelOption).toBe(true)
    expect(premium.hasApiAccess).toBe(true)
    expect(premium.maxCenters).toBe(-1)
  })

  it('PRO and higher have AI enabled', () => {
    for (const plan of ['PRO', 'GROWTH', 'PREMIUM'] as const) {
      expect(PLAN_FEATURES[plan].hasAI).toBe(true)
    }
  })

  it('GROWTH and higher have CRM and multi-center', () => {
    for (const plan of ['GROWTH', 'PREMIUM'] as const) {
      expect(PLAN_FEATURES[plan].hasCRM).toBe(true)
      expect(PLAN_FEATURES[plan].hasMultiCenter).toBe(true)
    }
  })

  it('all plans have email notification channel', () => {
    for (const plan of PLANS) {
      expect(PLAN_FEATURES[plan].notificationChannels).toContain('email')
    }
  })

  it('only PREMIUM has SMS and WhatsApp', () => {
    for (const plan of ['BASIC', 'PRO', 'GROWTH'] as const) {
      expect(PLAN_FEATURES[plan].notificationChannels).not.toContain('sms')
    }
    expect(PLAN_FEATURES.PREMIUM.notificationChannels).toContain('sms')
    expect(PLAN_FEATURES.PREMIUM.notificationChannels).toContain('whatsapp')
  })
})

describe('PLAN_PRICES_CENTS', () => {
  it('defines monthly and annual prices for all plans', () => {
    for (const plan of PLANS) {
      expect(PLAN_PRICES_CENTS[plan].monthly).toBeGreaterThan(0)
      expect(PLAN_PRICES_CENTS[plan].annual).toBeGreaterThan(0)
    }
  })

  it('prices increase from BASIC to PREMIUM', () => {
    const monthly = PLANS.map(p => PLAN_PRICES_CENTS[p].monthly)
    for (let i = 1; i < monthly.length; i++) {
      expect(monthly[i]).toBeGreaterThan(monthly[i - 1])
    }
  })

  it('BASIC is 24 euros/month', () => {
    expect(PLAN_PRICES_CENTS.BASIC.monthly).toBe(2400)
  })
})

describe('canUsePlanFeature', () => {
  it('returns correct boolean feature for BASIC', () => {
    expect(canUsePlanFeature('BASIC', 'hasAI')).toBe(false)
    expect(canUsePlanFeature('BASIC', 'hasBonos')).toBe(false)
  })
  it('returns correct boolean feature for PRO', () => {
    expect(canUsePlanFeature('PRO', 'hasAI')).toBe(true)
    expect(canUsePlanFeature('PRO', 'hasBonos')).toBe(true)
  })
  it('returns correct numeric feature', () => {
    expect(canUsePlanFeature('BASIC', 'maxCenters')).toBe(1)
    expect(canUsePlanFeature('PREMIUM', 'maxCenters')).toBe(-1)
  })
})

describe('getPlanUpgrade', () => {
  it('returns next plan for upgradeable plans', () => {
    expect(getPlanUpgrade('BASIC')).toBe('PRO')
    expect(getPlanUpgrade('PRO')).toBe('GROWTH')
    expect(getPlanUpgrade('GROWTH')).toBe('PREMIUM')
  })
  it('returns null for PREMIUM (no higher plan)', () => {
    expect(getPlanUpgrade('PREMIUM')).toBeNull()
  })
})
