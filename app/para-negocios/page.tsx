import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Gift,
  LineChart,
  ListChecks,
  MessageSquareText,
  PackageCheck,
  Repeat2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react'
import { PLAN_MARKETING, PLAN_ORDER, PLAN_PRICES_CENTS } from '@/lib/billing/plans'
import { formatPrice } from '@/lib/utils'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: 'Belleza Local para negocios',
  description: 'Plataforma para centros de belleza que quieren convertir reservas, packs, productos y seguimiento en clientas recurrentes.',
  robots: { index: true },
}

const OPERATING_LOOP = [
  {
    icon: Sparkles,
    title: 'La clienta llega con contexto',
    text: 'Beauty Profile, objetivos y preferencias ayudan a que la recomendacion no empiece desde cero.',
  },
  {
    icon: PackageCheck,
    title: 'El centro vende por objetivo',
    text: 'Packs, beneficios y productos se presentan con para quien es, para quien no es y precio visible.',
  },
  {
    icon: Repeat2,
    title: 'La vuelta queda preparada',
    text: 'Seguimientos, reposicion y oportunidades de rebooking convierten la visita en continuidad.',
  },
]

const BUSINESS_MODULES = [
  {
    icon: CalendarCheck,
    title: 'Reservas con base comercial',
    text: 'Agenda, servicios, staff, senales y lista de espera conectados al perfil publico del centro.',
  },
  {
    icon: Gift,
    title: 'Packs y beneficios',
    text: 'Ofertas por objetivo, bonos legacy y beneficios visibles para que la clienta entienda el valor.',
  },
  {
    icon: ShoppingBag,
    title: 'Productos inteligentes',
    text: 'Venta de productos con rutina, duracion, compatibilidad, reposicion y alternativas.',
  },
  {
    icon: MessageSquareText,
    title: 'Seguimiento postservicio',
    text: 'Plantillas por categoria para recordar cuidados, recomendar repeticion y separar marketing con opt-in.',
  },
  {
    icon: Users,
    title: 'CRM accionable',
    text: 'Clientes, historial, oportunidades de vuelta y segmentacion para no depender de memoria o hojas sueltas.',
  },
  {
    icon: LineChart,
    title: 'Decision con datos propios',
    text: 'Visibilidad de reservas, pedidos, packs, beneficios y oportunidades antes de invertir mas.',
  },
]

const ADD_ONS = [
  {
    icon: Bell,
    title: 'Canales avanzados',
    text: 'WhatsApp y SMS quedan como add-on o plan avanzado cuando el negocio tenga consentimiento y necesidad real.',
  },
  {
    icon: ListChecks,
    title: 'Onboarding asistido',
    text: 'Configuracion de servicios, packs, productos y plantillas para empezar con una estructura limpia.',
  },
  {
    icon: ShieldCheck,
    title: 'Migracion cuidada',
    text: 'Importacion de datos revisada caso a caso para evitar prometer compatibilidades que aun no estan validadas.',
  },
]

const FAQS = [
  {
    q: 'Hay permanencia?',
    a: 'No planteamos permanencia como condicion base. Si hay implantacion, integraciones o migracion, se acuerda por separado.',
  },
  {
    q: 'Cobra comision por reserva?',
    a: 'Los planes B2B se plantean con cuota mensual. Las compras o pagos procesados por Stripe pueden tener sus costes de pasarela.',
  },
  {
    q: 'Puedo empezar solo con presencia?',
    a: 'Si. Presencia sirve para ordenar el perfil y aceptar reservas. Growth anade recurrencia, packs, beneficios y productos.',
  },
  {
    q: 'WhatsApp esta incluido?',
    a: 'No lo damos por hecho en todos los planes. Es un canal sensible y se activa como add-on o capacidad avanzada cuando hay consentimiento y operativa preparada.',
  },
]

function priceLabel(plan: (typeof PLAN_ORDER)[number]) {
  return formatPrice(PLAN_PRICES_CENTS[plan].monthly).replace(',00', '')
}

