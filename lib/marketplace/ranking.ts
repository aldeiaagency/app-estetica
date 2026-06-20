import type { CenterCategory, Plan } from '@prisma/client'
import { PLAN_FEATURES } from '@/lib/billing/plans'
import {
  BEAUTY_AREA_LABELS,
  type BeautyArea,
  type BeautyProfileWithGoals,
} from '@/lib/beauty/recommendations'
import { CATEGORY_LABELS } from '@/lib/utils'

export type MarketplaceCenterForRanking = {
  id: string
  name: string
  description: string | null
  category: CenterCategory
  coverImage?: string | null
  services: {
    name: string
    description?: string | null
    priceCents: number
    durationMinutes?: number | null
  }[]
  reviews: { rating: number }[]
  featuredListings?: { priority: number }[]
  organization?: { plan: Plan } | null
  _count: {
    reviews: number
    bookings: number
  }
}

export type MarketplaceCenterSignals = {
  score: number
  averageRating: number | null
  reviewCount: number
  bookingCount: number
  minPriceCents: number | null
  hasClearPrice: boolean
  hasBenefit: boolean
  hasPack: boolean
  hasFollowUp: boolean
  recommended: boolean
  featuredEligible: boolean
  qualityMinimum: boolean
  reasons: string[]
  idealFor: string
}

export type RankedMarketplaceCenter<T extends MarketplaceCenterForRanking> = {
  center: T
  signals: MarketplaceCenterSignals
}

type RankingContext = {
  profile?: BeautyProfileWithGoals | null
  benefitCenterIds?: Set<string>
  packCountByCenter?: Map<string, number>
  query?: string
}

const AREA_CATEGORY_MATCHES: Record<BeautyArea, CenterCategory[]> = {
  SKIN: ['ESTETICA', 'SPA', 'COSMETICA', 'BELLEZA_INTEGRAL'],
  HAIR: ['PELUQUERIA', 'BELLEZA_INTEGRAL'],
  NAILS: ['UNAS', 'BELLEZA_INTEGRAL'],
  BROWS_LASHES: ['CEJAS_PESTANAS', 'BELLEZA_INTEGRAL'],
  MAKEUP: ['COSMETICA', 'BELLEZA_INTEGRAL'],
  BODY: ['ESTETICA', 'DEPILACION', 'MASAJES', 'SPA', 'BELLEZA_INTEGRAL'],
  WELLNESS: ['MASAJES', 'SPA', 'BELLEZA_INTEGRAL'],
}

const AREA_KEYWORDS: Record<BeautyArea, string[]> = {
  SKIN: ['facial', 'piel', 'limpieza', 'peeling', 'hidratacion', 'estetica'],
  HAIR: ['pelo', 'cabello', 'capilar', 'corte', 'color', 'mechas', 'tratamiento'],
  NAILS: ['unas', 'manicura', 'pedicura', 'semipermanente'],
  BROWS_LASHES: ['cejas', 'pestanas', 'mirada', 'lifting'],
  MAKEUP: ['maquillaje', 'makeup', 'evento'],
  BODY: ['corporal', 'depilacion', 'masaje', 'maderoterapia', 'cuerpo'],
  WELLNESS: ['spa', 'bienestar', 'masaje', 'relax', 'ritual'],
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function averageRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) return null
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
}

function minPrice(services: MarketplaceCenterForRanking['services']) {
  if (services.length === 0) return null
  return Math.min(...services.map(service => service.priceCents))
}

function getMatchedArea(center: MarketplaceCenterForRanking, profile?: BeautyProfileWithGoals | null) {
  if (!profile) return null

  const text = normalizeText([
    center.name,
    center.description,
    ...center.services.flatMap(service => [service.name, service.description]),
  ].filter(Boolean).join(' '))

  return profile.goals
    .filter(goal => goal.active)
    .map(goal => goal.area)
    .find(area => (
      AREA_CATEGORY_MATCHES[area].includes(center.category) ||
      AREA_KEYWORDS[area].some(keyword => text.includes(normalizeText(keyword)))
    )) ?? null
}

function priceFitsProfile(minPriceCents: number | null, profile?: BeautyProfileWithGoals | null) {
  if (!minPriceCents || !profile?.monthlyBudgetCents) return false
  return minPriceCents <= profile.monthlyBudgetCents
}

