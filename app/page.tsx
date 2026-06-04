import { Metadata } from 'next'
import Link from 'next/link'
import { Search, MapPin, Star, ArrowRight, CheckCircle2, Sparkles, Calendar, Bell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Belleza Local — Reserva en centros de belleza cerca de ti',
  description: 'Encuentra y reserva en los mejores centros de belleza, estética, peluquería y bienestar cerca de ti. Disponibilidad real. Sin llamar.',
}

export default function HomePage() {
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
            <Link href="/para-negocios" className="hover:text-slate-900">Para negocios</Link>
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
              <Star className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
              Más de 500 centros en España
            </div>
            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Tu belleza, <br />
              <span className="text-rose-400">a un clic</span>
            </h1>
            <p className="mx-auto mb-10 max-w-xl text-lg text-white/70">
              Encuentra y reserva en los mejores centros de belleza cerca de ti. Disponibilidad real. Sin llamar.
            </p>

            {/* SEARCH BAR */}
            <div className="mx-auto max-w-2xl">
              <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Peluquería, manicura, masaje..."
                    className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Madrid, Barcelona, Valencia..."
                    className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <Link
                  href="/buscar"
                  className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
                >
                  Buscar
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-slate-900">
            Explora por categoría
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

      {/* CÓMO FUNCIONA */}
      <section className="bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Reserva en 3 pasos</h2>
            <p className="mt-3 text-slate-500">Simple, rápido, sin complicaciones</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', icon: <Search className="h-6 w-6" />, title: 'Busca', desc: 'Encuentra centros por servicio y ubicación con disponibilidad real.' },
              { step: '02', icon: <Calendar className="h-6 w-6" />, title: 'Elige', desc: 'Selecciona servicio, profesional, fecha y hora que mejor te venga.' },
              { step: '03', icon: <Bell className="h-6 w-6" />, title: 'Listo', desc: 'Confirma y recibe recordatorio automático antes de tu cita.' },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl bg-white p-8 shadow-sm">
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
                <span className="text-rose-400">Sin comisiones.</span>
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-slate-400">
                Agenda, reservas, clientes, bonos y visibilidad online. Todo desde 24 €/mes. Sin comisiones sobre tus reservas.
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
                  Empieza gratis 14 días
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/para-negocios"
                  className="flex items-center justify-center rounded-xl border border-slate-700 px-8 py-4 font-semibold text-slate-300 hover:border-slate-500 transition-colors"
                >
                  Ver planes y precios
                </Link>
              </div>
            </div>

            {/* Fake dashboard card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Agenda hoy</span>
                <span className="rounded-full bg-rose-600/20 px-3 py-1 text-xs font-semibold text-rose-400">8 citas</span>
              </div>
              <div className="space-y-3">
                {DEMO_BOOKINGS.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-900/50 px-4 py-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-xs font-bold text-white">
                      {b.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{b.name}</p>
                      <p className="text-xs text-slate-400">{b.service}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">{b.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-100 bg-white px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-slate-900">{s.value}</div>
                <div className="mt-1 text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 px-4 py-12">
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
  { name: 'Peluquería', slug: 'peluqueria', emoji: '✂️' },
  { name: 'Estética', slug: 'estetica', emoji: '💆' },
  { name: 'Uñas', slug: 'unas', emoji: '💅' },
  { name: 'Depilación', slug: 'depilacion', emoji: '✨' },
  { name: 'Masajes', slug: 'masajes', emoji: '🧘' },
  { name: 'Spa', slug: 'spa', emoji: '🛁' },
]

const BUSINESS_FEATURES = [
  'Reservas online 24/7 sin comisiones',
  'Agenda inteligente con recordatorios automáticos',
  'Gestión de servicios, staff y horarios',
  'Bonos, productos y promociones',
  'Visibilidad en el marketplace local',
  'Analítica y gestión de clientes',
]

const DEMO_BOOKINGS = [
  { name: 'María García', service: 'Corte + Color', time: '10:00' },
  { name: 'Laura Sánchez', service: 'Manicura francesa', time: '11:30' },
  { name: 'Carmen López', service: 'Depilación completa', time: '13:00' },
]

const STATS = [
  { value: '500+', label: 'Centros activos' },
  { value: '12.000+', label: 'Reservas al mes' },
  { value: '4.9★', label: 'Valoración media' },
  { value: '0%', label: 'Comisión sobre reservas' },
]
