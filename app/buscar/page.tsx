import { Metadata } from 'next'
import Link from 'next/link'
import { Search, MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import { Prisma, CenterCategory } from '@prisma/client'

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

  // Validar categoría contra enum real
  const validCategory = categoria && VALID_CATEGORIES.includes(categoria.toUpperCase() as CenterCategory)
    ? (categoria.toUpperCase() as CenterCategory)
    : undefined

  // Construir query con `q` real — busca en nombre centro, descripción y nombres de servicios
  const whereBase: Prisma.CenterWhereInput = {
    published: true,
    ...(ciudad && {
      OR: [
        { addressCity: { contains: ciudad, mode: 'insensitive' } },
        { addressProvince: { contains: ciudad, mode: 'insensitive' } },
      ],
    }),
    ...(validCategory && { category: validCategory }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { services: { some: { name: { contains: q, mode: 'insensitive' }, active: true } } },
        { services: { some: { description: { contains: q, mode: 'insensitive' }, active: true } } },
      ],
    }),
  }

  const centers = await prisma.center.findMany({
    where: whereBase,
    include: {
      services: { where: { active: true }, orderBy: { order: 'asc' }, take: 4 },
      _count: { select: { reviews: true, bookings: true } },
    },
    take: 30,
    orderBy: [
      { bookings: { _count: 'desc' } },
      { createdAt: 'desc' },
    ],
  })

  const hasFilters = !!(q || ciudad || validCategory)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">BellezaLocal</span>
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <form className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Servicio, peluquería, masaje..."
                className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                name="ciudad"
                defaultValue={ciudad}
                placeholder="Ciudad o provincia"
                className="w-40 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <select
              name="categoria"
              defaultValue={validCategory ?? ''}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            >
              <option value="">Todas las categorías</option>
              {VALID_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
              ))}
            </select>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* RESULTADOS HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {centers.length > 0
                ? `${centers.length} centro${centers.length !== 1 ? 's' : ''} encontrado${centers.length !== 1 ? 's' : ''}`
                : 'Sin resultados'}
              {ciudad ? ` en ${ciudad}` : ''}
              {validCategory ? ` · ${CATEGORY_LABELS[validCategory]}` : ''}
            </h1>
            {q && <p className="text-sm text-slate-500">Búsqueda: &ldquo;{q}&rdquo;</p>}
          </div>
          {hasFilters && (
            <Link href="/buscar" className="text-sm font-medium text-rose-600 hover:text-rose-700">
              Limpiar filtros
            </Link>
          )}
        </div>

        {/* SIN RESULTADOS */}
        {centers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Search className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No encontramos centros</p>
            <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
              {hasFilters ? 'Prueba con otra búsqueda o elimina los filtros.' : 'Pronto habrá centros disponibles en tu zona.'}
            </p>
            {hasFilters && (
              <Link href="/buscar" className="mt-4 inline-block text-sm font-medium text-rose-600 hover:underline">
                Ver todos los centros
              </Link>
            )}
          </div>
        )}

        {/* GRID RESULTADOS */}
        {centers.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {centers.map((c) => {
              const minPrice = c.services.length > 0
                ? Math.min(...c.services.map(s => s.priceCents))
                : null

              return (
                <Link
                  key={c.id}
                  href={`/centro/${c.slug}`}
                  className="group block rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="h-44 bg-gradient-to-br from-rose-100 to-rose-200 overflow-hidden">
                    {c.coverImage
                      ? /* eslint-disable-next-line @next/next/no-img-element */ (
                        <img src={c.coverImage} alt={c.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      )
                      : (
                        <div className="flex h-full items-center justify-center text-5xl opacity-20">✂️</div>
                      )}
                  </div>
                  <div className="p-5">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors leading-tight">
                        {c.name}
                      </h3>
                    </div>
                    <p className="mb-3 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {c.addressCity}
                      <span className="mx-1">·</span>
                      {CATEGORY_LABELS[c.category] ?? c.category}
                    </p>
                    {c.services.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {c.services.slice(0, 3).map((s) => (
                          <span key={s.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                            <Clock className="h-3 w-3" />
                            {s.name}
                          </span>
                        ))}
                        {c.services.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                            +{c.services.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      {minPrice !== null ? (
                        <span className="text-sm font-bold text-slate-900">
                          Desde {formatPrice(minPrice)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Consultar precio</span>
                      )}
                      <span className="flex items-center gap-1 text-sm font-semibold text-rose-600">
                        Reservar <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
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
