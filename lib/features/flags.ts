export type FeatureFlag =
  | 'marketplace'
  | 'products'
  | 'bonos'
  | 'beautyConcierge'
  | 'aiRecommendations'
  | 'campaigns'
  | 'followUps'
  | 'wallet'

const ENV_KEYS: Record<FeatureFlag, string> = {
  marketplace: 'FEATURE_MARKETPLACE',
  products: 'FEATURE_PRODUCTS',
  bonos: 'FEATURE_BONOS',
  beautyConcierge: 'FEATURE_BEAUTY_CONCIERGE',
  aiRecommendations: 'FEATURE_AI_RECOMMENDATIONS',
  campaigns: 'FEATURE_CAMPAIGNS',
  followUps: 'FEATURE_FOLLOW_UPS',
  wallet: 'FEATURE_WALLET',
}

const CORE_DEFAULTS: Record<FeatureFlag, boolean> = {
  marketplace: true,
  products: false,
  bonos: false,
  beautyConcierge: false,
  aiRecommendations: false,
  campaigns: false,
  followUps: true,
  wallet: false,
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const value = process.env[ENV_KEYS[flag]]
  if (value === undefined || value === '') return CORE_DEFAULTS[flag]
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

export function getFeatureFlags() {
  return Object.fromEntries(
    (Object.keys(ENV_KEYS) as FeatureFlag[]).map(flag => [flag, isFeatureEnabled(flag)]),
  ) as Record<FeatureFlag, boolean>
}

export const FEATURE_ROUTE_RULES: Array<{ prefixes: string[]; flag: FeatureFlag }> = [
  { prefixes: ['/productos', '/carrito', '/pedido', '/dashboard/productos', '/dashboard/pedidos'], flag: 'products' },
  { prefixes: ['/bono', '/dashboard/bonos'], flag: 'bonos' },
  { prefixes: ['/mi-perfil-belleza', '/mi-rutina', '/mi-plan'], flag: 'beautyConcierge' },
  { prefixes: ['/dashboard/campanas'], flag: 'campaigns' },
  { prefixes: ['/dashboard/seguimientos', '/dashboard/recurrencia'], flag: 'followUps' },
]
