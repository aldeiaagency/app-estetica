import { Metadata } from 'next'
import Link from 'next/link'
import {
  Sparkles, Search, MapPin, ArrowRight, Star,
  Scissors, Wand2, Flame, Zap, Heart, Waves,
  CheckCircle2, Building2, TrendingUp, Shield
} from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import { PublicHeader } from '@/components/ui/public-header'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Belleza Local — Reserva en centros de belleza cerca de ti',
  description:
    'Encuentra y reserva en los mejores centros de belleza, estética, peluquería y bienestar cerca de ti. Disponibilidad real. Sin llamar.',
}

async function getFeaturedCenters() {
  return prisma.center.findMany({
    where: { published: true },
    include: {
      services: { where: { active: true }, orderBy: { order: 'asc' }, take: 3 },
      reviews:  { where: { approved: true }, select: { rating: true }, take: 100 },
      _count:   { select: { bookings: true } },
    },
    orderBy: { bookings: { _count: 'desc' } },
    take: 6,
  })
}

async function getHomeStats() {
  const [centerCount, confirmedBookings] = await Promise.all([
    prisma.center.count({ where: { published: true } }),
    prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] } } }),
  ])
  return { centerCount, confirmedBookings }
}

const CATEGORIES = [
  { slug: 'PELUQUERIA', label: 'Peluquería', icon: Scissors, color: 'from-violet-500 to-violet-700' },
  { slug: 'UNAS',       label: 'Uñas',       icon: Wand2,    color: 'from-pink-400 to-rose-500'     },
  { slug: 'ESTETICA',   label: 'Estética',   icon: Flame,    color: 'from-amber-400 to-orange-500'  },
  { slug: 'DEPILACION', label: 'Depilación', icon: Zap,      color: 'from-cyan-400 to-cyan-600'     },
  { slug: 'MASAJES',    label: 'Masajes',    icon: Heart,    color: 'from-emerald-400 to-emerald-600'},
  { slug: 'SPA',        label: 'Spa',        icon: Waves,    color: 'from-indigo-400 to-indigo-600' },
]

const STEPS = [
  { n: '01', title: 'Busca tu servicio',    desc: 'Peluquería, uñas, masajes... Filtra por ciudad y disponibilidad.' },
  { n: '02', title: 'Elige fecha y hora',   desc: 'Disponibilidad en tiempo real. Sin llamadas, sin esperas.' },
  { n: '03', title: 'Confirma al instante', desc: 'Recibe confirmación y recordatorio automático por email.' },
]

const BUSINESS_FEATURES = [
  'Agenda online 24/7 — tus clientes reservan solas',
  'Recordatorios automáticos que eliminan no-shows',
  'CRM con historial completo de cada cliente',
  'Venta de bonos y productos desde tu perfil',
  'Analíticas de ingresos, ocupación y servicios top',
  'Destaca en búsquedas del marketplace',
]

