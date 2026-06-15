import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
} from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import { PublicHeader } from '@/components/ui/public-header'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Belleza Local - Reserva belleza y bienestar cerca de ti',
  description:
    'Encuentra centros de belleza, estética, peluquería y bienestar cerca de ti. Reserva online con disponibilidad real y confirmación inmediata.',
}

async function getFeaturedCenters() {
  try {
    return await prisma.center.findMany({
      where: { published: true },
      include: {
        services: { where: { active: true }, orderBy: { order: 'asc' }, take: 3 },
        reviews: { where: { approved: true }, select: { rating: true }, take: 100 },
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { bookings: { _count: 'desc' } },
      take: 6,
    })
  } catch {
    return []
  }
}

async function getHomeStats() {
  try {
    const [centerCount, confirmedBookings] = await Promise.all([
      prisma.center.count({ where: { published: true } }),
      prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] } } }),
    ])

    return { centerCount, confirmedBookings }
  } catch {
    return { centerCount: 0, confirmedBookings: 0 }
  }
}

const CATEGORIES = [
  { slug: 'PELUQUERIA', label: 'Peluquería', sample: 'Corte, color, brushing' },
  { slug: 'ESTETICA', label: 'Estética', sample: 'Faciales, depilación, rituales' },
  { slug: 'UNAS', label: 'Uñas', sample: 'Gel, semipermanente, nail care' },
  { slug: 'MASAJES', label: 'Masajes', sample: 'Relax, descarga, bienestar' },
  { slug: 'SPA', label: 'Spa', sample: 'Circuitos, tratamientos, calma' },
  { slug: 'COSMETICA', label: 'Cosmética', sample: 'Productos y asesorías' },
]

const VALUE_POINTS = [
  {
    icon: CalendarCheck,
    title: 'Reserva sin llamada',
    text: 'Elige servicio, profesional y hora en una experiencia pensada para móvil.',
  },
  {
    icon: ShieldCheck,
    title: 'Centros verificados',
    text: 'Fichas claras, precios visibles, reseñas y datos útiles antes de decidir.',
  },
  {
    icon: TrendingUp,
    title: 'Herramientas para crecer',
    text: 'Agenda, clientes, bonos y ventas para que cada centro pueda operar mejor.',
  },
]

const BUSINESS_METRICS = [
  { label: 'Agenda online', value: '24/7' },
  { label: 'Tiempo de reserva', value: '< 60s' },
  { label: 'Comisión cliente', value: '0%' },
]

