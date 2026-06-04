import { Metadata } from 'next'
import Link from 'next/link'
import { Search, MapPin, SlidersHorizontal, Star, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'Buscar centros de belleza',
  robots: { index: false },
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ciudad?: string; categoria?: string }>
}) {
  const { q, ciudad, categoria } = await searchParams

  const centers = await prisma.center.findMany({
    where: {
      published: true,
      ...(ciudad && { addressCity: { contains: ciudad, mode: 'insensitive' } }),
      ...(categoria && { category: categoria.toUpperCase() as never }),
    },
    include: {
      services: { where: { active: true }, take: 3 },
      _count: { select: { reviews: true, bookings: true } },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-900">BellezaLocal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                defaultValue={q}
                placeholder="Servicio, peluquería, masaje..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                defaultValue={ciudad}
                placeholder="Ciudad"
                className="w-28 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">
            {centers.length > 0 ? `${centers.length} centros encontrados` : 'Centros de belleza'}
            {ciudad ? ` en ${ciudad}` : ''}
          </h1>
        </div>

        {centers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <div className="mb-3 text-4xl">🔍</div>
            <p className="font-semibold text-slate-700">No encontramos centros</p>
            <p className="mt-1 text-sm text-slate-400">Prueba con otra ciudad o categoría</p>
            <Link href="/buscar" className="mt-4 inline-block text-sm font-medium text-rose-600 hover:underline">
              Ver todos los centros
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {centers.map((c) => (
              <Link key={c.id} href={`/centro/${c.slug}`} className="group block rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="h-48 overflow-hidden rounded-t-2xl bg-gradient-to-br from-rose-100 to-rose-200">
                  {c.coverImage ? (
                    <img src={c.coverImage} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl opacity-30">✂️</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{c.name}</h3>
                    {c._count.reviews > 0 && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-600">4.8</span>
                      </div>
                    )}
                  </div>
                  <p className="mb-3 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {c.addressCity}
                    <span className="mx-1">·</span>
                    {c.category.charAt(0) + c.category.slice(1).toLowerCase()}
                  </p>
                  {c.services.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {c.services.map((s) => (
                        <span key={s.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          <Clock className="h-3 w-3" />
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    {c.services[0] && (
                      <span className="text-sm font-semibold text-slate-900">
                        Desde {(c.services[0].priceCents / 100).toFixed(0)} €
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-sm font-semibold text-rose-600 group-hover:gap-2 transition-all">
                      Reservar <ArrowRight className="h-4 w-4" />
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
