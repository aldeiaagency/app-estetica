export const BEAUTY_AREAS = ['SKIN', 'HAIR', 'NAILS', 'BROWS_LASHES', 'MAKEUP', 'BODY', 'WELLNESS'] as const
export const SKIN_TYPES = ['DRY', 'OILY', 'COMBINATION', 'SENSITIVE', 'NORMAL', 'UNKNOWN'] as const
export const HAIR_TYPES = ['STRAIGHT', 'WAVY', 'CURLY', 'COILY', 'FINE', 'THICK', 'COLORED', 'DAMAGED', 'UNKNOWN'] as const
export const BEAUTY_STYLES = ['NATURAL', 'ELEGANT', 'BOLD', 'MINIMAL', 'PREMIUM', 'PRACTICAL'] as const
export const MAINTENANCE_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const
export const PRICE_SENSITIVITIES = ['LOW', 'MEDIUM', 'HIGH'] as const
export const BUYING_MOTIVATIONS = ['ROUTINE', 'EVENT', 'PROBLEM_SOLVING', 'SELF_CARE', 'IMPULSE', 'RECOMMENDATION'] as const
export const BEAUTY_FEARS = ['WASTING_MONEY', 'LOOKING_ARTIFICIAL', 'NOT_KNOWING_WHAT_TO_CHOOSE', 'BAD_EXPERIENCE', 'TOO_MUCH_MAINTENANCE', 'IRRITATION_OR_REACTION'] as const

export type BeautyArea = typeof BEAUTY_AREAS[number]
export type SkinType = typeof SKIN_TYPES[number]
export type HairType = typeof HAIR_TYPES[number]
export type BeautyStyle = typeof BEAUTY_STYLES[number]
export type MaintenanceLevel = typeof MAINTENANCE_LEVELS[number]
export type PriceSensitivity = typeof PRICE_SENSITIVITIES[number]
export type BuyingMotivation = typeof BUYING_MOTIVATIONS[number]
export type BeautyFear = typeof BEAUTY_FEARS[number]

export type BeautyGoalRecord = {
  id: string
  profileId: string
  area: BeautyArea
  objective: string
  priority: number
  active: boolean
  createdAt: Date
}

export type BeautyProfileWithGoals = {
  id: string
  userId: string
  skinType: SkinType | null
  hairType: HairType | null
  beautyStyle: BeautyStyle | null
  monthlyBudgetCents: number | null
  maintenanceLevel: MaintenanceLevel | null
  mainConcern: string | null
  secondaryConcern: string | null
  priceSensitivity: PriceSensitivity | null
  buyingMotivation: BuyingMotivation | null
  fear: BeautyFear | null
  consentPersonalizationAt: Date | null
  profileCompletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  goals: BeautyGoalRecord[]
}

export type BeautyPlanRecommendation = {
  id: string
  title: string
  reason: string
  estimate: string
  href: string
  hrefLabel: string
  tag: string
}

export type BeautyPlanAvoid = {
  id: string
  title: string
  reason: string
}

export type GeneratedBeautyPlan = {
  monthLabel: string
  priority: string
  summary: string
  budgetLabel: string
  maintenanceLabel: string
  recommendations: BeautyPlanRecommendation[]
  avoid: BeautyPlanAvoid[]
  nextSteps: string[]
}

export const BEAUTY_AREA_LABELS: Record<BeautyArea, string> = {
  SKIN: 'Piel',
  HAIR: 'Cabello',
  NAILS: 'Uñas',
  BROWS_LASHES: 'Cejas y pestañas',
  MAKEUP: 'Maquillaje',
  BODY: 'Cuerpo',
  WELLNESS: 'Bienestar',
}

export const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  DRY: 'seca',
  OILY: 'grasa',
  COMBINATION: 'mixta',
  SENSITIVE: 'sensible',
  NORMAL: 'normal',
  UNKNOWN: 'sin definir',
}

export const HAIR_TYPE_LABELS: Record<HairType, string> = {
  STRAIGHT: 'liso',
  WAVY: 'ondulado',
  CURLY: 'rizado',
  COILY: 'muy rizado',
  FINE: 'fino',
  THICK: 'grueso',
  COLORED: 'coloreado',
  DAMAGED: 'castigado',
  UNKNOWN: 'sin definir',
}

export const BEAUTY_STYLE_LABELS: Record<BeautyStyle, string> = {
  NATURAL: 'natural',
  ELEGANT: 'elegante',
  BOLD: 'atrevido',
  MINIMAL: 'minimalista',
  PREMIUM: 'premium',
  PRACTICAL: 'practico',
}

