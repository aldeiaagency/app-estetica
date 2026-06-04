import { MetadataRoute } from 'next'
// import { prisma } from '@/lib/db/client'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/buscar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // TODO: uncomment when DB is ready
  // const centers = await prisma.center.findMany({
  //   where: { published: true, seoNoindex: false },
  //   select: { slug: true, updatedAt: true },
  // })

  // const centerPages: MetadataRoute.Sitemap = centers.map((c) => ({
  //   url: `${BASE_URL}/centro/${c.slug}`,
  //   lastModified: c.updatedAt,
  //   changeFrequency: 'weekly',
  //   priority: 0.9,
  // }))

  return [...staticPages]
}
