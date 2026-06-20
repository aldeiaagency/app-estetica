import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles, XCircle } from 'lucide-react'
import type { Plan } from '@prisma/client'
import { PLAN_FEATURES, PLAN_MARKETING, PLAN_ORDER, PLAN_PRICES_CENTS } from '@/lib/billing/plans'
import { formatPrice } from '@/lib/utils'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: 'Precios para negocios - Belleza Local',
  description: 'Planes B2B para presencia, recurrencia, fidelizacion y crecimiento de centros de belleza.',
}

const FEATURE_ROWS: { label: string; key: keyof typeof PLAN_FEATURES.BASIC }[] = [
  { label: 'Centros', key: 'maxCenters' },
  { label: 'Servicios por centro', key: 'maxServicesPerCenter' },
  { label: 'Profesionales por centro', key: 'maxStaffPerCenter' },
  { label: 'Reservas con senal', key: 'hasBookingDeposit' },
  { label: 'Packs y bonos', key: 'hasBonos' },
  { label: 'Productos, rutina y reposicion', key: 'hasProducts' },
  { label: 'Beneficios y promociones', key: 'hasPromotions' },
  { label: 'Resenas verificadas', key: 'hasReviews' },
  { label: 'Lista de espera', key: 'hasWaitlist' },
  { label: 'CRM y seguimiento', key: 'hasCRM' },
  { label: 'Multi-centro', key: 'hasMultiCenter' },
  { label: 'Prioridad comercial', key: 'hasFeaturedListing' },
  { label: 'White-label', key: 'hasWhiteLabelOption' },
  { label: 'Acceso API', key: 'hasApiAccess' },
  { label: 'IA asistida', key: 'hasAI' },
]

function maxLabel(value: number) {
  return value === -1 ? 'Ilimitado' : String(value)
}

function priceLabel(plan: Plan) {
  return formatPrice(PLAN_PRICES_CENTS[plan].monthly).replace(',00', '')
}

function FeatureValue({ value, highlight }: { value: boolean | number; highlight: boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <CheckCircle2 className={`mx-auto h-4 w-4 ${highlight ? 'text-[#2355c8]' : 'text-[#10786f]'}`} />
      : <XCircle className="mx-auto h-4 w-4 text-[#b9c4d5]" />
  }

  return <span className={`font-semibold ${highlight ? 'text-[#2355c8]' : 'text-[#273244]'}`}>{maxLabel(value)}</span>
}

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <PublicHeader />

      <section className="border-b border-[#d8dee9] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#cfe0ff] bg-[#e5edff] px-4 py-1.5 text-xs font-bold text-[#2355c8]">
            <Sparkles className="h-3.5 w-3.5" />
            Planes para clientas recurrentes
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#0c1324] sm:text-5xl">
            Precios claros para crecer con mas repeticion
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#647089]">
            Elige presencia, recurrencia o crecimiento avanzado segun el momento de tu centro. Sin claims inflados ni comisiones por reserva en estos planes.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
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
                <p className={`mt-4 min-h-20 text-sm leading-6 ${featured ? 'text-[#e5edff]' : 'text-[#46546b]'}`}>
                  {marketing.description}
                </p>
                <Link
                  href={marketing.contactSales ? '/para-negocios#contacto' : `/auth/signup?plan=${marketing.slug}`}
                  className={`mt-5 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition ${
                    featured ? 'bg-white text-[#2355c8] hover:bg-[#e5edff]' : 'bg-[#0c1324] text-white hover:bg-[#1f2a44]'
                  }`}
                >
                  {marketing.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <ul className={`mt-5 space-y-2.5 text-sm ${featured ? 'text-[#e5edff]' : 'text-[#46546b]'}`}>
                  {marketing.highlights.map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? 'text-white' : 'text-[#10786f]'}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-2xl font-black tracking-tight text-[#0c1324]">Comparativa completa</h2>
        <div className="hidden overflow-x-auto rounded-lg border border-[#d8dee9] bg-white shadow-sm md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5eaf2] bg-[#f7f9fc]">
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-[#647089]">Funcion</th>
                {PLAN_ORDER.map(plan => (
                  <th key={plan} className="px-5 py-4 text-center text-xs font-black uppercase tracking-wider text-[#273244]">
                    {PLAN_MARKETING[plan].name}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-[#e5eaf2] bg-white">
                <td className="px-5 py-3 text-xs font-semibold text-[#647089]">Precio mensual</td>
                {PLAN_ORDER.map(plan => (
                  <td key={plan} className="px-5 py-3 text-center font-black text-[#0c1324]">
                    {priceLabel(plan)}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f7]">
              {FEATURE_ROWS.map(({ label, key }) => (
                <tr key={key} className="hover:bg-[#f7f9fc]">
                  <td className="px-5 py-3 text-[#46546b]">{label}</td>
                  {PLAN_ORDER.map(plan => (
                    <td key={plan} className="px-5 py-3 text-center">
                      <FeatureValue value={PLAN_FEATURES[plan][key] as boolean | number} highlight={PLAN_MARKETING[plan].featured} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:hidden">
          {PLAN_ORDER.map(plan => (
            <details key={plan} className="rounded-lg border border-[#d8dee9] bg-white shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-black text-[#0c1324]">
                {PLAN_MARKETING[plan].name}
                <span className="text-sm text-[#2355c8]">{priceLabel(plan)}/mes</span>
              </summary>
              <div className="divide-y divide-[#eef2f7]">
                {FEATURE_ROWS.map(({ label, key }) => (
                  <div key={key} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-[#46546b]">{label}</span>
                    <FeatureValue value={PLAN_FEATURES[plan][key] as boolean | number} highlight={PLAN_MARKETING[plan].featured} />
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-[#d8dee9] bg-white px-4 py-12 text-center">
        <h2 className="text-2xl font-black text-[#0c1324]">No todos los centros necesitan lo mismo</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#647089]">
          Para grupos, migraciones o integraciones, revisamos el caso antes de prometer fechas o automatizaciones.
        </p>
        <Link href="/para-negocios#contacto" className="btn-primary mt-6 inline-flex">
          Hablar con ventas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <PublicFooter />
    </div>
  )
}
