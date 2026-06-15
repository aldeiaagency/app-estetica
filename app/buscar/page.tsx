import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, MapPin, Search, SlidersHorizontal, Sparkles, Star } from 'lucide-react'
import { CenterCategory, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: 'Buscar centros de belleza',
  robots: { index: false },
}

const VALID_CATEGORIES = Object.values(CenterCategory)

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ciudad?: string; categoria?: string; precioMax?: string }>
}) {
  const { q, ciudad, categoria, precioMax: precioMaxStr } = await searchParams

  const validCategory = categoria && VALID_CATEGORIES.includes(categoria.toUpperCase() as CenterCategory)
    ? (categoria.toUpperCase() as CenterCategory)
    : undefined

  const precioMaxCents = precioMaxStr && !isNaN(parseFloat(precioMaxStr))
    ? Math.round(parseFloat(precioMaxStr) * 100)
    : undefined

  const andFilters: Prisma.CenterWhereInput[] = []

  if (ciudad) {
    andFilters.push({
      OR: [
        { addressCity: { contains: ciudad, mode: 'insensitive' } },
        { addressProvince: { contains: ciudad, mode: 'insensitive' } },
      ],
    })
  }

  if (q) {
    andFilters.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { services: { some: { name: { contains: q, mode: 'insensitive' }, active: true } } },
        { services: { some: { description: { contains: q, mode: 'insensitive' }, active: true } } },
      ],
    })
  }

  if (precioMaxCents) {
    andFilters.push({
      services: { some: { active: true, priceCents: { lte: precioMaxCents } } },
    })
  }

  const whereBase: Prisma.CenterWhereInput = {
    published: true,
    ...(validCategory && { category: validCategory }),
    ...(andFilters.length > 0 && { AND: andFilters }),
  }

  const centers = await prisma.center.findMany({
    where: whereBase,
    include: {
      services: { where: { active: true }, orderBy: { order: 'asc' }, take: 4 },
      reviews: { where: { approved: true }, select: { rating: true }, take: 100 },
      _count: { select: { reviews: true, bookings: true } },
    },
    take: 30,
    orderBy: [{ bookings: { _count: 'desc' } }, { createdAt: 'desc' }],
  }).catch(error => {
    console.warn('Search page rendered without database results', error)
    return []
  })

  const hasFilters = Boolean(q || ciudad || validCategory || precioMaxStr)
  const resultLabel = centers.length === 1 ? 'centro encontrado' : 'centros encontrados'

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <PublicHeader />

      <section className="border-b border-[#d8dee9] bg-[#0c1324] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[0.92fr_1.08fr] md:items-end md:py-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f2b5a7]">Explorar centros</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
              Encuentra una experiencia de belleza cerca de ti.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/64">
              Compara servicios, disponibilidad, valoraciones y precios con una lectura mas cuidada y visual.
            </p>
          </div>

          <form className="rounded-lg border border-white/10 bg-white p-3 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
            <div className="grid gap-2 md:grid-cols-[1fr_0.82fr_0.7fr_auto]">
              <label className="flex items-center gap-3 rounded-md border border-[#d8dee9] bg-[#f7f9fc] px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-[#8b96aa]" />
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Servicio, peluqueria, masaje..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#0c1324] outline-none placeholder:text-[#8b96aa]"
                />
              </label>
              <label className="flex items-center gap-3 rounded-md border border-[#d8dee9] bg-[#f7f9fc] px-4 py-3">
                <MapPin className="h-4 w-4 shrink-0 text-[#8b96aa]" />
                <input
                  type="text"
                  name="ciudad"
                  defaultValue={ciudad}
                  placeholder="Ciudad"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#0c1324] outline-none placeholder:text-[#8b96aa]"
                />
              </label>
              <label className="flex items-center gap-3 rounded-md border border-[#d8dee9] bg-[#f7f9fc] px-4 py-3">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#8b96aa]" />
                <select
                  name="categoria"
                  defaultValue={validCategory ?? ''}
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#0c1324] outline-none"
                >
                  <option value="">Todas</option>
                  {VALID_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn-primary px-6">
                Buscar
              </button>
            </div>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2355c8]">
              {centers.length > 0 ? `${centers.length} ${resultLabel}` : 'Sin resultados'}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0c1324]">
              {ciudad ? `Resultados en ${ciudad}` : 'Centros destacados'}
              {validCategory ? ` · ${CATEGORY_LABELS[validCategory]}` : ''}
            </h2>
            {q && <p className="mt-1 text-sm text-[#647089]">Busqueda: &ldquo;{q}&rdquo;</p>}
          </div>
          {hasFilters && (
            <Link href="/buscar" className="text-sm font-bold text-[#2355c8] transition-colors hover:text-[#2f6df6]">
              Limpiar filtros
            </Link>
          )}
        </div>

        <div className="mb-7 flex gap-2 overflow-x-auto pb-1">
          {VALID_CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={`/buscar?${new URLSearchParams({ ...(q ? { q } : {}), ...(ciudad ? { ciudad } : {}), categoria: cat }).toString()}`}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                validCategory === cat
                  ? 'bg-[#0c1324] text-white'
                  : 'border border-[#d8dee9] bg-white text-[#647089] hover:border-[#b9c4d5] hover:text-[#0c1324]'
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </Link>
          ))}
        </div>

        {centers.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#d8dee9] bg-white px-6 py-16 text-center shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-[#e5eaf2]">
              <Search className="h-7 w-7 text-[#8b96aa]" />
            </div>
            <p className="font-bold text-[#0c1324]">No encontramos centros</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#647089]">
              {hasFilters ? 'Prueba con otra busqueda o elimina los filtros.' : 'Pronto habra centros disponibles en tu zona.'}
            </p>
            {hasFilters && (
              <Link href="/buscar" className="btn-outline mt-5 inline-flex">Ver todos los centros</Link>
            )}
          </div>
        )}

        {centers.length > 0 && (
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
                  className="group block overflow-hidden rounded-lg border border-[#d8dee9] bg-white shadow-[0_20px_55px_rgba(12,19,36,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_75px_rgba(12,19,36,0.12)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#e5eaf2]">
                    {center.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={center.coverImage} alt={center.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Sparkles className="h-10 w-10 text-[#8b96aa]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324]/40 via-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-full bg-white/92 px-2.5 py-0.5 text-xs font-bold text-[#0c1324] backdrop-blur">
                        {CATEGORY_LABELS[center.category] ?? center.category}
                      </span>
                    </div>
                    {avgRating && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-xs font-bold text-[#0c1324] backdrop-blur">
                        <Star className="h-3 w-3 fill-[#e3a952] text-[#e3a952]" />
                        {avgRating.toFixed(1)}
                        <span className="text-[#647089]">({center._count.reviews})</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold leading-snug text-[#0c1324] transition-colors group-hover:text-[#2355c8]">
                      {center.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#647089]">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {center.addressCity}
                      {center.addressProvince && center.addressProvince !== center.addressCity ? `, ${center.addressProvince}` : ''}
                    </p>
                    {center.services.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {center.services.slice(0, 3).map(service => (
                          <span key={service.id} className="flex items-center gap-1 rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs text-[#647089]">
                            <Clock className="h-3 w-3" />
                            {service.name}
                          </span>
                        ))}
                        {center.services.length > 3 && (
                          <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs text-[#647089]">
                            +{center.services.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-[#e5eaf2] pt-4">
                      {minPrice !== null ? (
                        <span className="text-sm font-black text-[#0c1324]">Desde {formatPrice(minPrice)}</span>
                      ) : (
                        <span className="text-sm text-[#8b96aa]">Consultar precio</span>
                      )}
                      <span className="flex items-center gap-1 text-sm font-bold text-[#2355c8]">
                        Reservar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
