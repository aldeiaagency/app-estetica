import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS, formatPrice, formatDuration } from '@/lib/utils'
import { MapPin, Phone, Clock, Star, ArrowRight, Sparkles, ChevronRight } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const center = await prisma.center.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, take: 3 } },
  })

  if (!center || !center.published) return { title: 'Centro no encontrado' }

  const serviceNames = center.services.map(s => s.name).join(', ')
  const categoryLabel = CATEGORY_LABELS[center.category] ?? center.category

  return {
    title: `${center.name} — ${center.addressCity} | BellezaLocal`,
    description: `${categoryLabel} en ${center.addressCity}. ${serviceNames ? `Servicios: ${serviceNames}.` : ''} Reserva online.`,
    openGraph: {
      title: `${center.name} — ${center.addressCity}`,
      description: `${categoryLabel} en ${center.addressCity}. Reserva cita online.`,
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
      services: {
        where: { active: true },
        orderBy: { order: 'asc' },
      },
      staff: {
        where: { active: true },
        orderBy: { order: 'asc' },
      },
      scheduleRules: {
        where: { active: true, staffId: null },
        orderBy: { dayOfWeek: 'asc' },
      },
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: { select: { name: true } } },
      },
      _count: { select: { reviews: true } },
    },
  })

  if (!center || !center.published) notFound()

  const categoryLabel = CATEGORY_LABELS[center.category] ?? center.category
  const avgRating = center.reviews.length > 0
    ? center.reviews.reduce((sum, r) => sum + r.rating, 0) / center.reviews.length
    : null

  const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-slate-900">
            <Sparkles className="h-4 w-4 text-rose-600" />
            BellezaLocal
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/buscar" className="hover:text-slate-900">Centros</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900 font-medium">{center.name}</span>
        </div>
      </header>

      {/* COVER */}
      <div className="relative h-56 w-full bg-gradient-to-br from-rose-100 to-rose-200 md:h-72">
        {center.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={center.coverImage} alt={center.name} className="h-full w-full object-cover" />
        )}
        {!center.coverImage && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-rose-300">
              <div className="text-6xl">✂️</div>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16">
        {/* HEADER CARD */}
        <div className="-mt-8 mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                  {categoryLabel}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{center.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {center.addressCity && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {center.addressStreet ? `${center.addressStreet}, ` : ''}{center.addressCity}
                    {center.addressProvince && center.addressProvince !== center.addressCity
                      ? `, ${center.addressProvince}` : ''}
                  </span>
                )}
                {center.phone && (
                  <a href={`tel:${center.phone}`} className="flex items-center gap-1 hover:text-slate-900">
                    <Phone className="h-3.5 w-3.5" />
                    {center.phone}
                  </a>
                )}
                {avgRating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <strong className="text-slate-700">{avgRating.toFixed(1)}</strong>
                    <span>({center._count.reviews} reseñas)</span>
                  </span>
                )}
              </div>
              {center.description && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{center.description}</p>
              )}
            </div>
            <Link
              href={`/centro/${center.slug}/reservar`}
              className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              Reservar cita <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* MAIN */}
          <div className="space-y-6">
            {/* SERVICIOS */}
            <div className="rounded-2xl border border-slate-100 bg-white">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-bold text-slate-900">Servicios</h2>
              </div>
              {center.services.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-slate-400">
                  Próximamente servicios disponibles
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {center.services.map((svc) => (
                    <div key={svc.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{svc.name}</p>
                        {svc.description && (
                          <p className="mt-0.5 text-sm text-slate-500 truncate">{svc.description}</p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(svc.durationMinutes)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-slate-900">{formatPrice(svc.priceCents)}</span>
                        <Link
                          href={`/centro/${center.slug}/reservar?servicio=${svc.id}`}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
                        >
                          Reservar
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STAFF */}
            {center.staff.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="font-bold text-slate-900">Equipo</h2>
                </div>
                <div className="flex flex-wrap gap-4 p-6">
                  {center.staff.map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                        {s.role && <p className="text-xs text-slate-500">{s.role}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESEÑAS */}
            {center.reviews.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h2 className="font-bold text-slate-900">Reseñas</h2>
                  {avgRating && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-900">{avgRating.toFixed(1)}</span>
                      <span className="text-sm text-slate-500">({center._count.reviews})</span>
                    </div>
                  )}
                </div>
                <div className="divide-y divide-slate-50">
                  {center.reviews.map((review) => (
                    <div key={review.id} className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{review.customer.name}</span>
                      </div>
                      {review.comment && (
                        <p className="mt-1.5 text-sm text-slate-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-4">
            {/* CTA STICKY */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="mb-1 text-sm font-semibold text-slate-700">Disponibilidad real</p>
              <p className="mb-4 text-xs text-slate-500">Elige fecha y hora en segundos, sin llamar.</p>
              <Link
                href={`/centro/${center.slug}/reservar`}
                className="block w-full rounded-xl bg-rose-600 py-3 text-center font-semibold text-white hover:bg-rose-700 transition-colors"
              >
                Ver disponibilidad
              </Link>
            </div>

            {/* HORARIOS */}
            {center.scheduleRules.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Horario
                </h3>
                <div className="space-y-2">
                  {center.scheduleRules.map((r) => (
                    <div key={r.id} className="flex justify-between text-sm">
                      <span className="text-slate-600">{DAY_NAMES[r.dayOfWeek]}</span>
                      <span className="font-medium text-slate-900">{r.openTime} – {r.closeTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UBICACIÓN */}
            {(center.addressStreet || center.addressCity) && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Ubicación
                </h3>
                <p className="text-sm text-slate-600">
                  {center.addressStreet && <>{center.addressStreet}<br /></>}
                  {center.addressPostalCode && <>{center.addressPostalCode} </>}
                  {center.addressCity}
                  {center.addressProvince && center.addressProvince !== center.addressCity
                    ? `, ${center.addressProvince}` : ''}
                </p>
                {center.phone && (
                  <a href={`tel:${center.phone}`} className="mt-2 flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700">
                    <Phone className="h-3.5 w-3.5" />
                    {center.phone}
                  </a>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
