import { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingBag, Search, Sparkles, MapPin, Package } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'
import { PublicHeader } from '@/components/ui/public-header'

export const metadata: Metadata = {
  title: 'Productos de belleza',
  description: 'Descubre y compra productos de belleza de los mejores centros cerca de ti.',
  robots: { index: false }, // noindex hasta catálogo real con productos suficientes
}

interface Props {
  searchParams: Promise<{ q?: string; centro?: string }>
}

export default async function ProductosPage({ searchParams }: Props) {
  const { q, centro } = await searchParams

  const products = await prisma.product.findMany({
    where: {
      active: true,
      center: { published: true },
      ...(q && {
        OR: [
          { name:        { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { brand:       { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(centro && {
        center: { slug: centro, published: true },
      }),
    },
    include: {
      center: { select: { id: true, name: true, slug: true, addressCity: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
  })

  const hasFilters = !!(q || centro)

  return (
    <div className="min-h-screen bg-zinc-50">
      <PublicHeader />

      {/* Search bar */}
      <div className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <form className="flex gap-2">
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
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
            >
              <Search className="h-4 w-4" />Buscar
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">
              {products.length > 0
                ? `${products.length} producto${products.length !== 1 ? 's' : ''}`
                : 'Sin productos'}
            </h1>
            {q && <p className="mt-0.5 text-sm text-zinc-500">Búsqueda: &ldquo;{q}&rdquo;</p>}
          </div>
          {hasFilters && (
            <Link href="/productos" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              Limpiar filtros
            </Link>
          )}
        </div>

        {/* Empty state */}
        {products.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
              <Package className="h-7 w-7 text-zinc-400" />
            </div>
            <p className="font-semibold text-zinc-700">No hay productos disponibles</p>
            <p className="mt-1 text-sm text-zinc-400">
              {hasFilters ? 'Prueba con otra búsqueda.' : 'Pronto habrá productos de belleza disponibles.'}
            </p>
          </div>
        )}

        {/* Grid */}
        {products.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(p => (
              <Link
                key={p.id}
                href={`/productos/${p.id}`}
                className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
              >
                {/* Image */}
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

                {/* Info */}
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
  )
}
