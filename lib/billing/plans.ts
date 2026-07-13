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

export interface PlanMarketing {
  name: string
  technicalName: Plan
  slug: string
  tagline: string
  description: string
  idealFor: string
  cta: string
  featured: boolean
  contactSales?: boolean
  highlights: string[]
}

export const PLAN_ORDER: Plan[] = ['BASIC', 'PRO', 'GROWTH', 'PREMIUM']

export const PLAN_MARKETING: Record<Plan, PlanMarketing> = {
  BASIC: {
    name: 'Presencia',
    technicalName: 'BASIC',
    slug: 'presencia',
    tagline: 'Para aparecer con criterio',
    description: 'Perfil publico, agenda y base operativa para empezar a captar clientas sin depender solo de redes.',
    idealFor: 'Negocios pequenos que quieren ordenar su presencia y aceptar reservas online.',
    cta: 'Empezar con Presencia',
    featured: false,
    highlights: [
      'Perfil en Belleza Local',
      'Reservas online y confirmaciones por email',
      'Marketplace de productos con ofertas y pago en el centro',
      'Recordatorios por WhatsApp compartido',
      'Hasta 10 servicios y 3 profesionales',
      'Base preparada para crecer a seguimiento',
    ],
  },
  PRO: {
    name: 'Growth',
    technicalName: 'PRO',
    slug: 'growth',
    tagline: 'Para convertir clientas en recurrentes',
    description: 'Packs, beneficios, productos y seguimiento postservicio para aumentar repeticion sin mensajes improvisados.',
    idealFor: 'Centros que ya tienen demanda y quieren mejorar recurrencia, ticket medio y recompra.',
    cta: 'Activar Growth',
    featured: true,
    highlights: [
      'Packs por objetivo y bonos',
      'Productos, rutina y reposicion',
      'Beneficios para fidelizar clientas',
      'Lista de espera y seguimiento basico',
    ],
  },
  GROWTH: {
    name: 'Elite',
    technicalName: 'GROWTH',
    slug: 'elite',
    tagline: 'Para equipos con operativa comercial',
    description: 'CRM, campanas, recurrencia avanzada y multi-centro para gestionar crecimiento con mas control.',
    idealFor: 'Centros con equipo, cartera activa y necesidad de medir oportunidades de vuelta.',
    cta: 'Subir a Elite',
    featured: false,
    highlights: [
      'Hasta 3 centros',
      'CRM y campanas segmentadas',
      'Oportunidades de rebooking',
      'Prioridad comercial en marketplace',
    ],
  },
  PREMIUM: {
    name: 'Partner',
    technicalName: 'PREMIUM',
    slug: 'partner',
    tagline: 'Para grupos y acuerdos a medida',
    description: 'Capacidades avanzadas, integraciones y acompanamiento para operar varios centros con soporte cercano.',
    idealFor: 'Grupos, franquicias o partners con necesidades de integracion, datos y soporte dedicado.',
    cta: 'Hablar con ventas',
    featured: false,
    contactSales: true,
    highlights: [
      'Centros ilimitados',
      'White-label e integraciones API',
      'Canales avanzados segun disponibilidad',
      'Acompanamiento de implantacion',
    ],
  },
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  BASIC: {
    maxCenters: 1,
    maxServicesPerCenter: 10,
    maxStaffPerCenter: 3,
    hasBookingDeposit: false,
    hasBonos: false,
    hasProducts: true,
    hasPromotions: true,
    hasReviews: false,
    hasWaitlist: false,
    hasCRM: false,
    hasMultiCenter: false,
    hasFeaturedListing: false,
    hasWhiteLabelOption: false,
    hasApiAccess: false,
    hasAI: false,
    notificationChannels: ['email', 'whatsapp'],
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
    hasCRM: true,
    hasMultiCenter: false,
    hasFeaturedListing: false,
    hasWhiteLabelOption: false,
    hasApiAccess: false,
    hasAI: true,
    notificationChannels: ['email', 'whatsapp'],
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
    notificationChannels: ['email', 'whatsapp'],
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
  BASIC: { monthly: 2400, annual: 24000 },
  PRO: { monthly: 5900, annual: 59000 },
  GROWTH: { monthly: 14900, annual: 149000 },
  PREMIUM: { monthly: 39900, annual: 399000 },
}

export function canUsePlanFeature<K extends keyof PlanFeatures>(
  plan: Plan,
  feature: K
): PlanFeatures[K] {
  return PLAN_FEATURES[plan][feature]
}

export function getPlanUpgrade(current: Plan): Plan | null {
  const idx = PLAN_ORDER.indexOf(current)
  return idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1] : null
}

export function getPlanPublicName(plan: Plan) {
  return PLAN_MARKETING[plan].name
}

export function getPlanBySlug(slug: string | null | undefined): Plan | null {
  if (!slug) return null
  return PLAN_ORDER.find(plan => PLAN_MARKETING[plan].slug === slug.toLowerCase()) ?? null
}
