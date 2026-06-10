import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react'
import { PLAN_FEATURES, PLAN_PRICES_CENTS } from '@/lib/billing/plans'
import type { Plan } from '@prisma/client'

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
      ? <CheckCircle2 className={`mx-auto h-4 w-4 ${highlight ? 'text-primary-600' : 'text-emerald-500'}`} />
      : <XCircle className="mx-auto h-4 w-4 text-zinc-200" />
  }
  return <span className={`font-semibold ${highlight ? 'text-primary-700' : 'text-zinc-700'}`}>{maxLabel(val)}</span>
}

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-zinc-100 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-black tracking-tight text-zinc-900">BellezaLocal</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">
              Iniciar sesión
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-12 text-center sm:py-16">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
          <Sparkles className="h-3 w-3" />
          Prueba gratis 14 días en cualquier plan
        </div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-5xl">
          Precios claros.<br />Sin sorpresas.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500 sm:text-lg">
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
                className={`relative flex flex-col rounded-3xl border p-6 ${
                  highlight
                    ? 'border-primary-600 bg-primary-600 text-white shadow-xl shadow-primary-500/20'
                    : 'border-zinc-200 bg-white shadow-sm'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900 shadow whitespace-nowrap">
                    Más popular
                  </div>
                )}
                <div className="mb-4">
                  <h2 className={`text-lg font-black ${highlight ? 'text-white' : 'text-zinc-900'}`}>{label}</h2>
                  <p className={`mt-0.5 text-xs ${highlight ? 'text-primary-200' : 'text-zinc-400'}`}>{desc}</p>
                </div>
                <div className="mb-6">
                  <span className={`text-4xl font-black ${highlight ? 'text-white' : 'text-zinc-900'}`}>
                    {euros(price)}
                  </span>
                  <span className={`ml-1 text-sm ${highlight ? 'text-primary-200' : 'text-zinc-400'}`}>/mes</span>
                </div>
                <Link
                  href="/auth/signup"
                  className={`mb-6 flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                    highlight
                      ? 'bg-white text-primary-700 hover:bg-primary-50 shadow'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
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
                    <li key={item} className={`flex items-center gap-2 text-sm ${highlight ? 'text-primary-100' : 'text-zinc-600'}`}>
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${highlight ? 'text-primary-200' : 'text-emerald-500'}`} />
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
        <h2 className="mb-6 text-center text-2xl font-black text-zinc-900">Comparativa completa</h2>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 w-48">
                  Característica
                </th>
                {PLANS.map(({ key, label, highlight }) => (
                  <th key={key} className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wide ${highlight ? 'text-primary-600' : 'text-zinc-700'}`}>
                    {label}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <td className="px-6 py-3 text-xs text-zinc-400">Precio mensual</td>
                {PLANS.map(({ key, highlight }) => (
                  <td key={key} className={`px-6 py-3 text-center font-bold ${highlight ? 'text-primary-600' : 'text-zinc-900'}`}>
                    {euros(PLAN_PRICES_CENTS[key].monthly)}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {FEATURE_ROWS.map(({ label, key }) => (
                <tr key={key} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-3 text-zinc-600">{label}</td>
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
            <details key={key} className={`rounded-2xl border overflow-hidden ${highlight ? 'border-primary-300' : 'border-zinc-200'}`}>
              <summary className={`flex cursor-pointer items-center justify-between px-5 py-4 font-semibold select-none ${highlight ? 'bg-primary-50 text-primary-700' : 'bg-white text-zinc-900'}`}>
                <span>{label}</span>
                <span className={`text-sm font-bold ${highlight ? 'text-primary-600' : 'text-zinc-500'}`}>
                  {euros(PLAN_PRICES_CENTS[key].monthly)}/mes
                </span>
              </summary>
              <div className="bg-white divide-y divide-zinc-50">
                {FEATURE_ROWS.map(({ label: fLabel, key: fKey }) => (
                  <div key={fKey} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-zinc-600">{fLabel}</span>
                    <FeatureValue val={PLAN_FEATURES[key][fKey] as boolean | number} highlight={highlight} />
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="border-t border-zinc-100 bg-zinc-50 px-6 py-16 text-center">
        <h2 className="text-2xl font-black text-zinc-900">¿Tienes dudas?</h2>
        <p className="mt-2 text-zinc-500">Escríbenos y te ayudamos a elegir el plan perfecto para tu negocio.</p>
        <a
          href="mailto:hola@bellezalocal.es"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          Contactar
        </a>
      </section>
    </div>
  )
}