export const MAINTENANCE_LABELS: Record<MaintenanceLevel, string> = {
  LOW: 'bajo mantenimiento',
  MEDIUM: 'mantenimiento medio',
  HIGH: 'mantenimiento alto',
}

export const PRICE_SENSITIVITY_LABELS: Record<PriceSensitivity, string> = {
  LOW: 'premium si merece la pena',
  MEDIUM: 'equilibrado',
  HIGH: 'precio ajustado',
}

export const BEAUTY_FEAR_LABELS: Record<BeautyFear, string> = {
  WASTING_MONEY: 'gastar de más',
  LOOKING_ARTIFICIAL: 'verte artificial',
  NOT_KNOWING_WHAT_TO_CHOOSE: 'elegir mal',
  BAD_EXPERIENCE: 'repetir una mala experiencia',
  TOO_MUCH_MAINTENANCE: 'necesitar demasiado mantenimiento',
  IRRITATION_OR_REACTION: 'que tu piel reaccione a cosmeticos',
}

const SEARCH_BY_AREA: Record<BeautyArea, string> = {
  SKIN: 'limpieza facial',
  HAIR: 'tratamiento capilar',
  NAILS: 'manicura',
  BROWS_LASHES: 'cejas pestañas',
  MAKEUP: 'maquillaje',
  BODY: 'tratamiento corporal',
  WELLNESS: 'masaje bienestar',
}

