import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react'
import { PLAN_FEATURES, PLAN_PRICES_CENTS } from '@/lib/billing/plans'
import type { Plan } from '@prisma/client'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: 'Precios — Belleza Local',
  description: 'Planes simples y transparentes para centros de estética, peluquerías y spas. Empieza gratis y escala cuando lo necesites.',
}

const PLANS: { key: Plan; label: string; desc: string; highlight: boolean }[] = [
  { key: 'BASIC',   label: 'Basic',   desc: 'Para empezar sin coste',          highlight: false },
  { key: 'PRO',     label: 'Pro',     desc: 'El más popular para centros',     highlight: true  },
  { key: 'GROWTH',  label: 'Growth',  desc: 'Para centros con varios locales', highlight: false },
  { key: 'PREMIUM', label: 'Premium', desc: 'Máxima potencia y soporte',       highlight: false },
]

const FEATURE_ROWS: { label: string; key: keyof typeof PLAN_FEATURES.BASIC }[] = [
  { label: 'Centros',               key: 'maxCenters'            },
  { label: 'Servicios / centro',    key: 'maxServicesPerCenter'  },
  { label: 'Staff / centro',        key: 'maxStaffPerCenter'     },
  { label: 'Reservas online',       key: 'hasBookingDeposit'     },
  { label: 'Bonos de sesiones',     key: 'hasBonos'              },
  { label: 'Tienda de productos',   key: 'hasProducts'           },
  { label: 'Promociones',           key: 'hasPromotions'         },
  { label: 'Reseñas verificadas',   key: 'hasReviews'            },
  { label: 'Lista de espera',       key: 'hasWaitlist'           },
  { label: 'CRM de clientes',       key: 'hasCRM'                },
  { label: 'Multi-centro',          key: 'hasMultiCenter'        },
  { label: 'Destacado marketplace', key: 'hasFeaturedListing'    },
  { label: 'White-label',           key: 'hasWhiteLabelOption'   },
  { label: 'Acceso API',            key: 'hasApiAccess'          },
]

function maxLabel(n: number) { return n === -1 ? 'Ilimitado' : String(n) }
function euros(cents: number) { return `${(cents / 100).toFixed(0)} €` }

