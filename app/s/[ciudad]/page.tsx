import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import {
  localityPageMetadata, cityToSlug, slugToCity,
  categoryToSlug, itemListJsonLd, faqPageJsonLd,
} from '@/lib/seo/metadata'
import { CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import Image from 'next/image'
import { PublicHeader } from '@/components/ui/public-header'
import { MapPin, Star, ArrowRight, Sparkles } from 'lucide-react'

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
      services: {
        where: { active: true },
        orderBy: { order: 'asc' },
        take: 3,
        select: { id: true, name: true, priceCents: true },
      },
      reviews: { where: { approved: true }, select: { rating: true }, take: 50 },
      _count: { select: { reviews: true, bookings: true } },
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
  const faqItems = [
    {
      question: `Como elegir un centro de belleza en ${cityDisplay}?`,
      answer: `Para elegir un centro de belleza en ${cityDisplay}, compara categoria, servicios activos, precio visible, resenas verificadas y disponibilidad online. Belleza Local muestra centros publicados con ficha propia para que puedas revisar esas senales antes de reservar.`,
    },
    {
      question: `Puedo reservar online centros de belleza en ${cityDisplay}?`,
      answer: `Si, los centros publicados en Belleza Local pueden mostrar servicios y acceso a reserva online. En cada ficha puedes revisar servicios, precio cuando esta disponible y la informacion practica del centro.`,
    },
    {
      question: `Que categorias hay en ${cityDisplay}?`,
      answer: `En ${cityDisplay} hay centros publicados en ${categoriesInCity.map(cat => CATEGORY_LABELS[cat] ?? cat).join(', ')}. Las categorias dependen de los centros activos en la ciudad.`,
    },
  ]
  const faqJsonLd = faqPageJsonLd(faqItems)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="min-h-screen bg-[#f1f4f8]">
        <PublicHeader />

        {/* Hero */}
        <section className="bg-white border-b border-[#e5eaf2] px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2 text-sm text-[#8b96aa] mb-3">
              <Link href="/" className="hover:text-[#46546b]">Inicio</Link>
              <span>/</span>
              <span className="text-[#273244] font-medium">{cityDisplay}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#0c1324] sm:text-4xl">
              Centros de belleza en {cityDisplay}
            </h1>
            <p className="mt-3 text-[#647089]">
              {centers.length} centro{centers.length !== 1 ? 's' : ''} disponible{centers.length !== 1 ? 's' : ''} · Reserva online en segundos
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#647089]">
              Belleza Local agrupa centros publicados en {cityDisplay} para comparar servicios, categorias, precio visible cuando existe y resenas verificadas antes de pedir cita.
            </p>

            {/* Category filter links */}
            {categoriesInCity.length > 1 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {categoriesInCity.map(cat => (
                  <Link
                    key={cat}
                    href={`/s/${ciudad}/${categoryToSlug(cat)}`}
                    className="rounded-full border border-[#d8dee9] bg-white px-4 py-1.5 text-sm font-medium text-[#46546b] hover:border-[#a9c6ff] hover:text-[#2355c8] hover:bg-[#e5edff] transition-colors"
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
            {centers.map(center => {
              const minPrice = center.services.length > 0
                ? Math.min(...center.services.map(service => service.priceCents))
                : null
              const avgRating = center.reviews.length > 0
                ? center.reviews.reduce((sum, review) => sum + review.rating, 0) / center.reviews.length
                : null

              return (
                <Link
                  key={center.id}
                  href={`/centro/${center.slug}`}
                  className="group flex flex-col rounded-lg border border-[#d8dee9] bg-white shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  {/* Cover */}
                  <div className="h-36 bg-[#e5eaf2] relative overflow-hidden">
                    {center.coverImage ? (
                      <Image src={center.coverImage} alt={center.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-9 w-9 text-[#8b96aa]" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#273244]">
                      {CATEGORY_LABELS[center.category] ?? center.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-black text-[#0c1324] group-hover:text-[#2355c8] transition-colors line-clamp-1">
                      {center.name}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#8b96aa]">
                      <MapPin className="h-3 w-3" />
                      {cityDisplay}
                      {avgRating && (
                        <>
                          <span className="mx-1">·</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{avgRating.toFixed(1)} ({center._count.reviews})</span>
                        </>
                      )}
                    </div>
                    {center.description && (
                      <p className="mt-2 text-sm text-[#647089] line-clamp-2">{center.description}</p>
                    )}
                    {center.services.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {center.services.slice(0, 2).map(service => (
                          <span key={service.id} className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs text-[#647089]">
                            {service.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#2f6df6]">
                        {minPrice !== null ? `Desde ${formatPrice(minPrice)}` : 'Consultar precio'}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#8bb7ff] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <section className="mt-12 border-t border-[#d8dee9] pt-8">
            <h2 className="text-2xl font-black tracking-tight text-[#0c1324]">Como comparar centros en {cityDisplay}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#647089]">
              Un centro encaja mejor cuando la categoria coincide con tu objetivo, muestra servicios activos, deja claro el precio cuando aplica y cuenta con resenas relacionadas con reservas reales. Si necesitas continuidad, prioriza fichas con packs, beneficios o seguimiento disponible.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-black tracking-tight text-[#0c1324]">Preguntas frecuentes</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {faqItems.map(item => (
                <article key={item.question} className="rounded-lg border border-[#d8dee9] bg-white p-5">
                  <h3 className="font-black leading-snug text-[#0c1324]">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#647089]">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </>
  )
}
