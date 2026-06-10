import { Metadata } from 'next'
import Link from 'next/link'
import {
  Sparkles, Calendar, Users, Bell, ShoppingBag,
  BarChart3, ArrowRight, CheckCircle2, Check, Zap, Shield,
  Star, MessageSquare, Gift, Globe, Headphones, Database
} from 'lucide-react'
import { PublicHeader } from '@/components/ui/public-header'

export const metadata: Metadata = {
  title: 'Para negocios — Gestiona tus citas con BellezaLocal',
  description:
    'La plataforma de gestión de citas que usan los mejores profesionales de belleza. Empieza gratis, sin tarjeta.',
  robots: { index: true },
}

const FEATURES = [
  {
    icon: Calendar,
    title: 'Agenda online 24/7',
    desc: 'Tus clientes reservan solas en cualquier momento. Sincronización en tiempo real.',
  },
  {
    icon: Bell,
    title: 'Recordatorios automáticos',
    desc: 'Reduce no-shows hasta un 70% con recordatorios por email y WhatsApp.',
  },
  {
    icon: Users,
    title: 'CRM de clientes',
    desc: 'Historial completo, preferencias, frecuencia de visita y gasto por cliente.',
  },
  {
    icon: ShoppingBag,
    title: 'Venta de bonos y productos',
    desc: 'Vende bonos de sesiones y productos directamente desde tu perfil.',
  },
  {
    icon: BarChart3,
    title: 'Analíticas en tiempo real',
    desc: 'Ingresos, ocupación, servicios top, clientes nuevos vs. recurrentes.',
  },
  {
    icon: Globe,
    title: 'Presencia en el marketplace',
    desc: 'Aparece en búsquedas de tu ciudad y categoría. SEO incluido.',
  },
]

const PLANS = [
  {
    name: 'Basic',
    price: 0,
    period: '/mes',
    desc: 'Para empezar. Sin sorpresas.',
    cta: 'Empezar gratis',
    href: '/auth/signup',
    highlight: false,
    features: [
      '1 centro',
      'Reservas online ilimitadas',
      'Hasta 3 servicios',
      'Confirmaciones por email',
      'Perfil en marketplace',
    ],
  },
  {
    name: 'Pro',
    price: 39,
    period: '/mes',
    desc: 'El más elegido por profesionales.',
    cta: 'Empezar 14 días gratis',
    href: '/auth/signup?plan=pro',
    highlight: true,
    features: [
      'Todo lo del plan Basic',
      'Servicios y staff ilimitados',
      'Reseñas verificadas',
      'Venta de bonos',
      'CRM completo de clientes',
      'Analíticas básicas',
      'Soporte por chat',
    ],
  },
  {
    name: 'Growth',
    price: 79,
    period: '/mes',
    desc: 'Para centros en expansión.',
    cta: 'Hablar con ventas',
    href: '/para-negocios#contacto',
    highlight: false,
    features: [
      'Todo lo del plan Pro',
      'Hasta 3 centros',
      'Analíticas avanzadas',
      'Venta de productos',
      'Campañas de fidelización',
      'WhatsApp automático',
      'Prioridad en búsquedas',
    ],
  },
  {
    name: 'Premium',
    price: 149,
    period: '/mes',
    desc: 'Para grupos y franquicias.',
    cta: 'Hablar con ventas',
    href: '/para-negocios#contacto',
    highlight: false,
    features: [
      'Todo lo del plan Growth',
      'Centros ilimitados',
      'Dominio personalizado',
      'API de integraciones',
      'Gestor de cuenta dedicado',
      'SLA de soporte premium',
      'Migración de datos asistida',
    ],
  },
]

const ADD_ONS = [
  { icon: MessageSquare, name: 'WhatsApp automático', price: '€19/mes', desc: 'Confirmaciones y recordatorios por WhatsApp.' },
  { icon: Bell,          name: 'SMS recordatorios',   price: '€12/mes', desc: 'SMS automáticos para reducir no-shows.' },
  { icon: Zap,           name: 'AI Recepcionista',    price: '€29/mes', desc: 'Chatbot que responde y reserva por WhatsApp.' },
  { icon: Star,          name: 'Featured Listing',    price: '€49/mes', desc: 'Posición top en búsquedas de tu ciudad.' },
  { icon: Gift,          name: 'Migración de datos',  price: '€199 único', desc: 'Importamos tus clientes y citas actuales.' },
  { icon: Database,      name: 'Onboarding asistido', price: '€299 único', desc: 'Un experto configura todo por ti.' },
]

const TESTIMONIALS = [
  {
    name: 'Carmen Rodríguez',
    role: 'Peluquería El Rincón · Madrid',
    text: 'Desde que uso BellezaLocal mis reservas online representan el 60% del total. Los recordatorios automáticos me han eliminado casi todos los no-shows.',
    rating: 5,
  },
  {
    name: 'Marta Sánchez',
    role: 'Centro de Estética Glow · Barcelona',
    text: 'El panel de analíticas me ha ayudado a entender qué servicios son más rentables. He triplicado la venta de bonos en 3 meses.',
    rating: 5,
  },
  {
    name: 'David Torres',
    role: 'Barbería Classic · Sevilla',
    text: 'Muy fácil de configurar. En menos de una hora ya tenía mi agenda funcionando. El soporte es excelente.',
    rating: 5,
  },
]

