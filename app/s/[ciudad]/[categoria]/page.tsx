import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import {
  localityPageMetadata, cityToSlug, slugToCity,
  categoryToSlug, slugToCategory, itemListJsonLd, faqPageJsonLd,
} from '@/lib/seo/metadata'
import { CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import Image from 'next/image'
import { PublicHeader } from '@/components/ui/public-header'
import { MapPin, Star, ArrowRight, Sparkles } from 'lucide-react'
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
  const faqItems = [
    {
      question: `Como comparar centros de ${categoryDisplay} en ${cityDisplay}?`,
      answer: `Para comparar centros de ${categoryDisplay} en ${cityDisplay}, revisa servicios activos, precio visible, resenas verificadas, disponibilidad online y si la ficha explica para que tipo de objetivo encaja mejor.`,
    },
    {
      question: `Puedo reservar ${categoryDisplay} online en ${cityDisplay}?`,
      answer: `Si, cada centro publicado puede mostrar servicios reservables y acceso a cita online. La disponibilidad y los precios dependen de la ficha de cada negocio.`,
    },
    {
      question: `Que mirar antes de elegir un centro de ${categoryDisplay}?`,
      answer: `Antes de elegir, comprueba que el servicio coincide con tu objetivo, que el precio es claro cuando aplica y que las resenas aportan contexto sobre servicios reales.`,
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
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#647089]">
              Esta pagina agrupa centros publicados de {categoryDisplay} en {cityDisplay} para comparar servicios, precio visible cuando existe, resenas y disponibilidad antes de reservar.
            </p>
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
                  <div className="h-36 bg-[#e5eaf2] relative overflow-hidden">
                    {center.coverImage ? (
                      <Image src={center.coverImage} alt={center.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-9 w-9 text-[#8b96aa]" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#273244]">
                      {categoryDisplay}
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
            <h2 className="text-2xl font-black tracking-tight text-[#0c1324]">Como elegir {categoryDisplay} en {cityDisplay}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#647089]">
              Compara si el centro ofrece el servicio concreto que buscas, si el precio aparece antes de reservar y si las resenas hablan de experiencias relacionadas con {categoryDisplay.toLowerCase()}. Para objetivos con continuidad, revisa tambien packs, beneficios o seguimiento disponible.
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