function buildIdealFor(params: {
  center: MarketplaceCenterForRanking
  matchedArea: BeautyArea | null
  hasPack: boolean
  hasBenefit: boolean
  hasClearPrice: boolean
}) {
  if (params.matchedArea) {
    return `Ideal si priorizas ${BEAUTY_AREA_LABELS[params.matchedArea].toLowerCase()} y quieres comparar opciones con mas contexto.`
  }

  if (params.hasPack) {
    return 'Ideal si quieres un plan cerrado por objetivo antes de reservar.'
  }

  if (params.hasBenefit) {
    return 'Ideal si valoras beneficios activos o ventajas para repetir.'
  }

  if (params.hasClearPrice) {
    return 'Ideal si quieres decidir con precio visible desde el primer vistazo.'
  }

  return `Ideal para explorar ${CATEGORY_LABELS[params.center.category]?.toLowerCase() ?? 'servicios de belleza'} en tu zona.`
}

function buildSignals(center: MarketplaceCenterForRanking, context: RankingContext): MarketplaceCenterSignals {
  const average = averageRating(center.reviews)
  const reviewCount = center._count.reviews
  const bookingCount = center._count.bookings
  const minPriceCents = minPrice(center.services)
  const hasClearPrice = minPriceCents !== null
  const hasBenefit = context.benefitCenterIds?.has(center.id) ?? false
  const hasPack = (context.packCountByCenter?.get(center.id) ?? 0) > 0
  const hasFollowUp = center.organization ? PLAN_FEATURES[center.organization.plan].hasCRM : false
  const matchedArea = getMatchedArea(center, context.profile)
  const recommended = Boolean(matchedArea)
  const qualityMinimum = hasClearPrice && (
    bookingCount >= 3 ||
    reviewCount >= 2 ||
    (average !== null && average >= 4)
  )
  const featuredPriority = center.featuredListings?.reduce((max, listing) => Math.max(max, listing.priority), 0) ?? 0
  const featuredEligible = featuredPriority > 0 &&
    Boolean(center.organization && PLAN_FEATURES[center.organization.plan].hasFeaturedListing) &&
    qualityMinimum

  let score = 0
  score += recommended ? 24 : 0
  score += hasClearPrice ? 10 : 0
  score += hasBenefit ? 7 : 0
  score += hasPack ? 7 : 0
  score += hasFollowUp ? 5 : 0
  score += priceFitsProfile(minPriceCents, context.profile) ? 5 : 0
  score += average !== null ? Math.min(12, average * 2.4) : 0
  score += reviewCount >= 10 ? 7 : reviewCount >= 3 ? 5 : reviewCount > 0 ? 2 : 0
  score += Math.min(8, Math.log10(bookingCount + 1) * 5)
  score += center.coverImage ? 2 : 0
  score += featuredEligible ? Math.min(8, 4 + featuredPriority) : 0

  const query = normalizeText(context.query)
  if (query) {
    const searchable = normalizeText([
      center.name,
      center.description,
      ...center.services.flatMap(service => [service.name, service.description]),
    ].filter(Boolean).join(' '))
    score += searchable.includes(query) ? 8 : 0
  }

  const reasons = [
    recommended && matchedArea ? `Encaja con tu objetivo de ${BEAUTY_AREA_LABELS[matchedArea].toLowerCase()}` : null,
    hasClearPrice ? 'Precio visible' : null,
    hasPack ? 'Tiene packs por objetivo' : null,
    hasBenefit ? 'Beneficio activo' : null,
    hasFollowUp ? 'Seguimiento disponible' : null,
    reviewCount > 0 ? `${reviewCount} resena${reviewCount === 1 ? '' : 's'} verificadas` : null,
  ].filter(Boolean).slice(0, 4) as string[]

  return {
    score,
    averageRating: average,
    reviewCount,
    bookingCount,
    minPriceCents,
    hasClearPrice,
    hasBenefit,
    hasPack,
    hasFollowUp,
    recommended,
    featuredEligible,
    qualityMinimum,
    reasons,
    idealFor: buildIdealFor({ center, matchedArea, hasPack, hasBenefit, hasClearPrice }),
  }
}

export function rankMarketplaceCenters<T extends MarketplaceCenterForRanking>(
  centers: T[],
  context: RankingContext = {}
): RankedMarketplaceCenter<T>[] {
  return centers
    .map(center => ({ center, signals: buildSignals(center, context) }))
    .sort((a, b) => (
      b.signals.score - a.signals.score ||
      (b.signals.averageRating ?? 0) - (a.signals.averageRating ?? 0) ||
      b.signals.reviewCount - a.signals.reviewCount ||
      b.signals.bookingCount - a.signals.bookingCount ||
      a.center.name.localeCompare(b.center.name)
    ))
}
