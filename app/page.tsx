import { Metadata } from 'next'
import Link from 'next/link'
import { Search, MapPin, ArrowRight, CheckCircle2, Sparkles, Calendar, Bell } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'BellezaLocal — Reserva servicios de belleza cerca de ti',
  description: 'Encuentra y reserva en centros de belleza, estética, peluquería y bienestar cerca de ti. Disponibilidad real. Sin llamar.',
}

export default async function HomePage() {
  // Centros publicados recientes para mostrar actividad real (sin inventar)
  const recentCenters = await prisma.center.findMany({
    where: { published: true },
    select: { name: true, addressCity: true, category: true, slug: true },
    take: 3,
    orderBy: { createdAt: 'desc' },
  })

  const totalCenters = await prisma.center.count({ where: { published: true } })

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">BellezaLocal</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <Link href="/buscar" className="hover:text-slate-900">Buscar centros</Link>
            <Link href="/auth/signup?tipo=negocio" className="hover:text-slate-900">Para negocios</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 md:block">
              Entrar
            </Link>
            <Link href="/auth/signup?tipo=negocio" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors">
              Registra tu negocio
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-16">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 px-4 py-24 sm:py-32">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-rose-500 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-rose-400 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              Plataforma de reservas para belleza y bienestar
            </div>
            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Reserva belleza<br />
              <span className="text-rose-400">sin llamar</span>
            </h1>
            <p className="mx-auto mb-10 max-w-xl text-lg text-white/70">
              Encuentra centros de belleza cerca de ti con disponibilidad real. Elige fecha, elige hora, confirma en segundos.
            </p>

            {/* SEARCH BAR */}
            <form action="/buscar" method="get" className="mx-auto max-w-2xl">
              <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Peluquería, manicura, masaje..."
                    className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    name="ciudad"
                    placeholder="Madrid, Barcelona, Valencia..."
                    className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
                >
                  Buscar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-slate-900">
            ¿Qué buscas?
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/buscar?categoria=${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-center transition-all hover:border-rose-200 hover:bg-rose-50 hover:shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl transition-colors group-hover:bg-rose-100">
                  {cat.emoji}
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-rose-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CENTROS RECIENTES — solo si hay datos reales */}
      {recentCenters.length > 0 && (
        <section className="bg-slate-50 px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Centros disponibles
                {totalCenters > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-500">({totalCenters} centros)</span>
                )}
              </h2>
              <Link href="/buscar" className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {recentCenters.map((c) => (
                <Link
                  key={c.slug}
                  href={`/centro/${c.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-xl">
                    {CATEGORIES.find(x => x.slug === c.category?.toLowerCase())?.emoji ?? '✂️'}
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">{c.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {CATEGORY_LABELS[c.category] ?? c.category} · {c.addressCity}
                  </p>
                  <span className="mt-3 flex items-center gap-1 text-sm font-medium text-rose-600">
                    Ver y reservar <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CÓMO FUNCIONA */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Reserva en 3 pasos</h2>
            <p className="mt-3 text-slate-500">Sin llamadas. Sin esperas. Sin cuenta obligatoria.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', icon: <Search className="h-6 w-6" />, title: 'Busca', desc: 'Encuentra centros por servicio y ubicación con disponibilidad real.' },
              { step: '02', icon: <Calendar className="h-6 w-6" />, title: 'Elige', desc: 'Selecciona servicio, profesional, fecha y hora que mejor te venga.' },
              { step: '03', icon: <Bell className="h-6 w-6" />, title: 'Listo', desc: 'Confirma y recibe recordatorio automático antes de tu cita.' },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl bg-slate-50 p-8">
                <span className="absolute right-6 top-6 text-5xl font-black text-slate-100">{item.step}</span>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white">
                  {item.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA NEGOCIOS */}
      <section className="bg-slate-900 px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-600/20 px-4 py-2 text-sm font-semibold text-rose-400">
                Para negocios
              </div>
              <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight text-white">
                Digitaliza tu centro.<br />
                <span className="text-rose-400">Sin complicaciones.</span>
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-slate-400">
                Agenda, reservas, clientes y visibilidad online. Gestión simple para centros de 1 a 10 personas. Desde 24 €/mes.
              </p>
              <ul className="mb-10 space-y-3">
                {BUSINESS_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-rose-500" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signup?tipo=negocio"
                  className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-8 py-4 font-semibold text-white hover:bg-rose-700 transition-colors"
                >
                  Empieza gratis <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Tu agenda, siempre al día</span>
                <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs font-semibold text-green-400">En línea</span>
              </div>
              <div className="space-y-3">
                {FEATURE_CARDS.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-900/50 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-600/20">
                      <f.icon className="h-4 w-4 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{f.title}</p>
                      <p className="text-xs text-slate-400">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white">BellezaLocal</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <Link href="/legal/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
              <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link>
              <Link href="/legal/aviso-legal" className="hover:text-white transition-colors">Aviso legal</Link>
              <Link href="/legal/terminos" className="hover:text-white transition-colors">Términos</Link>
            </div>
            <p className="text-xs text-slate-600">© 2026 BellezaLocal</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const CATEGORIES = [
  { name: 'Peluquería', slug: 'PELUQUERIA', emoji: '✂️' },
  { name: 'Estética', slug: 'ESTETICA', emoji: '💆' },
  { name: 'Uñas', slug: 'UNAS', emoji: '💅' },
  { name: 'Depilación', slug: 'DEPILACION', emoji: '✨' },
  { name: 'Masajes', slug: 'MASAJES', emoji: '🧘' },
  { name: 'Spa', slug: 'SPA', emoji: '🛁' },
]

const BUSINESS_FEATURES = [
  'Reservas online 24h sin comisiones sobre citas',
  'Agenda inteligente con recordatorios automáticos',
  'Gestión de servicios, staff y horarios',
  'Ficha pública con visibilidad en el marketplace',
  'Analítica básica y gestión de clientes',
]

const FEATURE_CARDS = [
  { icon: Calendar, title: 'Reservas automáticas', desc: 'Tus clientes reservan cuando quieran' },
  { icon: Bell, title: 'Recordatorios incluidos', desc: 'Reduce no-shows con avisos automáticos' },
  { icon: Search, title: 'Visibilidad local', desc: 'Aparece en búsquedas de tu zona' },
]
