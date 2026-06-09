import type { Metadata } from 'next'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { CheckCircle2, XCircle, ArrowUpRight, Sparkles, CreditCard, Package } from 'lucide-react'
import { PLAN_FEATURES, PLAN_PRICES_CENTS, getPlanUpgrade } from '@/lib/billing/plans'
import { createCheckoutSessionAction, createBillingPortalSessionAction } from '@/app/actions/billing'
import type { Plan } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Mi plan — Belleza Local',
  robots: { index: false },
}

const PLAN_LABELS: Record<Plan, string> = {
  BASIC:   'Basic',
  PRO:     'Pro',
  GROWTH:  'Growth',
  PREMIUM: 'Premium',
}

const PLAN_COLORS: Record<Plan, string> = {
  BASIC:   'bg-zinc-100 text-zinc-700 border-zinc-200',
  PRO:     'bg-primary-50 text-primary-700 border-primary-200',
  GROWTH:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  PREMIUM: 'bg-amber-50 text-amber-700 border-amber-200',
}

const FEATURE_LABELS: { label: string; key: keyof typeof PLAN_FEATURES.BASIC }[] = [
  { label: 'Centros',               key: 'maxCenters'           },
  { label: 'Servicios / centro',    key: 'maxServicesPerCenter' },
  { label: 'Staff / centro',        key: 'maxStaffPerCenter'    },
  { label: 'Bonos de sesiones',     key: 'hasBonos'             },
  { label: 'Tienda de productos',   key: 'hasProducts'          },
  { label: 'Promociones',           key: 'hasPromotions'        },
  { label: 'Reseñas verificadas',   key: 'hasReviews'           },
  { label: 'Lista de espera',       key: 'hasWaitlist'          },
  { label: 'CRM de clientes',       key: 'hasCRM'               },
  { label: 'Multi-centro',          key: 'hasMultiCenter'       },
  { label: 'Destacado marketplace', key: 'hasFeaturedListing'   },
]

function maxLabel(n: number) {
  return n === -1 ? 'Ilimitado' : String(n)
}

function euros(cents: number) {
  return `${(cents / 100).toFixed(0)} €`
}

const PLANS_ORDER: Plan[] = ['BASIC', 'PRO', 'GROWTH', 'PREMIUM']

export default async function PlanPage() {
  const session = await auth()
  const orgId   = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: {
      name: true,
      plan: true,
      stripeSubscriptionId: true,
      stripeCustomerId:     true,
      planExpiresAt:        true,
      addOns: { where: { active: true }, select: { addOnType: true } },
    },
  })

  const currentPlan    = org.plan
  const features       = PLAN_FEATURES[currentPlan]
  const nextPlan       = getPlanUpgrade(currentPlan)
  const hasSubscription = !!org.stripeSubscriptionId

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Mi plan</h1>
        <p className="mt-1 text-sm text-zinc-500">Gestiona tu suscripción y características disponibles</p>
      </div>

      {/* Current plan card */}
      <div className={`rounded-3xl border-2 p-8 ${PLAN_COLORS[currentPlan]}`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 shadow-sm">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Plan actual</p>
                <h2 className="text-2xl font-black">{PLAN_LABELS[currentPlan]}</h2>
              </div>
            </div>
            <p className="mt-3 text-sm opacity-70">
              {euros(PLAN_PRICES_CENTS[currentPlan].monthly)}/mes
              {org.planExpiresAt && (
                <span className="ml-2">
                  · Expira {new Date(org.planExpiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            {hasSubscription && (
              <form action={createBillingPortalSessionAction}>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-white/70 px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:bg-white hover:shadow-md"
                >
                  <CreditCard className="h-4 w-4" />
                  Gestionar facturación
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                </button>
              </form>
            )}
            {nextPlan && (
              <form action={createCheckoutSessionAction.bind(null, nextPlan)}>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <Sparkles className="h-4 w-4 text-primary-600" />
                  Actualizar a {PLAN_LABELS[nextPlan]}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Active add-ons */}
      {org.addOns.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-bold text-zinc-900">Add-ons activos</h2>
          <div className="flex flex-wrap gap-2">
            {org.addOns.map(a => (
              <span key={a.addOnType} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 border border-primary-200">
                {a.addOnType.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Features of current plan */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="font-bold text-zinc-900">Características de tu plan</h2>
        </div>
        <div className="divide-y divide-zinc-50">
          {FEATURE_LABELS.map(({ label, key }) => {
            const val = features[key]
            return (
              <div key={key} className="flex items-center justify-between px-6 py-3">
                <span className="text-sm text-zinc-700">{label}</span>
                <span>
                  {typeof val === 'boolean' ? (
                    val
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : <XCircle className="h-5 w-5 text-zinc-200" />
                  ) : (
                    <span className="text-sm font-semibold text-zinc-900">{maxLabel(val as number)}</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* All plans comparison */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="font-bold text-zinc-900">Todos los planes</h2>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS_ORDER.map((plan) => {
            const isCurrent = plan === currentPlan
            return (
              <div
                key={plan}
                className={`rounded-2xl border p-5 ${
                  isCurrent
                    ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-zinc-200 bg-white'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-black text-zinc-900">{PLAN_LABELS[plan]}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-bold text-white">
                      Actual
                    </span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-black text-zinc-900">
                    {euros(PLAN_PRICES_CENTS[plan].monthly)}
                  </span>
                  <span className="text-xs text-zinc-400">/mes</span>
                </div>
                {!isCurrent && (
                  <form action={createCheckoutSessionAction.bind(null, plan)}>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-primary-600 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700"
                    >
                      {PLANS_ORDER.indexOf(plan) > PLANS_ORDER.indexOf(currentPlan)
                        ? 'Actualizar'
                        : 'Cambiar'}
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
        <div className="border-t border-zinc-100 px-6 py-3 text-center">
          <a
            href="/precios"
            target="_blank"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Ver comparativa completa →
          </a>
        </div>
      </div>
    </div>
  )
}