export default async function HomePage() {
  const [centers, stats] = await Promise.all([getFeaturedCenters(), getHomeStats()])

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[#171412]">
      <PublicHeader theme="dark" />

      <section className="relative isolate min-h-[74svh] overflow-hidden bg-[#171412]">
        <Image
          src="/images/beauty-studio-hero.png"
          alt="Estudio de belleza moderno"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,20,18,0.92)_0%,rgba(23,20,18,0.75)_38%,rgba(23,20,18,0.24)_72%,rgba(23,20,18,0.16)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f7f4ef] to-transparent" />

        <div className="relative mx-auto flex min-h-[74svh] max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e9a38f]" />
              Marketplace de belleza y bienestar
            </div>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
              Belleza Local
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80 sm:mt-6 sm:text-lg sm:leading-8">
              Descubre centros cerca de ti, compara servicios y reserva una cita confirmada
              sin esperas. Para clientes exigentes y negocios que quieren una agenda más llena.
            </p>

            <form
              method="GET"
              action="/buscar"
              className="mt-6 grid max-w-2xl gap-2 rounded-lg border border-white/15 bg-white/10 p-2 shadow-2xl shadow-black/20 backdrop-blur-md sm:mt-9 sm:grid-cols-[1fr_180px_auto]"
            >
              <label className="flex min-h-12 items-center gap-3 rounded-md bg-white px-4">
                <Search className="h-4 w-4 shrink-0 text-[#8a7b72]" />
                <input
                  type="text"
                  name="q"
                  placeholder="Servicio, centro o tratamiento"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#171412] outline-none placeholder:text-[#8a7b72]"
                />
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-md bg-white px-4">
                <MapPin className="h-4 w-4 shrink-0 text-[#8a7b72]" />
                <input
                  type="text"
                  name="ciudad"
                  placeholder="Ciudad"
                  className="w-full bg-transparent text-sm font-medium text-[#171412] outline-none placeholder:text-[#8a7b72]"
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#e36952] px-6 text-sm font-bold text-white transition hover:bg-[#d7573e] focus-visible:ring-[#e9a38f]"
              >
                Buscar
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 hidden flex-wrap gap-3 text-sm text-white/75 sm:flex">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <BadgeCheck className="h-4 w-4 text-[#9fc4aa]" />
                Confirmación inmediata
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <Star className="h-4 w-4 text-[#f3c36d]" />
                Reseñas verificadas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <Store className="h-4 w-4 text-[#e9a38f]" />
                {stats.centerCount > 0 ? `${stats.centerCount} centros activos` : 'Primeros centros en alta'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-8 border-y border-[#e5ded3] bg-[#f7f4ef]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {BUSINESS_METRICS.map((metric) => (
            <div key={metric.label} className="flex items-end justify-between border-b border-[#ded5c8] pb-4 sm:border-b-0 sm:border-r sm:pr-6 last:sm:border-r-0">
              <span className="text-sm font-semibold text-[#776a61]">{metric.label}</span>
              <span className="text-3xl font-black tracking-tight text-[#171412]">{metric.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f7f4ef] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e36952]">Explorar</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-tight text-[#171412] sm:text-5xl">
                Tratamientos pensados para decidir rápido.
              </h2>
            </div>
            <Link
              href="/buscar"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#171412] underline decoration-[#e9a38f] decoration-2 underline-offset-4"
            >
              Ver todo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/buscar?categoria=${category.slug}`}
                className="group min-h-36 rounded-lg border border-[#e5ded3] bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-[#d7cbbb] hover:bg-white hover:shadow-[0_24px_60px_-38px_rgba(23,20,18,0.7)]"
              >
                <div className="flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-black tracking-tight text-[#171412]">{category.label}</h3>
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#171412] text-white transition group-hover:bg-[#e36952]">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#776a61]">{category.sample}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f9277]">Centros destacados</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#171412] sm:text-5xl">
                Cerca de ti.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#776a61]">
              Fichas claras, servicios visibles y acceso directo a reserva. Sin dar vueltas.
            </p>
          </div>

          {centers.length === 0 ? (
            <div className="grid gap-6 rounded-lg border border-dashed border-[#d7cbbb] bg-[#f7f4ef] p-8 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-[#171412]">Primeros centros en incorporación</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#776a61]">
                  Si tienes un centro de belleza, puedes preparar tu ficha y empezar a recibir reservas online.
                </p>
              </div>
              <Link
                href="/para-negocios"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#171412] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2d2925]"
              >
                Registrar mi negocio
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {centers.map((center) => {
                const minPrice = center.services.length > 0 ? Math.min(...center.services.map((service) => service.priceCents)) : null
                const avgRating = center.reviews.length > 0
                  ? center.reviews.reduce((sum, review) => sum + review.rating, 0) / center.reviews.length
                  : null
                const categoryLabel = CATEGORY_LABELS[center.category] ?? center.category

                return (
                  <Link
                    key={center.id}
                    href={`/centro/${center.slug}`}
                    className="group overflow-hidden rounded-lg border border-[#e5ded3] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-45px_rgba(23,20,18,0.75)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#eee7dc]">
                      {center.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={center.coverImage}
                          alt={center.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Sparkles className="h-10 w-10 text-[#c7b9aa]" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#171412] backdrop-blur">
                        {categoryLabel}
                      </div>
                      {avgRating && (
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#171412]/88 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                          <Star className="h-3.5 w-3.5 fill-[#f3c36d] text-[#f3c36d]" />
                          {avgRating.toFixed(1)}
                          <span className="font-medium text-white/60">({center._count.reviews})</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black leading-tight tracking-tight text-[#171412]">{center.name}</h3>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#776a61]">
                            <MapPin className="h-3.5 w-3.5" />
                            {center.addressCity}
                            {center.addressProvince && center.addressProvince !== center.addressCity ? `, ${center.addressProvince}` : ''}
                          </p>
                        </div>
                        <span className="rounded-md bg-[#f7f4ef] px-2.5 py-1 text-xs font-bold text-[#776a61]">
                          {minPrice !== null ? `Desde ${formatPrice(minPrice)}` : 'Consultar'}
                        </span>
                      </div>

                      {center.services.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {center.services.map((service) => (
                            <span key={service.id} className="inline-flex items-center gap-1 rounded-full bg-[#f7f4ef] px-2.5 py-1 text-xs font-semibold text-[#776a61]">
                              <Clock3 className="h-3 w-3" />
                              {service.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between border-t border-[#eee7dc] pt-4">
                        <span className="text-sm font-bold text-[#e36952]">Reservar cita</span>
                        <ArrowRight className="h-4 w-4 text-[#e36952] transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#171412] py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e9a38f]">Para negocios</p>
            <h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight sm:text-5xl">
              Una agenda bonita no basta. Tiene que vender.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
              Belleza Local combina ficha pública, reservas, clientes, bonos y productos en un panel pensado para el día a día de un centro real.
            </p>
            <Link
              href="/para-negocios"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-[#171412] transition hover:bg-[#f7f4ef]"
            >
              Ver herramienta para negocios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {VALUE_POINTS.map((point) => (
              <div key={point.title} className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
                <point.icon className="h-5 w-5 text-[#9fc4aa]" />
                <h3 className="mt-5 text-base font-black">{point.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{point.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
