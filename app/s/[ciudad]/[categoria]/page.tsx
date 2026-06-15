import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import {
  localityPageMetadata, cityToSlug, slugToCity,
  categoryToSlug, slugToCategory, itemListJsonLd,
} from '@/lib/seo/metadata'
import { CATEGORY_LABELS } from '@/lib/utils'
import Image from 'next/image'
import { PublicHeader } from '@/components/ui/public-header'
import { MapPin, Star, ArrowRight } from 'lucide-react'
import type { CenterCategory } from '@prisma/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'

interface Props { params: Promise<{ ciudad: string; categoria: string }> }

export async function generateStaticParams() {
  const centers = await prisma.center.findMany({
    where:  { published: true },
    select: { addressCity: true, category: true },
    distinct: ['addressCity', 'category'],
  })
  return centers.map(c => ({
    ciudad:   cityToSlug(c.addressCity),
    categoria: categoryToSlug(c.category),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad, categoria } = await params
  const cityDisplay     = slugToCity(ciudad)
  const categoryRaw     = slugToCategory(categoria)
  const categoryDisplay = CATEGORY_LABELS[categoryRaw] ?? slugToCity(categoria)

  return {
    ...localityPageMetadata({ city: cityDisplay, category: categoryDisplay }),
    alternates: { canonical: `${APP_URL}/s/${ciudad}/${categoria}` },
  }
}

export default async function CiudadCategoriaPage({ params }: Props) {
  const { ciudad, categoria } = await params
  const categoryRaw = slugToCategory(categoria) as CenterCategory

  // Resolve raw city name from slug
  const allCities = await prisma.center.findMany({
    where:    { published: true },
    select:   { addressCity: true },
    distinct: ['addressCity'],
  })
  const rawCity = allCities.find(c => cityToSlug(c.addressCity) === ciudad)?.addressCity
  if (!rawCity) notFound()

  const centers = await prisma.center.findMany({
    where:   { published: true, addressCity: rawCity, category: categoryRaw },
    select:  {
      id: true, slug: true, name: true, category: true,
      description: true, coverImage: true,
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (centers.length === 0) notFound()

  const cityDisplay     = slugToCity(ciudad)
  const categoryDisplay = CATEGORY_LABELS[categoryRaw] ?? slugToCity(categoria)

  const jsonLd = itemListJsonLd({
    name:  `${categoryDisplay} en ${cityDisplay}`,
    url:   `${APP_URL}/s/${ciudad}/${categoria}`,
    items: centers.map((c, i) => ({
      name:     c.name,
      url:      `${APP_URL}/centro/${c.slug}`,
      position: i + 1,
    })),
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-[#f1f4f8]">
        <PublicHeader />

        {/* Hero */}
        <section className="bg-white border-b border-[#e5eaf2] px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2 text-sm text-[#8b96aa] mb-3">
              <Link href="/" className="hover:text-[#46546b]">Inicio</Link>
              <span>/</span>
              <Link href={`/s/${ciudad}`} className="hover:text-[#46546b]">{cityDisplay}</Link>
              <span>/</span>
              <span className="text-[#273244] font-medium">{categoryDisplay}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#0c1324] sm:text-4xl">
              {categoryDisplay} en {cityDisplay}
            </h1>
            <p className="mt-3 text-[#647089]">
              {centers.length} centro{centers.length !== 1 ? 's' : ''} · Reserva online · Sin llamadas
            </p>
          </div>
        </section>

        {/* Center grid */}
        <section className="mx-auto max-w-5xl px-6 py-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {centers.map(center => (
              <Link
                key={center.id}
                href={`/centro/${center.slug}`}
                className="group flex flex-col rounded-lg border border-[#d8dee9] bg-white shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="h-36 bg-gradient-to-br from-[#e5edff] to-[#e7f7f5] relative overflow-hidden">
                  {center.coverImage ? (
                    <Image src={center.coverImage} alt={center.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">💆</div>
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#273244]">
                    {categoryDisplay}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-black text-[#0c1324] group-hover:text-[#2355c8] transition-colors line-clamp-1">
                    {center.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8b96aa]">
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
                    <p className="mt-2 text-sm text-[#647089] line-clamp-2">{center.description}</p>
                  )}
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#2f6df6]">Reservar cita</span>
                    <ArrowRight className="h-4 w-4 text-[#8bb7ff] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Back to city */}
          <div className="mt-10 text-center">
            <Link
              href={`/s/${ciudad}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#647089] hover:text-[#0c1324] transition-colors"
            >
              ← Ver todos los centros en {cityDisplay}
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
