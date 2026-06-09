import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS, formatPrice, formatDuration } from '@/lib/utils'
import { centerJsonLd } from '@/lib/seo/metadata'
import { MapPin, Phone, Clock, Star, ArrowRight, ChevronRight, Sparkles, Gift, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { PublicHeader } from '@/components/ui/public-header'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const center = await prisma.center.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, take: 3 } },
  })
  if (!center || !center.published) return { title: 'Centro no encontrado' }

  const serviceNames  = center.services.map(s => s.name).join(', ')
  const categoryLabel = CATEGORY_LABELS[center.category] ?? center.category

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'
  return {
    title: `${center.name} — ${center.addressCity} | BellezaLocal`,
    description: `${categoryLabel} en ${center.addressCity}. ${serviceNames ? `Servicios: ${serviceNames}.` : ''} Reserva online.`,
    alternates: { canonical: `${appUrl}/centro/${slug}` },
    openGraph: {
      title: `${center.name} — ${center.addressCity}`,
      description: `${categoryLabel} en ${center.addressCity}. Reserva cita online.`,
      url: `${appUrl}/centro/${slug}`,
      images: center.coverImage ? [{ url: center.coverImage }] : [],
    },
    robots: center.services.length === 0 ? { index: false } : { index: true },
  }
}

