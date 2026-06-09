import { Metadata } from 'next'
import Link from 'next/link'
import { Search, MapPin, Clock, ArrowRight, Star, SlidersHorizontal, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import { Prisma, CenterCategory } from '@prisma/client'
import { PublicHeader } from '@/components/ui/public-header'

export const metadata: Metadata = {
  title: 'Buscar centros de belleza',
  robots: { index: false },
}

const VALID_CATEGORIES = Object.values(CenterCategory)

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ciudad?: string; categoria?: string }>
}) {
  const { q, ciudad, categoria } = await searchParams

  const validCategory = categoria && VALID_CATEGORIES.includes(categoria.toUpperCase() as CenterCategory)
    ? (categoria.toUpperCase() as CenterCategory)
    : undefined

  const whereBase: Prisma.CenterWhereInput = {
    published: true,
    ...(ciudad && {
      OR: [
        { addressCity:     { contains: ciudad, mode: 'insensitive' } },
        { addressProvince: { contains: ciudad, mode: 'insensitive' } },
      ],
    }),
    ...(validCategory && { category: validCategory }),
    ...(q && {
      OR: [
        { name:        { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { services: { some: { name:        { contains: q, mode: 'insensitive' }, active: true } } },
        { services: { some: { description: { contains: q, mode: 'insensitive' }, active: true } } },
      ],
    }),
  }

  const centers = await prisma.center.findMany({
    where: whereBase,
    include: {
      services: { where: { active: true }, orderBy: { order: 'asc' }, take: 4 },
      reviews:  { where: { approved: true }, select: { rating: true }, take: 100 },
      _count:   { select: { reviews: true, bookings: true } },
    },
    take: 30,
    orderBy: [{ bookings: { _count: 'desc' } }, { createdAt: 'desc' }],
  })

  const hasFilters = !!(q || ciudad || validCategory)

  return (
    <div className="min-h-screen bg-zinc-50">
      <PublicHeader />

      {/* ─── SEARCH BAR ─── */}
      <div className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <form className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 focus-within:border-primary-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/15 transition-all">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" />
              <input type="text" name="q" defaultValue={q} placeholder="Servicio, peluquería, masaje..." className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400" />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 focus-within:border-primary-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/15 transition-all">
              <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
              <input type="text" name="ciudad" defaultValue={ciudad} placeholder="Ciudad o provincia" className="w-40 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 focus-within:border-primary-500 transition-all">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-zinc-400" />
              <select name="categoria" defaultValue={validCategory ?? ''} className="bg-transparent text-sm text-zinc-700 outline-none">
                <option value="">Todas las categorías</option>
                {VALID_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/20 transition-all hover:bg-primary-700 active:scale-[0.97]">
              <Search className="h-4 w-4" />Buscar
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Results header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">
              {centers.length > 0
                ? `${centers.length} centro${centers.length !== 1 ? 's' : ''} encontrado${centers.length !== 1 ? 's' : ''}`
                : 'Sin resultados'}
              {ciudad ? ` en ${ciudad}` : ''}
              {validCategory ? ` · ${CATEGORY_LABELS[validCategory]}` : ''}
            </h1>
            {q && <p className="mt-0.5 text-sm text-zinc-500">Búsqueda: &ldquo;{q}&rdquo;</p>}
          </div>
          {hasFilters && (
            <Link href="/buscar" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Limpiar filtros
            </Link>
          )}
        </div>

        {/* Category quick-filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {VALID_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/buscar?${new URLSearchParams({ ...(q ? { q } : {}), ...(ciudad ? { ciudad } : {}), categoria: cat }).toString()}`}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                validCategory === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {centers.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
              <Search className="h-7 w-7 text-zinc-400" />
            </div>
            <p className="font-semibold text-zinc-700">No encontramos centros</p>
            <p className="mt-1 max-w-sm mx-auto text-sm text-zinc-400">
              {hasFilters ? 'Prueba con otra búsqueda o elimina los filtros.' : 'Pronto habrá centros disponibles en tu zona.'}
            </p>
            {hasFilters && (
              <Link href="/buscar" className="btn-outline mt-5 inline-flex">Ver todos los centros</Link>
            )}
          </div>
        )}

        {/* Grid */}
        {centers.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {centers.map((c) => {
              const minPrice = c.services.length > 0 ? Math.min(...c.services.map(s => s.priceCents)) : null
              const avgRating = c.reviews.length > 0 ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length : null
              return (
                <Link key={c.id} href={`/centro/${c.slug}`}
                  className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
                  <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50">
                    {c.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.coverImage} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Sparkles className="h-10 w-10 text-primary-200" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 backdrop-blur">
                        {CATEGORY_LABELS[c.category] ?? c.category}
                      </span>
                    </div>
                    {avgRating && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-zinc-700 backdrop-blur shadow-sm">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{avgRating.toFixed(1)}
                        <span className="text-zinc-500">({c._count.reviews})</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-zinc-900 leading-snug group-hover:text-primary-600 transition-colors">{c.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                      <MapPin className="h-3 w-3 shrink-0" />{c.addressCity}
                      {c.addressProvince && c.addressProvince !== c.addressCity ? `, ${c.addressProvince}` : ''}
                    </p>
                    {c.services.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {c.services.slice(0, 3).map((s) => (
                          <span key={s.id} className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                            <Clock className="h-3 w-3" />{s.name}
                          </span>
                        ))}
                        {c.services.length > 3 && (
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">+{c.services.length - 3}</span>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                      {minPrice !== null ? (
                        <span className="text-sm font-bold text-zinc-900">Desde {formatPrice(minPrice)}</span>
                      ) : (
                        <span className="text-sm text-zinc-400">Consultar precio</span>
                      )}
                      <span className="flex items-center gap-1 text-sm font-semibold text-primary-600 group-hover:text-primary-700">
                        Reservar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
