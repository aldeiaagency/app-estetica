import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Clock3,
  Gift,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
} from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Belleza Local - Tu belleza, bien elegida',
  description:
    'Crea tu perfil de belleza y descubre que hacerte, que comprar y cuando repetir segun tu objetivo, presupuesto y estilo.',
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

async function getMarketplaceHighlights() {
  try {
    const [products, bonos] = await Promise.all([
      prisma.product.findMany({
        where: { active: true, center: { published: true } },
        include: {
          center: { select: { name: true, slug: true, addressCity: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy: [{ orderItems: { _count: 'desc' } }, { createdAt: 'desc' }],
        take: 4,
      }),
      prisma.bono.findMany({
        where: { active: true, center: { published: true } },
        include: {
          center: { select: { name: true, slug: true, addressCity: true } },
          service: { select: { name: true } },
          _count: { select: { instances: true } },
        },
        orderBy: [{ instances: { _count: 'desc' } }, { createdAt: 'desc' }],
        take: 3,
      }),
    ])

    return { products, bonos }
  } catch {
    return { products: [], bonos: [] }
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
    icon: Sparkles,
    title: 'Beauty Profile',
    text: 'Tu objetivo, estilo, presupuesto y nivel de mantenimiento en una lectura sencilla.',
  },
  {
    icon: ShieldCheck,
    title: 'Recomendación honesta',
    text: 'Mostramos qué tiene sentido para ti y qué conviene evitar por ahora.',
  },
  {
    icon: CalendarCheck,
    title: 'Reserva con contexto',
    text: 'Cuando eliges un centro o producto, sabes por qué encaja con tu plan.',
  },
]

const BUSINESS_METRICS = [
  { label: 'Crea tu perfil', value: '01' },
  { label: 'Recibe tu plan', value: '02' },
  { label: 'Reserva o compra mejor', value: '03' },
]

export default async function HomePage() {
  const [centers, stats, marketplace] = await Promise.all([
    getFeaturedCenters(),
    getHomeStats(),
    getMarketplaceHighlights(),
  ])

  return (
    <div className="min-h-screen bg-[#f1f4f8] text-[#0c1324]">
      <PublicHeader theme="dark" />

      <section className="relative isolate min-h-[74svh] overflow-hidden bg-[#0c1324]">
        <Image
          src="/images/beauty-studio-hero.png"
          alt="Estudio de belleza moderno"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,19,36,0.92)_0%,rgba(12,19,36,0.75)_38%,rgba(12,19,36,0.24)_72%,rgba(12,19,36,0.16)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f1f4f8] to-transparent" />

        <div className="relative mx-auto flex min-h-[74svh] max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9db8ff]" />
              Beauty concierge personal
            </div>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
              Tu belleza, bien elegida.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80 sm:mt-6 sm:text-lg sm:leading-8">
              Crea tu perfil de belleza y descubre qué hacerte, qué comprar y cuándo repetir
              según tu objetivo, tu presupuesto y tu estilo. Con centros verificados y reserva fácil.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/diagnostico"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#2f6df6] px-6 text-sm font-bold text-white transition hover:bg-[#2559d8] focus-visible:ring-[#9db8ff]"
              >
                Crear mi Beauty Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/buscar"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-6 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Buscar centros cerca de mí
              </Link>
            </div>

            <form
              method="GET"
              action="/buscar"
              className="mt-5 grid max-w-2xl gap-2 rounded-lg border border-white/15 bg-white/10 p-2 shadow-2xl shadow-black/20 backdrop-blur-md sm:grid-cols-[1fr_180px_auto]"
            >
              <label className="flex min-h-12 items-center gap-3 rounded-md bg-white px-4">
                <Search className="h-4 w-4 shrink-0 text-[#8b96aa]" />
                <input
                  type="text"
                  name="q"
                  placeholder="Servicio, centro o tratamiento"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#0c1324] outline-none placeholder:text-[#8b96aa]"
                />
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-md bg-white px-4">
                <MapPin className="h-4 w-4 shrink-0 text-[#8b96aa]" />
                <input
                  type="text"
                  name="ciudad"
                  placeholder="Ciudad"
                  className="w-full bg-transparent text-sm font-medium text-[#0c1324] outline-none placeholder:text-[#8b96aa]"
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#2f6df6] px-6 text-sm font-bold text-white transition hover:bg-[#2559d8] focus-visible:ring-[#9db8ff]"
              >
                Buscar
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 hidden flex-wrap gap-3 text-sm text-white/75 sm:flex">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <BadgeCheck className="h-4 w-4 text-[#9fc4aa]" />
                Recomendaciones personalizadas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <Star className="h-4 w-4 text-[#f3c36d]" />
                Sin comprar a ciegas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <Store className="h-4 w-4 text-[#9db8ff]" />
                {stats.centerCount > 0 ? `${stats.centerCount} centros activos` : 'Primeros centros en alta'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-8 border-y border-[#d8dee9] bg-[#f1f4f8]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {BUSINESS_METRICS.map((metric) => (
            <div key={metric.label} className="flex items-end justify-between border-b border-[#d8dee9] pb-4 sm:border-b-0 sm:border-r sm:pr-6 last:sm:border-r-0">
              <span className="text-sm font-semibold text-[#647089]">{metric.label}</span>
              <span className="text-3xl font-black tracking-tight text-[#0c1324]">{metric.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f1f4f8] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2f6df6]">Después del perfil</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-tight text-[#0c1324] sm:text-5xl">
                Elige por objetivo, no por catálogo infinito.
              </h2>
            </div>
            <Link
              href="/buscar"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0c1324] underline decoration-[#9db8ff] decoration-2 underline-offset-4"
            >
              Explorar centros
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/buscar?categoria=${category.slug}`}
                className="group min-h-36 rounded-lg border border-[#d8dee9] bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-[#d8dee9] hover:bg-white hover:shadow-[0_24px_60px_-38px_rgba(12,19,36,0.7)]"
              >
                <div className="flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-black tracking-tight text-[#0c1324]">{category.label}</h3>
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0c1324] text-white transition group-hover:bg-[#2f6df6]">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#647089]">{category.sample}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2f6df6]">Productos y rutinas</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-tight text-[#0c1324] sm:text-5xl">
                Compra mejor y repón a tiempo.
              </h2>
            </div>
            <div className="max-w-xl lg:justify-self-end">
              <p className="text-sm leading-6 text-[#647089]">
                El objetivo no es llenar el baño de productos. Es encontrar lo que encaja con tu rutina,
                tu presupuesto y el resultado que quieres mantener.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/productos" className="btn-primary py-2 text-xs">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Ver productos
                </Link>
                <Link href="/buscar" className="btn-outline py-2 text-xs">
                  Encontrar centros
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <h3 className="text-lg font-black text-[#0c1324]">Productos para decidir mejor</h3>
                <Link href="/productos" className="text-sm font-bold text-[#2355c8] hover:text-[#2f6df6]">
                  Ver marketplace
                </Link>
              </div>

              {marketplace.products.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {marketplace.products.map(product => (
                    <Link
                      key={product.id}
                      href={`/productos/${product.id}`}
                      className="group grid min-h-36 grid-cols-[104px_1fr] overflow-hidden rounded-lg border border-[#d8dee9] bg-[#f7f9fc] transition hover:-translate-y-0.5 hover:border-[#b9c4d5] hover:bg-white hover:shadow-[0_24px_60px_-42px_rgba(12,19,36,0.8)]"
                    >
                      <div className="relative overflow-hidden bg-[#e5eaf2]">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-7 w-7 text-[#8b96aa]" />
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-col justify-between p-4">
                        <div>
                          {product.brand && <p className="text-[10px] font-black uppercase tracking-wider text-[#647089]">{product.brand}</p>}
                          <p className="mt-1 line-clamp-2 font-black leading-tight text-[#0c1324] transition-colors group-hover:text-[#2355c8]">
                            {product.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#647089]">
                            {product.center.name} - {product.center.addressCity}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="font-black text-[#0c1324]">{formatPrice(product.priceCents)}</span>
                          <span className="rounded-full bg-[#e5edff] px-2.5 py-1 text-[11px] font-black text-[#2355c8]">
                            {product._count.orderItems > 0 ? `${product._count.orderItems} pedidos` : 'Nuevo'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ['Cosmetica profesional', 'Rutinas faciales, cremas y serum recomendados por centros.'],
                    ['Cuidado capilar', 'Tratamientos, mascarillas y productos para mantener el resultado.'],
                    ['Bienestar en casa', 'Aceites, kits y detalles para continuar el ritual despues de la cita.'],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-lg border border-dashed border-[#d8dee9] bg-[#f7f9fc] p-5">
                      <Package className="h-5 w-5 text-[#2f6df6]" />
                      <p className="mt-4 font-black text-[#0c1324]">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#647089]">{text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Gift className="h-4 w-4 text-[#2f6df6]" />
                <h3 className="text-lg font-black text-[#0c1324]">Packs para mantener resultados</h3>
              </div>

              {marketplace.bonos.length > 0 ? (
                <div className="space-y-3">
                  {marketplace.bonos.map(bono => (
                    <Link
                      key={bono.id}
                      href={`/bono/${bono.id}`}
                      className="block rounded-lg border border-[#d8dee9] bg-[#f7f9fc] p-4 transition hover:-translate-y-0.5 hover:border-[#b9c4d5] hover:bg-white hover:shadow-[0_24px_60px_-42px_rgba(12,19,36,0.8)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-black text-[#0c1324]">{bono.name}</p>
                          <p className="mt-1 truncate text-xs text-[#647089]">
                            {bono.center.name} - {bono.center.addressCity}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#e5edff] px-2.5 py-1 text-xs font-black text-[#2355c8]">
                          {formatPrice(bono.priceCents)}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#647089]">
                        <span className="rounded-full bg-white px-2.5 py-1 font-bold">{bono.sessions} sesiones</span>
                        <span className="rounded-full bg-white px-2.5 py-1 font-bold">{bono.validityDays} dias</span>
                        <span className="rounded-full bg-white px-2.5 py-1 font-bold">
                          {bono._count.instances > 0 ? `${bono._count.instances} vendidos` : (bono.service?.name ?? 'Flexible')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-[#d8dee9] bg-[#0c1324] p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9db8ff]">Ejemplo de bono</p>
                  <h3 className="mt-3 text-2xl font-black tracking-tight">Plan piel luminosa 30 días</h3>
                  <p className="mt-3 text-sm leading-6 text-white/64">
                    Un ejemplo de pack por objetivo: perfil, servicio recomendado y mantenimiento sencillo.
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-sm text-white/64">Ahorro frente a sesiones sueltas</span>
                    <span className="font-black text-white">Desde 49 EUR</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f9277]">Centros destacados</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0c1324] sm:text-5xl">
                Cerca de ti.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#647089]">
              Fichas claras, precios visibles y señales de encaje para que no elijas solo por cercanía.
            </p>
          </div>

          {centers.length === 0 ? (
            <div className="grid gap-6 rounded-lg border border-dashed border-[#d8dee9] bg-[#f1f4f8] p-8 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-[#0c1324]">Primeros centros en incorporación</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#647089]">
                  Si tienes un centro de belleza, puedes preparar tu ficha y empezar a recibir reservas online.
                </p>
              </div>
              <Link
                href="/para-negocios"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0c1324] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1f2a44]"
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
                    className="group overflow-hidden rounded-lg border border-[#d8dee9] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-45px_rgba(12,19,36,0.75)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#e5eaf2]">
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
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#0c1324] backdrop-blur">
                        {categoryLabel}
                      </div>
                      {avgRating && (
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#0c1324]/88 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                          <Star className="h-3.5 w-3.5 fill-[#f3c36d] text-[#f3c36d]" />
                          {avgRating.toFixed(1)}
                          <span className="font-medium text-white/60">({center._count.reviews})</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black leading-tight tracking-tight text-[#0c1324]">{center.name}</h3>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#647089]">
                            <MapPin className="h-3.5 w-3.5" />
                            {center.addressCity}
                            {center.addressProvince && center.addressProvince !== center.addressCity ? `, ${center.addressProvince}` : ''}
                          </p>
                        </div>
                        <span className="rounded-md bg-[#f1f4f8] px-2.5 py-1 text-xs font-bold text-[#647089]">
                          {minPrice !== null ? `Desde ${formatPrice(minPrice)}` : 'Consultar'}
                        </span>
                      </div>

                      {center.services.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {center.services.map((service) => (
                            <span key={service.id} className="inline-flex items-center gap-1 rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs font-semibold text-[#647089]">
                              <Clock3 className="h-3 w-3" />
                              {service.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between border-t border-[#e5eaf2] pt-4">
                        <span className="text-sm font-bold text-[#2f6df6]">Reservar cita</span>
                        <ArrowRight className="h-4 w-4 text-[#2f6df6] transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#0c1324] py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9db8ff]">Para negocios</p>
            <h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight sm:text-5xl">
              Una agenda no basta. Tus clientas tienen que volver.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
              Belleza Local ayuda a convertir clientas puntuales en clientas recurrentes con packs, productos, beneficios y seguimiento postservicio.
            </p>
            <Link
              href="/para-negocios"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-[#0c1324] transition hover:bg-[#f1f4f8]"
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
      <PublicFooter />
    </div>
  )
}