export default async function HomePage() {
  const [centers, stats] = await Promise.all([getFeaturedCenters(), getHomeStats()])

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ─── HEADER ─── */}
      <PublicHeader theme="dark" />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-[#09090B] pb-24 pt-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary-600/20 blur-[120px]" />
          <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-beauty-500/15 blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-primary-800/15 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold text-primary-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-400" />
              </span>
              Disponibilidad real · Sin llamadas
            </span>
          </div>
          <h1 className="mx-auto max-w-4xl text-center text-5xl font-black leading-[1.05] tracking-tight text-white md:text-7xl">
            La belleza que mereces,{' '}
            <span className="bg-gradient-to-r from-primary-400 via-beauty-400 to-beauty-500 bg-clip-text text-transparent">
              cuando quieras
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-zinc-400">
            Encuentra y reserva en los mejores centros de tu ciudad. Cita confirmada en menos de 60 segundos.
          </p>
          <form method="GET" action="/buscar" className="mx-auto mt-10 max-w-2xl">
            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/8 bg-white/8 px-4 py-3 focus-within:border-primary-500/60 transition-all">
                <Search className="h-4 w-4 shrink-0 text-zinc-500" />
                <input type="text" name="q" placeholder="Servicio, peluquería, masaje..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500" />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/8 px-4 py-3 focus-within:border-primary-500/60 transition-all">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-500" />
                <input type="text" name="ciudad" placeholder="Ciudad" className="w-32 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500" />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/30 transition-all hover:bg-primary-700 active:scale-[0.97]">
                <Search className="h-4 w-4" />Buscar
              </button>
            </div>
          </form>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
            {stats.centerCount > 0 ? (
              <>
                <span>
                  <strong className="text-zinc-300">{stats.centerCount}</strong>{' '}
                  {stats.centerCount === 1 ? 'centro activo' : 'centros activos'}
                </span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
              </>
            ) : null}
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Confirmación inmediata
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-700" />
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary-400" />
              Sin comisiones para clientes
            </span>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <p className="section-eyebrow">Servicios</p>
            <h2 className="section-title mt-2">Elige tu tratamiento</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/buscar?categoria=${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-5 text-center transition-all duration-200 hover:border-zinc-200 hover:bg-white hover:shadow-card-hover hover:-translate-y-0.5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color} shadow-lg transition-transform group-hover:scale-110`}>
                  <cat.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED CENTERS ─── */}
      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="section-eyebrow">Centros</p>
              <h2 className="section-title mt-2">Cerca de ti</h2>
            </div>
            <Link href="/buscar" className="hidden items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:flex">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {centers.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                <Building2 className="h-7 w-7 text-zinc-400" />
              </div>
              <p className="font-semibold text-zinc-600">Primeros centros en incorporación</p>
              <p className="mt-1 text-sm text-zinc-400">¿Tienes un centro de belleza? Únete gratis.</p>
              <Link href="/para-negocios" className="btn-primary mt-5 inline-flex">Registrar mi negocio</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {centers.map((c) => {
                const minPrice = c.services.length > 0 ? Math.min(...c.services.map(s => s.priceCents)) : null
                const avgRating = c.reviews.length > 0 ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length : null
                const categoryLabel = CATEGORY_LABELS[c.category] ?? c.category
                return (
                  <Link key={c.id} href={`/centro/${c.slug}`}
                    className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary-100 via-primary-50 to-beauty-50">
                      {c.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.coverImage} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Sparkles className="h-12 w-12 text-primary-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 backdrop-blur">{categoryLabel}</span>
                      </div>
                      {avgRating && (
                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-zinc-700 backdrop-blur shadow-sm">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{avgRating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-bold text-zinc-900 transition-colors group-hover:text-primary-600 leading-snug">{c.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                        <MapPin className="h-3 w-3 shrink-0" />{c.addressCity}{c.addressProvince && c.addressProvince !== c.addressCity ? `, ${c.addressProvince}` : ''}
                      </p>
                      {c.services.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.services.map((s) => <span key={s.id} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">{s.name}</span>)}
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                        {minPrice !== null ? (
                          <span className="text-sm font-bold text-zinc-900">Desde {formatPrice(minPrice)}</span>
                        ) : (
                          <span className="text-sm text-zinc-400">Consultar</span>
                        )}
                        <span className="flex items-center gap-1 text-sm font-semibold text-primary-600">
                          Reservar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <p className="section-eyebrow">Proceso</p>
            <h2 className="section-title mt-2">Reserva en 3 pasos</h2>
            <p className="section-subtitle">Menos de 60 segundos. Sin registro obligatorio.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-1/2 top-7 hidden h-0.5 w-full translate-x-[35%] bg-gradient-to-r from-zinc-200 to-transparent md:block" />
                )}
                <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg shadow-primary-500/25">
                  <span className="text-xl font-black text-white">{step.n}</span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR BUSINESS ─── */}
      <section className="relative overflow-hidden bg-[#09090B] py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-primary-700/20 blur-[100px]" />
          <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-beauty-600/10 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-primary-400">Para negocios</p>
              <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">Tu agenda, siempre llena</h2>
              <p className="mt-4 text-lg text-zinc-400">
                Gestiona tu agenda, servicios, clientes y ventas desde un solo lugar. Empieza a recibir reservas online en menos de 10 minutos, sin llamadas.
              </p>
              <ul className="mt-8 space-y-3">
                {BUSINESS_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-400" />{f}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/para-negocios" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-700 active:scale-[0.97]">
                  Empezar gratis <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/para-negocios#planes" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:border-white/30 hover:text-white">
                  Ver planes y precios
                </Link>
              </div>
            </div>
            {/* Mock widget */}
            <div className="hidden lg:block">
              <div className="rounded-3xl border border-white/10 bg-[#111115] p-6 shadow-2xl shadow-black/50">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Agenda de hoy</span>
                  <span className="rounded-full bg-primary-500/15 px-2.5 py-0.5 text-xs font-semibold text-primary-300">6 citas</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'María García', service: 'Corte y tinte',     time: '10:00', ok: true  },
                    { name: 'Sofía López',  service: 'Manicura gel',      time: '11:30', ok: true  },
                    { name: 'Ana Martín',  service: 'Depilación',         time: '13:00', ok: false },
                    { name: 'Laura Ruiz',  service: 'Masaje relajante',   time: '16:00', ok: true  },
                  ].map((b, i) => (
                    <div key={i} className={`flex items-center gap-3 rounded-xl border-l-[3px] bg-white/5 px-4 py-3 ${b.ok ? 'border-l-emerald-500' : 'border-l-amber-400'}`}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600/20 text-xs font-bold text-primary-300">{b.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{b.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{b.service}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-white">{b.time}</p>
                        <p className={`text-xs ${b.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{b.ok ? 'Confirmada' : 'Pendiente'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/8 pt-4">
                  {[
                    { label: 'Ingresos', Icon: TrendingUp },
                    { label: 'Ocupación', Icon: Zap       },
                    { label: 'Clientes',  Icon: Heart     },
                  ].map((k, i) => (
                    <div key={i} className="rounded-xl bg-white/5 p-3 text-center">
                      <k.Icon className="mx-auto mb-1 h-4 w-4 text-primary-400" />
                      <div className="mx-auto mb-1 h-3 w-10 rounded bg-white/10" />
                      <p className="text-xs text-zinc-500">{k.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST ─── */}
      <section className="bg-zinc-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            {[
              { Icon: Shield,   value: 'Gratis para clientes',  desc: 'Sin comisiones. Reserva sin crear cuenta.' },
              { Icon: Zap,      value: 'Confirmación inmediata', desc: 'Disponibilidad real. Sin llamadas.' },
              { Icon: Star,     value: 'Reseñas verificadas',    desc: 'Solo de clientes que han reservado.' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
                  <item.Icon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{item.value}</p>
                  <p className="mt-1 text-sm text-zinc-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-black tracking-tight text-zinc-900">BellezaLocal</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm text-zinc-500 leading-relaxed">
                El marketplace de belleza más completo. Reserva en los mejores centros de tu ciudad.
              </p>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Marketplace</p>
              <ul className="space-y-2">
                {[['Servicios','/buscar'],['Marketplace','/productos'],['Peluquerías','/buscar?categoria=PELUQUERIA'],['Masajes','/buscar?categoria=MASAJES']].map(([label, href]) => (
                  <li key={href}><Link href={href} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Empresa</p>
              <ul className="space-y-2">
                {[['Para negocios','/para-negocios'],['Precios','/precios'],['Mi cuenta','/cuenta'],['Privacidad','/privacidad']].map(([label, href]) => (
                  <li key={href}><Link href={href} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-100 pt-8 text-xs text-zinc-400 sm:flex-row">
            <p>© {new Date().getFullYear()} BellezaLocal. Todos los derechos reservados.</p>
            <div className="flex gap-5">
              {[['Privacidad','/privacidad'],['Términos','/terminos'],['Cookies','/cookies']].map(([label, href]) => (
                <Link key={href} href={href} className="hover:text-zinc-600 transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
