import { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarCheck,
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  WalletCards,
} from 'lucide-react'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Belleza Local — Reserva belleza cerca de ti',
  description:
    'Encuentra centros de belleza, estética, peluquería y bienestar cerca de ti. Reserva online sin llamadas y descubre servicios locales.',
}

async function getFeaturedCenters() {
  try {
    return await prisma.center.findMany({
      where: { published: true },
      include: {
        services: {
          where: { active: true },
          orderBy: { order: 'asc' },
          take: 3,
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })
  } catch {
    return []
  }
}

export default async function HomePage() {
  const centers = await getFeaturedCenters()

  return (
    <main className="min-h-screen bg-[#fbf7f3] text-slate-950">
      <Header />

      <section className="relative overflow-hidden border-b border-white/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#f9a8d4_0,transparent_34%),radial-gradient(circle_at_top_right,#c084fc_0,transparent_28%),linear-gradient(135deg,#fff7ed_0%,#fff1f2_38%,#f8fafc_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fbf7f3] to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-28 lg:pt-36">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Belleza, estética y bienestar local
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
              Reserva belleza cerca de ti, sin llamar.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Encuentra centros de peluquería, estética, uñas, depilación, masajes y cosmética.
              Consulta servicios, disponibilidad y reserva online en pocos pasos.
            </p>

            <div className="mt-9 max-w-3xl rounded-[2rem] border border-white/80 bg-white/90 p-3 shadow-2xl shadow-rose-950/10 backdrop-blur">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                    placeholder="Manicura, facial, masaje..."
                    name="q"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                    placeholder="Madrid, Valencia, A Coruña..."
                    name="ciudad"
                  />
                </label>

                <Link
                  href="/buscar"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 text-sm font-bold text-white transition hover:bg-rose-700"
                >
                  Buscar
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-600">
              <TrustPill icon={CalendarCheck} text="Reserva online" />
              <TrustPill icon={Bell} text="Recordatorios de cita" />
              <TrustPill icon={ShieldCheck} text="Centros publicados con control" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-rose-200 via-fuchsia-100 to-amber-100 blur-2xl" />
            <div className="relative rounded-[2.5rem] border border-white/80 bg-white/85 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur">
              <div className="rounded-[2rem] bg-slate-950 p-5 text-white">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">Vista del negocio</p>
                    <h2 className="text-xl font-black tracking-tight">Agenda de hoy</h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    En control
                  </span>
                </div>

                <div className="grid gap-3">
                  {[
                    ['10:00', 'Manicura completa', 'Confirmada'],
                    ['11:30', 'Tratamiento facial', 'Recordatorio enviado'],
                    ['13:00', 'Corte + peinado', 'Pendiente'],
                  ].map(([time, service, status]) => (
                    <div key={time} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold">{service}</p>
                          <p className="mt-1 text-xs text-white/45">{status}</p>
                        </div>
                        <span className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black">{time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <MiniMetric label="Citas" value="Hoy" />
                  <MiniMetric label="Huecos" value="6" />
                  <MiniMetric label="No-show" value="↓" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CategoriesSection />

      <section className="mx-auto max-w-7xl px-5 py-20">
        <SectionHeader
          eyebrow="Centros"
          title="Descubre centros disponibles"
          description="Cuando haya centros publicados, aparecerán aquí con sus servicios, precios y enlace de reserva."
          actionHref="/buscar"
          actionLabel="Ver todos"
        />

        {centers.length > 0 ? (
          <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {centers.map((center) => (
              <Link
                key={center.id}
                href={`/centro/${center.slug}`}
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/10"
              >
                <div className="relative h-52 bg-gradient-to-br from-rose-100 via-fuchsia-100 to-amber-100">
                  {center.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={center.coverImage} alt={center.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Store className="h-14 w-14 text-rose-300" />
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                    {formatCategory(center.category)}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-slate-950 group-hover:text-rose-700">
                        {center.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <MapPin className="h-4 w-4" />
                        {center.addressCity}
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                      Reservar
                    </span>
                  </div>

                  {center.services.length > 0 && (
                    <div className="mt-5 space-y-2">
                      {center.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{service.name}</p>
                            <p className="text-xs text-slate-400">{service.durationMinutes} min</p>
                          </div>
                          <p className="text-sm font-black text-slate-950">
                            {(service.priceCents / 100).toFixed(0)} €
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-9 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
              <Store className="h-7 w-7 text-rose-600" />
            </div>
            <h3 className="text-xl font-black tracking-tight">Primeros centros en incorporación</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              La plataforma está preparada para mostrar centros publicados con servicios, disponibilidad y reservas online.
            </p>
            <Link
              href="/auth/signup?tipo=negocio"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-rose-700"
            >
              Publicar mi negocio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <HowItWorks />

      <BusinessSection />

      <Footer />
    </main>
  )
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-black tracking-tight">BellezaLocal</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/buscar" className="hover:text-slate-950">Buscar centros</Link>
          <Link href="/para-negocios" className="hover:text-slate-950">Para negocios</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/auth/signin" className="hidden text-sm font-bold text-slate-600 hover:text-slate-950 sm:block">
            Entrar
          </Link>
          <Link
            href="/auth/signup?tipo=negocio"
            className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700"
          >
            Registrar negocio
          </Link>
        </div>
      </div>
    </header>
  )
}

function CategoriesSection() {
  const categories = [
    { name: 'Peluquería', slug: 'peluqueria', icon: Store },
    { name: 'Uñas', slug: 'unas', icon: Sparkles },
    { name: 'Estética', slug: 'estetica', icon: BadgeCheck },
    { name: 'Depilación', slug: 'depilacion', icon: ShieldCheck },
    { name: 'Masajes', slug: 'masajes', icon: Clock },
    { name: 'Bonos', slug: 'bonos', icon: WalletCards },
  ]

  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-600">Explora</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">¿Qué buscas hoy?</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {categories.map(({ name, slug, icon: Icon }) => (
          <Link
            key={slug}
            href={`/buscar?categoria=${slug}`}
            className="group rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-950/5"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition group-hover:bg-rose-600 group-hover:text-white">
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-black tracking-tight">{name}</p>
            <p className="mt-1 text-xs text-slate-400">Ver opciones</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: 'Busca',
      text: 'Encuentra servicios por categoría, centro o localidad.',
    },
    {
      icon: CalendarCheck,
      title: 'Elige horario',
      text: 'Consulta disponibilidad real cuando el centro esté publicado.',
    },
    {
      icon: Bell,
      title: 'Recibe aviso',
      text: 'Confirmación y recordatorios desde la plataforma.',
    },
  ]

  return (
    <section className="bg-white px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Reserva simple"
          title="Reserva en pocos pasos"
          description="Una experiencia pensada para reducir llamadas, esperas y citas perdidas."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-7">
              <span className="absolute right-6 top-4 text-7xl font-black tracking-tighter text-white">
                0{index + 1}
              </span>
              <div className="relative">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BusinessSection() {
  return (
    <section className="bg-slate-950 px-5 py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex rounded-full bg-rose-500/10 px-4 py-2 text-sm font-black text-rose-300 ring-1 ring-rose-400/20">
            Para negocios locales
          </div>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            Gestiona reservas, agenda y visibilidad desde un solo lugar.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
            Pensado para peluquerías, centros de estética, uñas, depilación, masajes y negocios de belleza que quieren digitalizarse sin complejidad.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              'Agenda y reservas online',
              'Recordatorios comunes desde la plataforma',
              'Servicios, staff, horarios y clientes',
              'Bonos, productos y promociones en planes superiores',
              'Visibilidad local y páginas públicas',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                <BadgeCheck className="h-5 w-5 text-rose-400" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup?tipo=negocio" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-4 text-sm font-black text-white hover:bg-rose-700">
              Empezar desde 24 €/mes
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/para-negocios" className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-6 py-4 text-sm font-black text-white hover:bg-white/5">
              Ver planes
            </Link>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl">
          <div className="rounded-[2rem] bg-white p-5 text-slate-950">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400">Panel del centro</p>
                <h3 className="text-2xl font-black tracking-tight">Resumen operativo</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                Publicado
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <DashboardBox icon={CalendarCheck} label="Citas hoy" value="—" />
              <DashboardBox icon={Clock} label="Huecos" value="—" />
              <DashboardBox icon={Tags} label="Promos" value="—" />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200">
              {['Reservas', 'Servicios', 'Horarios', 'Bonos y productos'].map((row) => (
                <div key={row} className="flex items-center justify-between border-b border-slate-100 px-5 py-4 last:border-b-0">
                  <span className="font-bold">{row}</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-sm text-slate-500 md:flex-row">
        <Link href="/" className="flex items-center gap-2 font-black text-slate-950">
          <Sparkles className="h-4 w-4 text-rose-600" />
          BellezaLocal
        </Link>
        <div className="flex gap-5">
          <Link href="/legal/privacidad">Privacidad</Link>
          <Link href="/legal/cookies">Cookies</Link>
          <Link href="/legal/aviso-legal">Aviso legal</Link>
          <Link href="/legal/terminos">Términos</Link>
        </div>
      </div>
    </footer>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  eyebrow: string
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-600">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-2xl leading-7 text-slate-500">{description}</p>
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="inline-flex items-center gap-2 text-sm font-black text-rose-700 hover:text-rose-800">
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

function TrustPill({ icon: Icon, text }: { icon: typeof CalendarCheck; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 font-semibold shadow-sm">
      <Icon className="h-4 w-4 text-rose-600" />
      {text}
    </span>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  )
}

function DashboardBox({ icon: Icon, label, value }: { icon: typeof CalendarCheck; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <Icon className="mb-4 h-5 w-5 text-rose-600" />
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  )
}

function formatCategory(category: string) {
  return category
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}
