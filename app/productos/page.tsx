import { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingBag, Search, Sparkles, MapPin, Package, SlidersHorizontal } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'
import { Prisma } from '@prisma/client'
import { PublicHeader } from '@/components/ui/public-header'

export const metadata: Metadata = {
  title: 'Productos de belleza',
  description: 'Descubre y compra productos de belleza de los mejores centros cerca de ti. Recógelos en tu próxima cita.',
  robots: { index: false }, // noindex mientras haya filtros por query; catálogo aún sin volumen real
}

type SortOption = 'recientes' | 'precio-asc' | 'precio-desc'

interface Props {
  searchParams: Promise<{
    q?: string
    centro?: string
    ciudad?: string
    categoria?: string
    marca?: string
    precioMin?: string
    precioMax?: string
    orden?: string
  }>
}

function parseCents(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = parseFloat(value)
  return isNaN(n) || n < 0 ? undefined : Math.round(n * 100)
}

const ORDER_BY: Record<SortOption, Prisma.ProductOrderByWithRelationInput> = {
  'recientes':  { createdAt: 'desc' },
  'precio-asc': { priceCents: 'asc' },
  'precio-desc':{ priceCents: 'desc' },
}

export default async function ProductosPage({ searchParams }: Props) {
  const sp = await searchParams
  const { q, centro, ciudad, marca } = sp
  const orden: SortOption = (['recientes', 'precio-asc', 'precio-desc'].includes(sp.orden ?? '')
    ? sp.orden
    : 'recientes') as SortOption
  const precioMinCents = parseCents(sp.precioMin)
  const precioMaxCents = parseCents(sp.precioMax)

  // ─── Filtros AND combinables ───────────────────────────────────────────────
  const and: Prisma.ProductWhereInput[] = [
    { active: true },
    { center: { published: true } },
  ]

  if (q) {
    and.push({
      OR: [
        { name:        { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand:       { contains: q, mode: 'insensitive' } },
      ],
    })
  }
  if (centro) and.push({ center: { slug: centro } })
  if (ciudad) and.push({ center: { addressCity: ciudad } })
  if (marca)  and.push({ brand: marca })
  if (sp.categoria) and.push({ category: { slug: sp.categoria } })
  if (precioMinCents !== undefined) and.push({ priceCents: { gte: precioMinCents } })
  if (precioMaxCents !== undefined) and.push({ priceCents: { lte: precioMaxCents } })

  const where: Prisma.ProductWhereInput = { AND: and }

  // ─── Datos + opciones de filtro (en paralelo) ───────────────────────────────
  const [products, categories, cityRows, brandRows] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { center: { select: { id: true, name: true, slug: true, addressCity: true } } },
      orderBy: ORDER_BY[orden],
      take: 60,
    }),
    prisma.productCategory.findMany({ orderBy: { order: 'asc' } }),
    prisma.center.findMany({
      where: { published: true, products: { some: { active: true } } },
      select: { addressCity: true },
      distinct: ['addressCity'],
      orderBy: { addressCity: 'asc' },
    }),
    prisma.product.findMany({
      where: { active: true, center: { published: true }, brand: { not: null } },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    }),
  ])

  const cities = cityRows.map(c => c.addressCity).filter(Boolean)
  const brands = brandRows.map(b => b.brand).filter((b): b is string => !!b)

  const hasFilters = !!(q || centro || ciudad || marca || sp.categoria || sp.precioMin || sp.precioMax || (sp.orden && sp.orden !== 'recientes'))

  // Helper para construir URLs de filtro preservando el resto de parámetros
  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { q, centro, ciudad, marca, categoria: sp.categoria, precioMin: sp.precioMin, precioMax: sp.precioMax, orden: sp.orden, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v)
    }
    const qs = params.toString()
    return qs ? `/productos?${qs}` : '/productos'
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <PublicHeader />

      {/* Search bar */}
      <div className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <form className="flex flex-col gap-2 sm:flex-row">
            {/* preserva filtros activos al buscar por texto */}
            {ciudad && <input type="hidden" name="ciudad" value={ciudad} />}
            {marca && <input type="hidden" name="marca" value={marca} />}
            {sp.categoria && <input type="hidden" name="categoria" value={sp.categoria} />}
            {sp.orden && <input type="hidden" name="orden" value={sp.orden} />}
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 focus-within:border-primary-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/15 transition-all">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar producto, marca..."
                className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
            >
              <Search className="h-4 w-4" />Buscar
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* ─── Sidebar de filtros ─── */}
          <aside className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <SlidersHorizontal className="h-4 w-4" />Filtros
            </div>

            {/* Categoría */}
            {categories.length > 0 && (
              <FilterGroup title="Categoría">
                <FilterLink href={buildHref({ categoria: undefined })} active={!sp.categoria}>Todas</FilterLink>
                {categories.map(cat => (
                  <FilterLink key={cat.id} href={buildHref({ categoria: cat.slug })} active={sp.categoria === cat.slug}>
                    {cat.name}
                  </FilterLink>
                ))}
              </FilterGroup>
            )}

            {/* Ciudad */}
            {cities.length > 0 && (
              <FilterGroup title="Ciudad">
                <FilterLink href={buildHref({ ciudad: undefined })} active={!ciudad}>Todas</FilterLink>
                {cities.map(city => (
                  <FilterLink key={city} href={buildHref({ ciudad: city })} active={ciudad === city}>
                    {city}
                  </FilterLink>
                ))}
              </FilterGroup>
            )}

            {/* Marca */}
            {brands.length > 0 && (
              <FilterGroup title="Marca">
                <FilterLink href={buildHref({ marca: undefined })} active={!marca}>Todas</FilterLink>
                {brands.map(b => (
                  <FilterLink key={b} href={buildHref({ marca: b })} active={marca === b}>
                    {b}
                  </FilterLink>
                ))}
              </FilterGroup>
            )}

            {/* Precio */}
            <FilterGroup title="Precio (€)">
              <form className="flex items-center gap-2">
                {q && <input type="hidden" name="q" value={q} />}
                {ciudad && <input type="hidden" name="ciudad" value={ciudad} />}
                {marca && <input type="hidden" name="marca" value={marca} />}
                {sp.categoria && <input type="hidden" name="categoria" value={sp.categoria} />}
                {sp.orden && <input type="hidden" name="orden" value={sp.orden} />}
                <input
                  type="number" name="precioMin" min="0" placeholder="Mín" defaultValue={sp.precioMin}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary-500"
                />
                <span className="text-zinc-300">–</span>
                <input
                  type="number" name="precioMax" min="0" placeholder="Máx" defaultValue={sp.precioMax}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary-500"
                />
                <button type="submit" className="shrink-0 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700">OK</button>
              </form>
            </FilterGroup>

            {hasFilters && (
              <Link href="/productos" className="block text-sm font-semibold text-primary-600 hover:text-primary-700">
                Limpiar todos los filtros
              </Link>
            )}
          </aside>

          {/* ─── Resultados ─── */}
          <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-lg font-bold text-zinc-900">
                {products.length > 0
                  ? `${products.length} producto${products.length !== 1 ? 's' : ''}`
                  : 'Sin productos'}
                {ciudad ? ` en ${ciudad}` : ''}
              </h1>
              {/* Orden */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-400">Ordenar:</span>
                <div className="flex gap-1.5">
                  {([['recientes', 'Recientes'], ['precio-asc', 'Precio ↑'], ['precio-desc', 'Precio ↓']] as const).map(([val, label]) => (
                    <Link
                      key={val}
                      href={buildHref({ orden: val === 'recientes' ? undefined : val })}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        orden === val ? 'bg-primary-600 text-white' : 'border border-zinc-200 bg-white text-zinc-600 hover:border-primary-300'
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Empty state */}
            {products.length === 0 && (
              <div className="rounded-3xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                  <Package className="h-7 w-7 text-zinc-400" />
                </div>
                <p className="font-semibold text-zinc-700">No hay productos disponibles</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {hasFilters ? 'Prueba con otros filtros o límpialos.' : 'Pronto habrá productos de belleza disponibles.'}
                </p>
                {hasFilters && (
                  <Link href="/productos" className="btn-outline mt-5 inline-flex">Ver todos los productos</Link>
                )}
              </div>
            )}

            {/* Grid */}
            {products.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map(p => (
                  <Link
                    key={p.id}
                    href={`/productos/${p.id}`}
                    className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary-50 to-beauty-50">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-10 w-10 text-primary-200" />
                        </div>
                      )}
                      {p.stock !== null && p.stock !== undefined && p.stock <= 3 && p.stock > 0 && (
                        <div className="absolute bottom-2 left-2">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Solo {p.stock} disponibles
                          </span>
                        </div>
                      )}
                      {p.stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-zinc-700">Agotado</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {p.brand && (
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{p.brand}</p>
                      )}
                      <h3 className="font-bold leading-snug text-zinc-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {p.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{p.center.name} · {p.center.addressCity}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-black text-zinc-900">{formatPrice(p.priceCents)}</span>
                        <span className="flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                          <Sparkles className="h-3 w-3" />Ver
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">{title}</h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
        active ? 'bg-primary-50 font-semibold text-primary-700' : 'text-zinc-600 hover:bg-zinc-100'
      }`}
    >
      {children}
    </Link>
  )
}