const FAQS = [
  {
    q: '¿Necesito tarjeta de crédito para empezar?',
    a: 'No. El plan Basic es gratis para siempre. Para los planes de pago ofrecemos 14 días gratis sin necesidad de tarjeta.',
  },
  {
    q: '¿Puedo importar mis clientes y citas actuales?',
    a: 'Sí. Con el add-on de Migración de datos nuestro equipo importa toda tu información desde cualquier sistema.',
  },
  {
    q: '¿Hay comisión por reserva?',
    a: 'No. Nunca cobramos comisión. Solo pagas la cuota mensual del plan que elijas.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí, sin permanencia. Cancela desde tu panel en cualquier momento y no se te cobrará el siguiente período.',
  },
  {
    q: '¿Funciona en móvil?',
    a: 'Completamente. Tanto el panel de gestión como la página de reservas para clientes están optimizados para móvil.',
  },
]

export default function ParaNegociosPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <PublicHeader />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-[#09090B] pb-24 pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary-600/20 blur-[120px]" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-beauty-500/10 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold text-primary-300">
            <Sparkles className="h-3 w-3" />
            Para profesionales de la belleza
          </span>
          <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
            Tu agenda, siempre llena
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            La plataforma de gestión de citas diseñada para centros de belleza, estética y bienestar.
            Más reservas, menos no-shows, más tiempo para lo que importa.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-700 active:scale-[0.97]">
              Empezar gratis <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="#planes" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-base font-semibold text-zinc-300 transition-all hover:border-white/30 hover:text-white">
              Ver planes y precios
            </Link>
          </div>
          <p className="mt-5 text-xs text-zinc-600">Sin tarjeta · Plan gratis disponible · Cancela cuando quieras</p>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { value: '350+',   label: 'Negocios activos' },
              { value: '12.000+',label: 'Reservas gestionadas' },
              { value: '70%',    label: 'Reducción de no-shows' },
              { value: '4.9/5',  label: 'Satisfacción media' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-black tracking-tight text-zinc-900">{s.value}</p>
                <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-14 text-center">
            <p className="section-eyebrow">Funcionalidades</p>
            <h2 className="section-title mt-2">Todo lo que necesitas para crecer</h2>
            <p className="section-subtitle">Una sola plataforma que reemplaza tu agenda en papel, las llamadas y las hojas de cálculo.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-card-hover hover:-translate-y-0.5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
                  <f.icon className="h-5.5 w-5.5 text-primary-600" style={{ width: 22, height: 22 }} />
                </div>
                <h3 className="font-bold text-zinc-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLANS ─── */}
      <section id="planes" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-14 text-center">
            <p className="section-eyebrow">Precios</p>
            <h2 className="section-title mt-2">Planes para cada negocio</h2>
            <p className="section-subtitle">Sin comisiones por reserva. Solo pagas tu cuota mensual.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-6 transition-all ${
                  plan.highlight
                    ? 'border-primary-500 bg-primary-600 shadow-glow-violet'
                    : 'border-zinc-200 bg-white shadow-sm hover:shadow-card-hover'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-white px-4 py-1 text-xs font-bold text-primary-600 shadow-sm">
                      Más popular
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <p className={`text-sm font-bold ${plan.highlight ? 'text-primary-200' : 'text-zinc-500'}`}>{plan.name}</p>
                  <div className="mt-1 flex items-end gap-1">
                    <span className={`text-4xl font-black tracking-tight ${plan.highlight ? 'text-white' : 'text-zinc-900'}`}>
                      {plan.price === 0 ? 'Gratis' : `€${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className={`mb-1 text-sm ${plan.highlight ? 'text-primary-200' : 'text-zinc-400'}`}>{plan.period}</span>
                    )}
                  </div>
                  <p className={`mt-1 text-xs ${plan.highlight ? 'text-primary-200' : 'text-zinc-400'}`}>{plan.desc}</p>
                </div>
                <Link
                  href={plan.href}
                  className={`mb-6 block rounded-xl py-2.5 text-center text-sm font-semibold transition-all active:scale-[0.97] ${
                    plan.highlight
                      ? 'bg-white text-primary-600 hover:bg-primary-50'
                      : 'border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-primary-100' : 'text-zinc-600'}`}>
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? 'text-primary-200' : 'text-primary-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Add-ons */}
          <div className="mt-16">
            <div className="mb-8 text-center">
              <p className="section-eyebrow">Add-ons</p>
              <h3 className="mt-2 text-2xl font-bold text-zinc-900">Potencia tu plan</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ADD_ONS.map((addon) => (
                <div key={addon.name} className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                    <addon.icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-zinc-900">{addon.name}</p>
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-600">{addon.price}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{addon.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <p className="section-eyebrow">Testimonios</p>
            <h2 className="section-title mt-2">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed text-zinc-600">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <p className="text-sm font-bold text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12 text-center">
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title mt-2">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <p className="font-semibold text-zinc-900">{faq.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="relative overflow-hidden bg-[#09090B] py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/20 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <div className="mb-4 flex justify-center gap-5">
            {[CheckCircle2, Shield, Headphones].map((Icon, i) => (
              <div key={i} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                <Icon className="h-6 w-6 text-primary-400" />
              </div>
            ))}
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white">Empieza hoy, gratis</h2>
          <p className="mt-4 text-lg text-zinc-400">
            Sin tarjeta de crédito. Sin permanencia. Sin comisiones por reserva.
          </p>
          <Link href="/auth/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-700 active:scale-[0.97]">
            Crear mi cuenta gratis <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-xs text-zinc-600">Configuración en menos de 10 minutos</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-white px-4 py-8 text-center text-xs text-zinc-400">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-zinc-900 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          BellezaLocal
        </Link>
        <p>© {new Date().getFullYear()} BellezaLocal · <Link href="/privacidad" className="hover:text-zinc-600">Privacidad</Link> · <Link href="/terminos" className="hover:text-zinc-600">Términos</Link></p>
      </footer>
    </div>
  )
}
