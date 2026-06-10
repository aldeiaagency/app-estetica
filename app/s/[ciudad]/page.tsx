import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import {
  localityPageMetadata, cityToSlug, slugToCity,
  categoryToSlug, itemListJsonLd,
} from '@/lib/seo/metadata'
import { CATEGORY_LABELS } from '@/lib/utils'
import Image from 'next/image'
import { PublicHeader } from '@/components/ui/public-header'
import { MapPin, Star, ArrowRight } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'

interface Props { params: Promise<{ ciudad: string }> }

export async function generateStaticParams() {
  const centers = await prisma.center.findMany({
    where:  { published: true },
    select: { addressCity: true },
    distinct: ['addressCity'],
  })
  return centers.map(c => ({ ciudad: cityToSlug(c.addressCity) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad } = await params
  const cityDisplay = slugToCity(ciudad)
  return {
    ...localityPageMetadata({ city: cityDisplay }),
    alternates: { canonical: `${APP_URL}/s/${ciudad}` },
  }
}

export default async function CiudadPage({ params }: Props) {
  const { ciudad } = await params

  // Resolve raw city name from slug
  const allCities = await prisma.center.findMany({
    where:    { published: true },
    select:   { addressCity: true },
    distinct: ['addressCity'],
  })
  const rawCity = allCities.find(c => cityToSlug(c.addressCity) === ciudad)?.addressCity
  if (!rawCity) notFound()

  const centers = await prisma.center.findMany({
    where:   { published: true, addressCity: rawCity },
    select:  {
      id: true, slug: true, name: true, category: true,
      description: true, coverImage: true,
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (centers.length === 0) notFound()

  // Categories present in this city
  const categoriesInCity = [...new Set(centers.map(c => c.category))]
  const cityDisplay = slugToCity(ciudad)

  const jsonLd = itemListJsonLd({
    name:  `Centros de belleza en ${cityDisplay}`,
    url:   `${APP_URL}/s/${ciudad}`,
    items: centers.map((c, i) => ({
      name:     c.name,
      url:      `${APP_URL}/centro/${c.slug}`,
      position: i + 1,
    })),
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-zinc-50">
        <PublicHeader />

        {/* Hero */}
        <section className="bg-white border-b border-zinc-100 px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
              <Link href="/" className="hover:text-zinc-600">Inicio</Link>
              <span>/</span>
              <span className="text-zinc-700 font-medium">{cityDisplay}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
              Centros de belleza en {cityDisplay}
            </h1>
            <p className="mt-3 text-zinc-500">
              {centers.length} centro{centers.length !== 1 ? 's' : ''} disponible{centers.length !== 1 ? 's' : ''} · Reserva online en segundos
            </p>

            {/* Category filter links */}
            {categoriesInCity.length > 1 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {categoriesInCity.map(cat => (
                  <Link
                    key={cat}
                    href={`/s/${ciudad}/${categoryToSlug(cat)}`}
                    className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Center grid */}
        <section className="mx-auto max-w-5xl px-6 py-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {centers.map(center => (
              <Link
                key={center.id}
                href={`/centro/${center.slug}`}
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* Cover */}
                <div className="h-36 bg-gradient-to-br from-primary-100 to-beauty-100 relative overflow-hidden">
                  {center.coverImage ? (
                    <Image src={center.coverImage} alt={center.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">💆</div>
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                    {CATEGORY_LABELS[center.category] ?? center.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-black text-zinc-900 group-hover:text-primary-700 transition-colors line-clamp-1">
                    {center.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    {cityDisplay}
                    {center._count.reviews > 0 && (
                      <>
                        <span className="mx-1">·</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{center._count.reviews} reseña{center._count.reviews !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                  {center.description && (
                    <p className="mt-2 text-sm text-zinc-500 line-clamp-2">{center.description}</p>
                  )}
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary-600">Reservar cita</span>
                    <ArrowRight className="h-4 w-4 text-primary-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
