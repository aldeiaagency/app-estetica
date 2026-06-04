import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { PLAN_FEATURES, PLAN_PRICES_CENTS } from '@/lib/billing/plans'
import type { Plan } from '@prisma/client'
import { CheckCircle2, XCircle } from 'lucide-react'

const PLAN_COLORS: Record<Plan, string> = {
  BASIC: 'bg-slate-100 text-slate-600 border-slate-200',
  PRO: 'bg-blue-50 text-blue-700 border-blue-200',
  GROWTH: 'bg-green-50 text-green-700 border-green-200',
  PREMIUM: 'bg-purple-50 text-purple-700 border-purple-200',
}

const PLAN_BADGE: Record<Plan, string> = {
  BASIC: 'bg-slate-100 text-slate-600',
  PRO: 'bg-blue-100 text-blue-700',
  GROWTH: 'bg-green-100 text-green-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
}

const PLANS: Plan[] = ['BASIC', 'PRO', 'GROWTH', 'PREMIUM']

function euros(cents: number) {
  return `${(cents / 100).toFixed(0)}€`
}

function maxLabel(n: number) {
  return n === -1 ? 'Ilimitado' : String(n)
}

const FEATURE_ROWS: { label: string; key: keyof typeof PLAN_FEATURES.BASIC }[] = [
  { label: 'Centros máximos', key: 'maxCenters' },
  { label: 'Servicios por centro', key: 'maxServicesPerCenter' },
  { label: 'Staff por centro', key: 'maxStaffPerCenter' },
  { label: 'Depósito de reserva', key: 'hasBookingDeposit' },
  { label: 'Bonos de sesiones', key: 'hasBonos' },
  { label: 'Productos', key: 'hasProducts' },
  { label: 'Promociones', key: 'hasPromotions' },
  { label: 'Reseñas', key: 'hasReviews' },
  { label: 'Lista de espera', key: 'hasWaitlist' },
  { label: 'CRM de clientes', key: 'hasCRM' },
  { label: 'Multi-centro', key: 'hasMultiCenter' },
  { label: 'Featured listing', key: 'hasFeaturedListing' },
  { label: 'White-label', key: 'hasWhiteLabelOption' },
  { label: 'Acceso API', key: 'hasApiAccess' },
]

export default async function AdminPlanesPage() {
  const session = await auth()
  if (session?.user?.role !== 'PLATFORM_ADMIN') redirect('/')

  const planStats = await prisma.organization.groupBy({
    by: ['plan'],
    _count: { id: true },
  })

  const statsMap = Object.fromEntries(planStats.map((s) => [s.plan, s._count.id]))
  const totalOrgs = planStats.reduce((acc, s) => acc + s._count.id, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Planes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Comparativa de planes y distribución de organizaciones
        </p>
      </div>

      {/* Distribución */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const count = statsMap[plan] ?? 0
          const pct = totalOrgs > 0 ? Math.round((count / totalOrgs) * 100) : 0
          return (
            <div
              key={plan}
              className={`rounded-2xl border bg-white p-6 shadow-sm ${PLAN_COLORS[plan]}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PLAN_BADGE[plan]}`}>
                  {plan}
                </span>
                <span className="text-xs text-slate-400">{pct}%</span>
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">{count}</div>
              <p className="mt-0.5 text-xs text-slate-400">
                organización{count !== 1 ? 'es' : ''}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {euros(PLAN_PRICES_CENTS[plan].monthly)}/mes
              </p>
            </div>
          )
        })}
      </div>

      {/* Tabla comparativa */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-900">Comparativa de características</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Los precios son informativos. La gestión real de suscripciones se realiza vía Stripe.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Característica
                </th>
                {PLANS.map((plan) => (
                  <th
                    key={plan}
                    className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-700"
                  >
                    <span className={`rounded-full px-2.5 py-1 ${PLAN_BADGE[plan]}`}>{plan}</span>
                  </th>
                ))}
              </tr>
              {/* Price row */}
              <tr className="border-b border-slate-100 bg-slate-50">
                <td className="px-6 py-3 text-xs font-medium text-slate-500">Precio mensual</td>
                {PLANS.map((plan) => (
                  <td key={plan} className="px-6 py-3 text-center font-bold text-slate-900">
                    {euros(PLAN_PRICES_CENTS[plan].monthly)}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {FEATURE_ROWS.map((row) => (
                <tr key={row.key} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 text-slate-600">{row.label}</td>
                  {PLANS.map((plan) => {
                    const val = PLAN_FEATURES[plan][row.key]
                    return (
                      <td key={plan} className="px-6 py-3 text-center">
                        {typeof val === 'boolean' ? (
                          val ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-slate-300" />
                          )
                        ) : (
                          <span className="font-medium text-slate-700">
                            {maxLabel(val as number)}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-3">
          <p className="text-xs text-slate-400">
            Total organizaciones: {totalOrgs}
          </p>
        </div>
      </div>
    </div>
  )
}
