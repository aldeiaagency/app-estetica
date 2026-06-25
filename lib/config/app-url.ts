const TEMP_PUBLIC_APP_URL = 'https://app-estetica-one.vercel.app'
const STALE_PUBLIC_URLS = new Set([
  'https://app-estetica.vercel.app',
])

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, '')
}

export function getPublicAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || TEMP_PUBLIC_APP_URL
  const normalized = normalizeUrl(raw)
  return STALE_PUBLIC_URLS.has(normalized) ? TEMP_PUBLIC_APP_URL : normalized
}