function FeatureValue({ val, highlight }: { val: boolean | number; highlight: boolean }) {
  if (typeof val === 'boolean') {
    return val
      ? <CheckCircle2 className={`mx-auto h-4 w-4 ${highlight ? 'text-[#2f6df6]' : 'text-emerald-500'}`} />
      : <XCircle className="mx-auto h-4 w-4 text-[#d8dee9]" />
  }
  return <span className={`font-semibold ${highlight ? 'text-[#2355c8]' : 'text-[#273244]'}`}>{maxLabel(val)}</span>
}

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <PublicHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-12 text-center sm:py-16">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#cfe0ff] bg-[#e5edff] px-4 py-1.5 text-xs font-semibold text-[#2355c8]">
          <Sparkles className="h-3 w-3" />
          Prueba gratis 14 días en cualquier plan
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#0c1324] sm:text-5xl">
          Precios claros.<br />Sin sorpresas.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-[#647089] sm:text-lg">
          Elige el plan que mejor se adapte a tu negocio. Cambia o cancela cuando quieras.
        </p>
      </section>

      {/* Plan cards */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map(({ key, label, desc, highlight }) => {
            const price    = PLAN_PRICES_CENTS[key].monthly
            const features = PLAN_FEATURES[key]
            return (
              <div
                key={key}
                className={`relative flex flex-col rounded-lg border p-6 ${
                  highlight
                    ? 'border-[#2f6df6] bg-[#2f6df6] text-white shadow-xl shadow-[#2f6df6]/20'
                    : 'border-[#d8dee9] bg-white shadow-sm'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900 shadow whitespace-nowrap">
                    Más popular
                  </div>
                )}
                <div className="mb-4">
                  <h2 className={`text-lg font-black ${highlight ? 'text-white' : 'text-[#0c1324]'}`}>{label}</h2>
                  <p className={`mt-0.5 text-xs ${highlight ? 'text-[#cfe0ff]' : 'text-[#8b96aa]'}`}>{desc}</p>
                </div>
                <div className="mb-6">
                  <span className={`text-4xl font-black ${highlight ? 'text-white' : 'text-[#0c1324]'}`}>
                    {euros(price)}
                  </span>
                  <span className={`ml-1 text-sm ${highlight ? 'text-[#cfe0ff]' : 'text-[#8b96aa]'}`}>/mes</span>
                </div>
                <Link
                  href="/auth/signup"
                  className={`mb-6 flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                    highlight
                      ? 'bg-white text-[#2355c8] hover:bg-[#e5edff] shadow'
                      : 'bg-[#2f6df6] text-white hover:bg-[#2355c8]'
                  }`}
                >
                  Empezar <ArrowRight className="h-4 w-4" />
                </Link>
                <ul className="space-y-2.5">
                  {[
                    `${maxLabel(features.maxCenters)} centro${features.maxCenters !== 1 ? 's' : ''}`,
                    `${maxLabel(features.maxServicesPerCenter)} servicios`,
                    features.hasBonos           ? 'Bonos de sesiones'        : null,
                    features.hasProducts        ? 'Tienda de productos'      : null,
                    features.hasPromotions      ? 'Promociones'              : null,
                    features.hasReviews         ? 'Reseñas verificadas'      : null,
                    features.hasWaitlist        ? 'Lista de espera'          : null,
                    features.hasCRM             ? 'CRM de clientes'          : null,
                    features.hasMultiCenter     ? 'Multi-centro'             : null,
                    features.hasFeaturedListing ? 'Destacado marketplace'    : null,
                  ].filter(Boolean).map((item) => (
                    <li key={item} className={`flex items-center gap-2 text-sm ${highlight ? 'text-[#e5edff]' : 'text-[#46546b]'}`}>
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${highlight ? 'text-[#cfe0ff]' : 'text-emerald-500'}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Comparison table — desktop (hidden on mobile) */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="mb-6 text-center text-2xl font-black text-[#0c1324]">Comparativa completa</h2>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-lg border border-[#d8dee9] bg-white shadow-sm sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5eaf2] bg-[#f1f4f8]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8b96aa] w-48">
                  Característica
                </th>
                {PLANS.map(({ key, label, highlight }) => (
                  <th key={key} className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wide ${highlight ? 'text-[#2f6df6]' : 'text-[#273244]'}`}>
                    {label}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-[#e5eaf2] bg-[#f1f4f8]/50">
                <td className="px-6 py-3 text-xs text-[#8b96aa]">Precio mensual</td>
                {PLANS.map(({ key, highlight }) => (
                  <td key={key} className={`px-6 py-3 text-center font-bold ${highlight ? 'text-[#2f6df6]' : 'text-[#0c1324]'}`}>
                    {euros(PLAN_PRICES_CENTS[key].monthly)}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f7]">
              {FEATURE_ROWS.map(({ label, key }) => (
                <tr key={key} className="hover:bg-[#f1f4f8]/50">
                  <td className="px-6 py-3 text-[#46546b]">{label}</td>
                  {PLANS.map(({ key: plan, highlight }) => (
                    <td key={plan} className="px-6 py-3 text-center">
                      <FeatureValue val={PLAN_FEATURES[plan][key] as boolean | number} highlight={highlight} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile comparison — accordion per plan */}
        <div className="flex flex-col gap-4 sm:hidden">
          {PLANS.map(({ key, label, highlight }) => (
            <details key={key} className={`rounded-lg border overflow-hidden ${highlight ? 'border-[#b9c4d5]' : 'border-[#d8dee9]'}`}>
              <summary className={`flex cursor-pointer items-center justify-between px-5 py-4 font-semibold select-none ${highlight ? 'bg-[#e5edff] text-[#2355c8]' : 'bg-white text-[#0c1324]'}`}>
                <span>{label}</span>
                <span className={`text-sm font-bold ${highlight ? 'text-[#2f6df6]' : 'text-[#647089]'}`}>
                  {euros(PLAN_PRICES_CENTS[key].monthly)}/mes
                </span>
              </summary>
              <div className="bg-white divide-y divide-[#eef2f7]">
                {FEATURE_ROWS.map(({ label: fLabel, key: fKey }) => (
                  <div key={fKey} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-[#46546b]">{fLabel}</span>
                    <FeatureValue val={PLAN_FEATURES[key][fKey] as boolean | number} highlight={highlight} />
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="border-t border-[#e5eaf2] bg-[#f1f4f8] px-6 py-16 text-center">
        <h2 className="text-2xl font-black text-[#0c1324]">¿Tienes dudas?</h2>
        <p className="mt-2 text-[#647089]">Escríbenos y te ayudamos a elegir el plan perfecto para tu negocio.</p>
        <a
          href="mailto:hola@bellezalocal.es"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#2f6df6] px-6 py-3 font-semibold text-white hover:bg-[#2355c8] transition-colors"
        >
          Contactar
        </a>
      </section>
      <PublicFooter />
    </div>
  )
}
