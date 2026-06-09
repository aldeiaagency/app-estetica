import type { Plan } from '@prisma/client'

export interface PlanFeatures {
  maxCenters: number
  maxServicesPerCenter: number
  maxStaffPerCenter: number
  hasBookingDeposit: boolean
  hasBonos: boolean
  hasProducts: boolean
  hasPromotions: boolean
  hasReviews: boolean
  hasWaitlist: boolean
  hasCRM: boolean
  hasMultiCenter: boolean
  hasFeaturedListing: boolean
  hasWhiteLabelOption: boolean
  hasApiAccess: boolean
  hasAI: boolean
  notificationChannels: ('email' | 'sms' | 'whatsapp')[]
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  BASIC: {
    maxCenters: 1,
    maxServicesPerCenter: 10,
    maxStaffPerCenter: 3,
    hasBookingDeposit: false,
    hasBonos: false,
    hasProducts: false,
    hasPromotions: false,
    hasReviews: false,
    hasWaitlist: false,
    hasCRM: false,
    hasMultiCenter: false,
    hasFeaturedListing: false,
    hasWhiteLabelOption: false,
    hasApiAccess: false,
    hasAI: false,
    notificationChannels: ['email'],
  },
  PRO: {
    maxCenters: 1,
    maxServicesPerCenter: -1,
    maxStaffPerCenter: -1,
    hasBookingDeposit: true,
    hasBonos: true,
    hasProducts: true,
    hasPromotions: true,
    hasReviews: true,
    hasWaitlist: true,
    hasCRM: false,
    hasMultiCenter: false,
    hasFeaturedListing: false,
    hasWhiteLabelOption: false,
    hasApiAccess: false,
    hasAI: true,
    notificationChannels: ['email'],
  },
  GROWTH: {
    maxCenters: 3,
    maxServicesPerCenter: -1,
    maxStaffPerCenter: -1,
    hasBookingDeposit: true,
    hasBonos: true,
    hasProducts: true,
    hasPromotions: true,
    hasReviews: true,
    hasWaitlist: true,
    hasCRM: true,
    hasMultiCenter: true,
    hasFeaturedListing: true,
    hasWhiteLabelOption: false,
    hasApiAccess: false,
    hasAI: true,
    notificationChannels: ['email'],
  },
  PREMIUM: {
    maxCenters: -1,
    maxServicesPerCenter: -1,
    maxStaffPerCenter: -1,
    hasBookingDeposit: true,
    hasBonos: true,
    hasProducts: true,
    hasPromotions: true,
    hasReviews: true,
    hasWaitlist: true,
    hasCRM: true,
    hasMultiCenter: true,
    hasFeaturedListing: true,
    hasWhiteLabelOption: true,
    hasApiAccess: true,
    hasAI: true,
    notificationChannels: ['email', 'sms', 'whatsapp'],
  },
}

export const PLAN_PRICES_CENTS: Record<Plan, { monthly: number; annual: number }> = {
  BASIC: { monthly: 2400, annual: 24000 },   // 24€/mes, 200€/año
  PRO: { monthly: 5900, annual: 59000 },     // 59€/mes, 490€/año
  GROWTH: { monthly: 14900, annual: 149000 }, // 149€/mes, 1.240€/año
  PREMIUM: { monthly: 39900, annual: 399000 },// 399€/mes, 3.300€/año
}

export function canUsePlanFeature<K extends keyof PlanFeatures>(
  plan: Plan,
  feature: K
): PlanFeatures[K] {
  return PLAN_FEATURES[plan][feature]
}

export function getPlanUpgrade(current: Plan): Plan | null {
  const order: Plan[] = ['BASIC', 'PRO', 'GROWTH', 'PREMIUM']
  const idx = order.indexOf(current)
  return idx < order.length - 1 ? order[idx + 1] : null
}
