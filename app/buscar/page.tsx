import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, MapPin, Search, SlidersHorizontal, Sparkles, Star } from 'lucide-react'
import { CenterCategory, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'
import { getBenefitsForCenterIds } from '@/app/actions/benefits'
import { getBeautyPacksForCenterIds } from '@/app/actions/beauty-packs'
import { getBeautyProfile } from '@/app/actions/beauty-profile'
import { auth } from '@/lib/auth/config'
import { rankMarketplaceCenters } from '@/lib/marketplace/ranking'

export const metadata: Metadata = {
  title: 'Buscar centros de belleza',
  robots: { index: false },
}

const VALID_CATEGORIES = Object.values(CenterCategory)

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    ciudad?: string
    categoria?: string
    precioMax?: string
    recomendado?: string
    precioClaro?: string
    seguimiento?: string
    beneficios?: string
    packs?: string
  }>
}) {
  const {
    q,
    ciudad,
    categoria,
    precioMax: precioMaxStr,
    recomendado,
    precioClaro,
    seguimiento,
    beneficios,
    packs,
  } = await searchParams
  const recommendedOnly = recomendado === '1'
  const clearPriceOnly = precioClaro === '1'
  const followUpOnly = seguimiento === '1'
  const benefitsOnly = beneficios === '1'
  const packsOnly = packs === '1'

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

  const now = new Date()
  const [centers, session] = await Promise.all([
    prisma.center.findMany({
      where: whereBase,
      include: {
        services: { where: { active: true }, orderBy: { order: 'asc' }, take: 4 },
        reviews: { where: { approved: true }, select: { rating: true }, take: 100 },
        organization: { select: { plan: true } },
        featuredListings: {
          where: ciudad
            ? {
                active: true,
                city: { contains: ciudad, mode: 'insensitive' },
                startsAt: { lte: now },
                endsAt: { gte: now },
                ...(validCategory && { OR: [{ category: validCategory }, { category: null }] }),
              }
            : { id: { equals: '__no_featured_without_city__' } },
          select: { priority: true },
          take: 3,
        },
        _count: { select: { reviews: true, bookings: true } },
      },
      take: 60,
      orderBy: [{ updatedAt: 'desc' }],
    }),
    auth().catch(() => null),
  ])

  const profile = session?.user?.id
    ? await getBeautyProfile(session.user.id).catch(() => null)
    : null
  const centerIds = centers.map(center => center.id)
  const [benefitRows, packRows] = await Promise.all([
    getBenefitsForCenterIds(centerIds),
    getBeautyPacksForCenterIds(centerIds, 100),
  ])
  const benefitsByCenter = new Map<string, typeof benefitRows[number]>()
  for (const benefit of benefitRows) {
    if (benefit.centerId && !benefitsByCenter.has(benefit.centerId)) {
      benefitsByCenter.set(benefit.centerId, benefit)
    }
  }
  const packCountByCenter = new Map<string, number>()
  for (const pack of packRows) {
    packCountByCenter.set(pack.centerId, (packCountByCenter.get(pack.centerId) ?? 0) + 1)
  }

  const rankedCenters = rankMarketplaceCenters(centers, {
    profile,
    benefitCenterIds: new Set(benefitsByCenter.keys()),
    packCountByCenter,
    query: q,
  })
  const visibleCenters = rankedCenters.filter(({ signals }) => (
    (!recommendedOnly || !profile || signals.recommended) &&
    (!clearPriceOnly || signals.hasClearPrice) &&
    (!followUpOnly || signals.hasFollowUp) &&
    (!benefitsOnly || signals.hasBenefit) &&
    (!packsOnly || signals.hasPack)
  ))
  const hasFilters = Boolean(
    q ||
    ciudad ||
    validCategory ||
    precioMaxStr ||
    recommendedOnly ||
    clearPriceOnly ||
    followUpOnly ||
    benefitsOnly ||
    packsOnly
  )
  const resultLabel = visibleCenters.length === 1 ? 'centro encontrado' : 'centros encontrados'
  const recommendedNeedsProfile = recommendedOnly && !profile

  const buildSearchHref = (overrides: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams()
    const values: Record<string, string | null | undefined> = {
      q,
      ciudad,
      categoria: validCategory,
      precioMax: precioMaxStr,
      recomendado: recommendedOnly ? '1' : undefined,
      precioClaro: clearPriceOnly ? '1' : undefined,
      seguimiento: followUpOnly ? '1' : undefined,
      beneficios: benefitsOnly ? '1' : undefined,
      packs: packsOnly ? '1' : undefined,
      ...overrides,
    }

    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value)
    }

    const qs = params.toString()
    return qs ? `/buscar?${qs}` : '/buscar'
  }

  const intentFilters = [
    { key: 'recomendado', label: 'Recomendado para mi', active: recommendedOnly },
    { key: 'precioClaro', label: 'Precio claro', active: clearPriceOnly },
    { key: 'seguimiento', label: 'Seguimiento', active: followUpOnly },
    { key: 'beneficios', label: 'Beneficios', active: benefitsOnly },
    { key: 'packs', label: 'Packs', active: packsOnly },
  ]

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
            {precioMaxStr && <input type="hidden" name="precioMax" value={precioMaxStr} />}
            {recommendedOnly && <input type="hidden" name="recomendado" value="1" />}
            {clearPriceOnly && <input type="hidden" name="precioClaro" value="1" />}
            {followUpOnly && <input type="hidden" name="seguimiento" value="1" />}
            {benefitsOnly && <input type="hidden" name="beneficios" value="1" />}
            {packsOnly && <input type="hidden" name="packs" value="1" />}
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2355c8]">
              {visibleCenters.length > 0 ? `${visibleCenters.length} ${resultLabel}` : 'Sin resultados'}
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

        <div className="mb-7 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {VALID_CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={buildSearchHref({ categoria: validCategory === cat ? null : cat })}
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
          <div className="flex gap-2 overflow-x-auto pb-1">
            {intentFilters.map(filter => (
              <Link
                key={filter.key}
                href={buildSearchHref({ [filter.key]: filter.active ? null : '1' })}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  filter.active
                    ? 'bg-[#2355c8] text-white'
                    : 'border border-[#d8dee9] bg-white text-[#647089] hover:border-[#b9c4d5] hover:text-[#0c1324]'
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>

        {recommendedNeedsProfile && (
          <div className="mb-6 rounded-lg border border-[#c9d8ff] bg-[#eef4ff] px-5 py-4 text-sm text-[#273244]">
            <p className="font-black text-[#0c1324]">Para recomendar de verdad necesitamos tu Beauty Profile.</p>
            <p className="mt-1 text-[#647089]">
              Mientras tanto mantenemos el ranking curado por calidad, precio visible, packs y beneficios.
            </p>
            <Link href="/diagnostico" className="mt-3 inline-flex text-sm font-black text-[#2355c8]">
              Completar Beauty Profile
            </Link>
          </div>
        )}

        {visibleCenters.length === 0 && (
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

        {visibleCenters.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCenters.map(({ center, signals }) => {
              const minPrice = signals.minPriceCents
              const avgRating = signals.averageRating
              const activeBenefit = benefitsByCenter.get(center.id)

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
                    {activeBenefit && (
                      <div className="mt-3 rounded-md bg-[#e7f7f5] px-3 py-2 text-xs font-bold text-[#10786f]">
                        Beneficio activo: {activeBenefit.title}
                      </div>
                    )}
                    <div className="mt-3 rounded-md border border-[#e5eaf2] bg-[#f7f9fc] p-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#2355c8]">Ideal para</p>
                      <p className="mt-1 text-xs leading-5 text-[#46546b]">{signals.idealFor}</p>
                    </div>
                    {signals.reasons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {signals.reasons.map(reason => (
                          <span key={reason} className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-bold text-[#2355c8]">
                            {reason}
                          </span>
                        ))}
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
