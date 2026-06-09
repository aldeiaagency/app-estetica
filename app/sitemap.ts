import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/client'
import { cityToSlug, categoryToSlug } from '@/lib/seo/metadata'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/precios`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/para-negocios`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

  const centers = await prisma.center.findMany({
    where:   { published: true, seoNoindex: false },
    select:  { slug: true, updatedAt: true, addressCity: true, category: true },
    orderBy: { updatedAt: 'desc' },
  })

  const centerPages: MetadataRoute.Sitemap = centers.map(c => ({
    url:             `${BASE_URL}/centro/${c.slug}`,
    lastModified:    c.updatedAt,
    changeFrequency: 'weekly',
    priority:        0.9,
  }))

  const cities = [...new Set(centers.map(c => cityToSlug(c.addressCity)))]
  const cityPages: MetadataRoute.Sitemap = cities.map(ciudad => ({
    url:             `${BASE_URL}/s/${ciudad}`,
    lastModified:    now,
    changeFrequency: 'daily',
    priority:        0.7,
  }))

  const combos = new Set(
    centers.map(c => `${cityToSlug(c.addressCity)}/${categoryToSlug(c.category)}`)
  )
  const comboPages: MetadataRoute.Sitemap = [...combos].map(combo => ({
    url:             `${BASE_URL}/s/${combo}`,
    lastModified:    now,
    changeFrequency: 'daily',
    priority:        0.6,
  }))

  return [...staticPages, ...centerPages, ...cityPages, ...comboPages]
}