export default function ParaNegociosPage() {
  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <PublicHeader theme="dark" />

      <section className="relative min-h-[620px] overflow-hidden bg-[#0c1324] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/beauty-studio-hero.png')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[#0c1324]/72" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Para centros de belleza, estetica y bienestar
            </p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
              Belleza Local para negocios
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
              No es solo una agenda. Es una forma de convertir reservas, packs, productos y seguimiento en clientas que entienden por que volver.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup?plan=growth" className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-black text-[#0c1324] transition hover:bg-[#e5edff]">
                Empezar con Growth
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#planes" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                Ver planes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d8dee9] bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          {OPERATING_LOOP.map(item => (
            <article key={item.title} className="rounded-lg border border-[#d8dee9] bg-[#f7f9fc] p-5">
              <item.icon className="h-5 w-5 text-[#2355c8]" />
              <h2 className="mt-4 text-lg font-black text-[#0c1324]">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#647089]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Sistema de recurrencia</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0c1324]">Lo que el negocio puede activar por fases</h2>
          <p className="mt-3 text-sm leading-6 text-[#647089]">
            La propuesta se apoya en piezas que ya existen en la app: reservas, marketplace, productos, packs, beneficios, seguimiento y wallet.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {BUSINESS_MODULES.map(item => (
            <article key={item.title} className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e5edff] text-[#2355c8]">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black text-[#0c1324]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#647089]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="planes" className="border-y border-[#d8dee9] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Planes</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0c1324]">Presencia, Growth, Elite y Partner</h2>
            </div>
            <Link href="/precios" className="inline-flex items-center gap-2 text-sm font-black text-[#2355c8]">
              Comparativa completa
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PLAN_ORDER.map(plan => {
              const marketing = PLAN_MARKETING[plan]
              const featured = marketing.featured

              return (
                <article
                  key={plan}
                  className={`relative flex flex-col rounded-lg border p-5 shadow-sm ${
                    featured ? 'border-[#2f6df6] bg-[#2f6df6] text-white' : 'border-[#d8dee9] bg-white'
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-5 rounded-full bg-white px-3 py-1 text-xs font-black text-[#2355c8] shadow-sm">
                      Recomendado
                    </span>
                  )}
                  <p className={`text-sm font-black ${featured ? 'text-white' : 'text-[#0c1324]'}`}>{marketing.name}</p>
                  <p className={`mt-1 text-xs font-semibold ${featured ? 'text-[#cfe0ff]' : 'text-[#647089]'}`}>{marketing.tagline}</p>
                  <div className="mt-5">
                    <span className={`text-4xl font-black tracking-tight ${featured ? 'text-white' : 'text-[#0c1324]'}`}>
                      {priceLabel(plan)}
                    </span>
                    <span className={`ml-1 text-sm ${featured ? 'text-[#cfe0ff]' : 'text-[#647089]'}`}>/mes</span>
                  </div>
                  <p className={`mt-4 text-sm leading-6 ${featured ? 'text-[#e5edff]' : 'text-[#46546b]'}`}>
                    {marketing.idealFor}
                  </p>
                  <ul className={`mt-5 flex-1 space-y-2.5 text-sm ${featured ? 'text-[#e5edff]' : 'text-[#46546b]'}`}>
                    {marketing.highlights.map(feature => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? 'text-white' : 'text-[#10786f]'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={marketing.contactSales ? '#contacto' : `/auth/signup?plan=${marketing.slug}`}
                    className={`mt-6 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-black transition ${
                      featured ? 'bg-white text-[#2355c8] hover:bg-[#e5edff]' : 'bg-[#0c1324] text-white hover:bg-[#1f2a44]'
                    }`}
                  >
                    {marketing.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Add-ons y cuidado operativo</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0c1324]">Lo avanzado se activa cuando aporta valor real</h2>
            <p className="mt-3 text-sm leading-6 text-[#647089]">
              Evitamos vender automatizaciones sensibles como si fueran universales. Canales, migraciones y soporte se preparan segun consentimiento, volumen y capacidad del equipo.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {ADD_ONS.map(item => (
              <article key={item.title} className="rounded-lg border border-[#d8dee9] bg-white p-4 shadow-sm">
                <item.icon className="h-5 w-5 text-[#2355c8]" />
                <h3 className="mt-3 font-black text-[#0c1324]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#647089]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-[#d8dee9] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">FAQ</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0c1324]">Preguntas habituales</h2>
          <div className="mt-6 grid gap-4">
            {FAQS.map(item => (
              <article key={item.q} className="rounded-lg border border-[#d8dee9] bg-[#f7f9fc] p-5">
                <h3 className="font-black text-[#0c1324]">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-[#647089]">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="bg-[#0c1324] px-4 py-14 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black tracking-tight">Hablemos de tu centro</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/70">
            Cuentanos tu tipo de centro, numero de profesionales y si quieres priorizar reservas, packs, productos o recurrencia. Te diremos que plan encaja sin sobredimensionarlo.
          </p>
          <a href="mailto:hola@bellezalocal.es?subject=Quiero%20ver%20Belleza%20Local%20para%20mi%20negocio" className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-black text-[#0c1324] transition hover:bg-[#e5edff]">
            Contactar
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