function formatMonth(date = new Date()) {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

export function formatBudgetLabel(cents?: number | null) {
  if (!cents) return 'Presupuesto por definir'
  if (cents <= 4000) return 'Menos de 40 € este mes'
  if (cents <= 8000) return '40-80 € este mes'
  if (cents <= 15000) return '80-150 € este mes'
  return 'Más de 150 € este mes'
}

function getMainArea(profile: BeautyProfileWithGoals): BeautyArea {
  return profile.goals.find(goal => goal.active)?.area ?? 'SKIN'
}

function getConcern(profile: BeautyProfileWithGoals) {
  return profile.mainConcern?.trim() || 'verte mejor sin complicarte'
}

function getMaintenance(profile: BeautyProfileWithGoals) {
  return profile.maintenanceLevel
    ? MAINTENANCE_LABELS[profile.maintenanceLevel]
    : 'mantenimiento sencillo'
}

function getBudgetReason(profile: BeautyProfileWithGoals) {
  return profile.monthlyBudgetCents ? `tu presupuesto es ${formatBudgetLabel(profile.monthlyBudgetCents).toLowerCase()}` : 'quieres decidir el gasto antes de reservar'
}

function byAreaRecommendation(profile: BeautyProfileWithGoals, area: BeautyArea): BeautyPlanRecommendation {
  const concern = getConcern(profile)
  const maintenance = getMaintenance(profile)
  const budget = getBudgetReason(profile)

  if (area === 'HAIR') {
    return {
      id: 'hair-care',
      title: 'Asesoria capilar y cuidado de mantenimiento',
      reason: `Encaja porque buscas ${concern}, prefieres ${maintenance} y ${budget}.`,
      estimate: 'Estimacion: 35-75 €',
      href: `/buscar?q=${encodeURIComponent(SEARCH_BY_AREA.HAIR)}`,
      hrefLabel: 'Buscar centros de cabello',
      tag: 'Cabello',
    }
  }

  if (area === 'NAILS') {
    return {
      id: 'nail-care',
      title: 'Manicura cuidada con plan de mantenimiento',
      reason: `Encaja porque buscas ${concern}, quieres algo visible y ${budget}.`,
      estimate: 'Estimacion: 18-45 €',
      href: `/buscar?categoria=UNAS`,
      hrefLabel: 'Ver centros de uñas',
      tag: 'Uñas',
    }
  }

  if (area === 'BROWS_LASHES') {
    return {
      id: 'brows-lashes',
      title: 'Diseño de cejas o lifting de pestañas natural',
      reason: `Encaja porque mejora la expresion sin cambiar tu estilo y respeta un enfoque de ${maintenance}.`,
      estimate: 'Estimacion: 20-60 €',
      href: `/buscar?categoria=CEJAS_PESTANAS`,
      hrefLabel: 'Buscar cejas y pestañas',
      tag: 'Mirada',
    }
  }

  if (area === 'BODY' || area === 'WELLNESS') {
    return {
      id: 'wellness-care',
      title: 'Ritual de bienestar o masaje suave',
      reason: `Encaja porque priorizas autocuidado, buscas ${concern} y no requiere una rutina diaria complicada.`,
      estimate: 'Estimacion: 35-80 €',
      href: `/buscar?q=${encodeURIComponent(SEARCH_BY_AREA[area])}`,
      hrefLabel: 'Buscar bienestar',
      tag: 'Bienestar',
    }
  }

  if (area === 'MAKEUP') {
    return {
      id: 'makeup-event',
      title: 'Asesoria de maquillaje practico',
      reason: `Encaja porque te ayuda a elegir mejor antes de comprar productos y se ajusta a ${budget}.`,
      estimate: 'Estimacion: 30-70 €',
      href: `/buscar?q=${encodeURIComponent(SEARCH_BY_AREA.MAKEUP)}`,
      hrefLabel: 'Buscar maquillaje',
      tag: 'Maquillaje',
    }
  }

  return {
    id: 'skin-glow',
    title: 'Limpieza facial suave o glow express',
    reason: `Encaja porque buscas ${concern}, prefieres ${maintenance} y ${budget}.`,
    estimate: 'Estimacion: 35-85 €',
    href: `/buscar?q=${encodeURIComponent(SEARCH_BY_AREA.SKIN)}`,
    hrefLabel: 'Buscar centros faciales',
    tag: 'Piel',
  }
}

function routineRecommendation(profile: BeautyProfileWithGoals, area: BeautyArea): BeautyPlanRecommendation {
  if (area === 'HAIR') {
    return {
      id: 'hair-routine',
      title: 'Rutina capilar de 2 pasos para mantener resultado',
      reason: 'Tiene sentido porque una rutina corta es más facil de sostener que cambiar muchos productos a la vez.',
      estimate: 'Producto recomendado: 12-35 €',
      href: '/productos?q=mascarilla%20capilar',
      hrefLabel: 'Ver productos capilares',
      tag: 'Rutina',
    }
  }

  return {
    id: 'skin-routine',
    title: 'Rutina minima: limpiar, hidratar y proteger',
    reason: `Tiene sentido porque tu estilo es ${profile.beautyStyle ? BEAUTY_STYLE_LABELS[profile.beautyStyle] : 'practico'} y reduce compras innecesarias.`,
    estimate: 'Producto recomendado: 10-35 €',
    href: '/productos?q=hidratante',
    hrefLabel: 'Ver productos para rutina',
    tag: 'Rutina',
  }
}

function buildAvoid(profile: BeautyProfileWithGoals, area: BeautyArea): BeautyPlanAvoid[] {
  const avoid: BeautyPlanAvoid[] = []

  avoid.push({
    id: 'avoid-overbuying',
    title: 'No compres una rutina larga de golpe',
    reason: 'Primero conviene validar 2 o 3 pasos constantes. Comprar demasiado aumenta gasto y hace mas dificil saber que funciona para ti.',
  })

  if (area === 'SKIN' || profile.skinType === 'SENSITIVE') {
    avoid.push({
      id: 'avoid-strong-actives',
      title: 'Evita activos fuertes sin acompañamiento',
      reason: 'Si buscas una piel mas cuidada, es mejor introducir cambios poco a poco y con precio visible antes de reservar o comprar.',
    })
  }

  if (profile.fear === 'LOOKING_ARTIFICIAL') {
    avoid.push({
      id: 'avoid-radical-change',
      title: 'Evita cambios radicales esta semana',
      reason: 'Has indicado que te preocupa verte artificial, asi que priorizamos resultados naturales y reversibles.',
    })
  }

  return avoid.slice(0, 3)
}

export function generateBeautyPlan(profile: BeautyProfileWithGoals): GeneratedBeautyPlan {
  const area = getMainArea(profile)
  const areaLabel = BEAUTY_AREA_LABELS[area]
  const concern = getConcern(profile)
  const maintenance = getMaintenance(profile)
  const recommendations = [
    byAreaRecommendation(profile, area),
    routineRecommendation(profile, area),
  ]

  return {
    monthLabel: formatMonth(),
    priority: `${areaLabel}: ${concern}`,
    summary: `Este mes priorizamos una mejora visible y realista, con ${maintenance} y decisiones de compra más claras.`,
    budgetLabel: formatBudgetLabel(profile.monthlyBudgetCents),
    maintenanceLabel: maintenance,
    recommendations,
    avoid: buildAvoid(profile, area),
    nextSteps: [
      'Elige una accion principal para esta semana.',
      'Revisa precio y motivo antes de reservar o comprar.',
      'Vuelve a tu plan cuando quieras ajustar presupuesto o prioridad.',
    ],
  }
}