export default async function CenterPage({ params }: Props) {
  const { slug } = await params

  const center = await prisma.center.findUnique({
    where: { slug },
    include: {
      services:      { where: { active: true }, orderBy: { order: 'asc' } },
      staff:         { where: { active: true }, orderBy: { order: 'asc' } },
      scheduleRules: { where: { active: true, staffId: null }, orderBy: { dayOfWeek: 'asc' } },
      reviews:       { where: { approved: true }, orderBy: { createdAt: 'desc' }, take: 6, include: { customer: { select: { name: true } } } },
      bonos:         { where: { active: true }, take: 4 },
      products:      { where: { active: true }, take: 4 },
      _count:        { select: { reviews: true } },
    },
  })

  if (!center || !center.published) notFound()

  const categoryLabel = CATEGORY_LABELS[center.category] ?? center.category
  const avgRating = center.reviews.length > 0
    ? center.reviews.reduce((sum, r) => sum + r.rating, 0) / center.reviews.length
    : null

  const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  const SCHEMA_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  const openingHours = center.scheduleRules.map(
    r => `${SCHEMA_DAYS[r.dayOfWeek]} ${r.openTime}-${r.closeTime}`
  )
  const jsonLd = centerJsonLd({
    name:          center.name,
    description:   center.description,
    addressStreet: center.addressStreet ?? '',
    addressCity:   center.addressCity   ?? '',
    phone:         center.phone,
    slug:          center.slug,
    coverImage:    center.coverImage,
    averageRating: avgRating ?? undefined,
    reviewCount:   center._count.reviews > 0 ? center._count.reviews : undefined,
    openingHours,
  })

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="min-h-screen bg-zinc-50">
      <PublicHeader />

      {/* Breadcrumb */}
      <div className="border-b border-zinc-200 bg-white px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-600 transition-colors">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/buscar" className="hover:text-zinc-600 transition-colors">Centros</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-zinc-700">{center.name}</span>
        </div>
      </div>

      {/* Cover */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-primary-100 via-primary-50 to-beauty-50 md:h-80">
        {center.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={center.coverImage} alt={center.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Sparkles className="h-16 w-16 text-primary-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16">
        {/* Header card */}
        <div className="-mt-10 mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="badge-violet">{categoryLabel}</span>
                {avgRating && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {avgRating.toFixed(1)} ({center._count.reviews} reseñas)
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{center.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                {center.addressCity && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                    {center.addressStreet ? `${center.addressStreet}, ` : ''}{center.addressCity}
                    {center.addressProvince && center.addressProvince !== center.addressCity ? `, ${center.addressProvince}` : ''}
                  </span>
                )}
                {center.phone && (
                  <a href={`tel:${center.phone}`} className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors">
                    <Phone className="h-4 w-4 shrink-0 text-zinc-400" />{center.phone}
                  </a>
                )}
              </div>
              {center.description && (
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 max-w-2xl">{center.description}</p>
              )}
            </div>
            <Link
              href={`/centro/${center.slug}/reservar`}
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 active:scale-[0.97]"
            >
              Reservar cita <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* MAIN */}
          <div className="space-y-6">

            {/* Servicios */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-6 py-4">
                <h2 className="font-bold text-zinc-900">Servicios</h2>
              </div>
              {center.services.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-zinc-400">Próximamente servicios disponibles</div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {center.services.map((svc) => (
                    <div key={svc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900">{svc.name}</p>
                        {svc.description && <p className="mt-0.5 truncate text-sm text-zinc-400">{svc.description}</p>}
                        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                          <Clock className="h-3 w-3" />{formatDuration(svc.durationMinutes)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-zinc-900">{formatPrice(svc.priceCents)}</span>
                        <Link
                          href={`/centro/${center.slug}/reservar?servicio=${svc.id}`}
                          className="rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-primary-500/20 transition-all hover:bg-primary-700 active:scale-[0.97]"
                        >
                          Reservar
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bonos */}
            {center.bonos.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-100 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-bold text-zinc-900">
                    <Gift className="h-4 w-4 text-primary-500" />Bonos disponibles
                  </h2>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-2">
                  {center.bonos.map((bono) => (
                    <div key={bono.id} className="flex flex-col rounded-2xl border border-primary-100 bg-primary-50 p-4">
                      <p className="font-semibold text-zinc-900">{bono.name}</p>
                      {bono.description && <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{bono.description}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-zinc-500">
                          {bono.sessions} sesiones · {bono.validityDays}d validez
                        </div>
                        <span className="font-bold text-primary-600">{formatPrice(bono.priceCents)}</span>
                      </div>
                      <Link
                        href={`/bono/${bono.id}`}
                        className="mt-3 flex w-full items-center justify-center rounded-xl bg-primary-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
                      >
                        Comprar bono
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Productos */}
            {center.products.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-100 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-bold text-zinc-900">
                    <ShoppingBag className="h-4 w-4 text-primary-500" />Productos
                  </h2>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-2">
                  {center.products.map((p) => (
                    <div key={p.id} className="flex flex-col rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                          <ShoppingBag className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 truncate">{p.name}</p>
                          {p.brand && <p className="text-xs text-zinc-400">{p.brand}</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-bold text-zinc-900">{formatPrice(p.priceCents)}</p>
                          {p.stock !== null && p.stock !== undefined && (
                            <p className={`text-xs ${p.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/productos/${p.id}`}
                        className="mt-3 flex w-full items-center justify-center rounded-xl bg-primary-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
                      >
                        Ver producto
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff */}
            {center.staff.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-100 px-6 py-4">
                  <h2 className="font-bold text-zinc-900">Nuestro equipo</h2>
                </div>
                <div className="flex flex-wrap gap-4 p-6">
                  {center.staff.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 pr-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-sm">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{s.name}</p>
                        {s.role && <p className="text-xs text-zinc-400">{s.role}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {center.reviews.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                  <h2 className="font-bold text-zinc-900">Reseñas verificadas</h2>
                  {avgRating && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-zinc-900">{avgRating.toFixed(1)}</span>
                      <span className="text-sm text-zinc-400">({center._count.reviews})</span>
                    </div>
                  )}
                </div>
                <div className="divide-y divide-zinc-50">
                  {center.reviews.map((review) => (
                    <div key={review.id} className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`} />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-zinc-700">{review.customer.name}</span>
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />Verificada
                        </div>
                      </div>
                      {review.comment && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-4">
            {/* CTA */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="mb-1 font-semibold text-zinc-900">Disponibilidad real</p>
              <p className="mb-4 text-xs text-zinc-400">Elige fecha y hora en segundos, sin llamar.</p>
              <Link
                href={`/centro/${center.slug}/reservar`}
                className="block w-full rounded-xl bg-primary-600 py-3 text-center font-semibold text-white shadow-sm shadow-primary-500/20 transition-all hover:bg-primary-700 active:scale-[0.97]"
              >
                Ver disponibilidad
              </Link>
              <Link
                href={`/centro/${center.slug}/reservar`}
                className="mt-2 block w-full rounded-xl border border-zinc-200 py-2.5 text-center text-sm font-medium text-zinc-600 transition-all hover:bg-zinc-50"
              >
                Reservar ahora
              </Link>
            </div>

            {/* Schedule */}
            {center.scheduleRules.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900">
                  <Clock className="h-4 w-4 text-zinc-400" />Horario
                </h3>
                <div className="space-y-2">
                  {center.scheduleRules.map((r) => (
                    <div key={r.id} className="flex justify-between text-sm">
                      <span className="text-zinc-600">{DAY_NAMES[r.dayOfWeek]}</span>
                      <span className="font-medium text-zinc-900">{r.openTime} – {r.closeTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {(center.addressStreet || center.addressCity) && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900">
                  <MapPin className="h-4 w-4 text-zinc-400" />Ubicación
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {center.addressStreet && <>{center.addressStreet}<br /></>}
                  {center.addressPostalCode && <>{center.addressPostalCode} </>}
                  {center.addressCity}
                  {center.addressProvince && center.addressProvince !== center.addressCity ? `, ${center.addressProvince}` : ''}
                </p>
                {center.phone && (
                  <a href={`tel:${center.phone}`} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                    <Phone className="h-3.5 w-3.5" />{center.phone}
                  </a>
                )}
              </div>
            )}

            {/* Trust */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <div className="space-y-2.5">
                {[
                  'Disponibilidad en tiempo real',
                  'Confirmación instantánea por email',
                  'Cancelación gratuita (24h antes)',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-600">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />{item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
    </>
  )
}
