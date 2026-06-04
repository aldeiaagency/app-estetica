import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'
const SITE_NAME = 'Belleza Local'

export function centerMetadata(center: {
  name: string
  description?: string | null
  addressCity: string
  coverImage?: string | null
  slug: string
  category: string
  averageRating?: number
  reviewCount?: number
}): Metadata {
  const title = `${center.name} — ${center.addressCity} | Reserva Online`
  const description =
    center.description?.slice(0, 160) ??
    `${center.name} en ${center.addressCity}. Reserva tu cita online en segundos. Disponibilidad real.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/centro/${center.slug}`,
      siteName: SITE_NAME,
      images: center.coverImage ? [{ url: center.coverImage }] : [],
      locale: 'es_ES',
      type: 'website',
    },
  }
}

export function localityPageMetadata(params: {
  city: string
  category?: string
  service?: string
  centerCount?: number
}): Metadata {
  const { city, category, service, centerCount } = params
  const cityFormatted = city.charAt(0).toUpperCase() + city.slice(1)

  let title: string
  let description: string

  if (service) {
    title = `${service} en ${cityFormatted} — Centros y Precios | ${SITE_NAME}`
    description = `Encuentra los mejores centros de ${service.toLowerCase()} en ${cityFormatted}.${centerCount ? ` ${centerCount} centros disponibles.` : ''} Reserva online. Disponibilidad real.`
  } else if (category) {
    title = `${category} en ${cityFormatted} — Reserva Online | ${SITE_NAME}`
    description = `Descubre los mejores centros de ${category.toLowerCase()} en ${cityFormatted}.${centerCount ? ` ${centerCount} centros.` : ''} Reserva sin llamar.`
  } else {
    title = `Centros de Belleza en ${cityFormatted} | ${SITE_NAME}`
    description = `Encuentra centros de belleza, estética y bienestar en ${cityFormatted}. Reserva cita online. Disponibilidad real.`
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: 'es_ES',
      type: 'website',
    },
  }
}

export function centerJsonLd(center: {
  name: string
  description?: string | null
  addressStreet: string
  addressCity: string
  addressCountry?: string
  phone?: string | null
  website?: string | null
  slug: string
  coverImage?: string | null
  averageRating?: number
  reviewCount?: number
  openingHours?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: center.name,
    description: center.description ?? undefined,
    image: center.coverImage ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: center.addressStreet,
      addressLocality: center.addressCity,
      addressCountry: center.addressCountry ?? 'ES',
    },
    telephone: center.phone ?? undefined,
    url: `${APP_URL}/centro/${center.slug}`,
    ...(center.averageRating && center.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: center.averageRating.toFixed(1),
            reviewCount: center.reviewCount,
          },
        }
      : {}),
  }
}
