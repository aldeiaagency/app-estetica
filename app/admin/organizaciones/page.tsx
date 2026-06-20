import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { updateOrganizationPlanAction } from '@/app/actions/admin'
import { Building2 } from 'lucide-react'
import { PLAN_MARKETING, PLAN_ORDER } from '@/lib/billing/plans'

const PLAN_COLORS: Record<string, string> = {
  BASIC: 'bg-slate-100 text-slate-600',
  PRO: 'bg-blue-100 text-blue-700',
  GROWTH: 'bg-green-100 text-green-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
}

export default async function AdminOrganizacionesPage() {
  const session = await auth()
  if (session?.user?.role !== 'PLATFORM_ADMIN') redirect('/')

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { centers: true, users: true } },
      addOns: { where: { active: true }, select: { addOnType: true } },
    },
  })

  async function changePlan(orgId: string, fd: FormData) {
    'use server'
    const plan = fd.get('plan') as string
    await updateOrganizationPlanAction(orgId, plan, session?.user?.id ?? '')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Organizaciones</h1>
        <p className="mt-1 text-sm text-slate-500">
          {organizations.length} {organizations.length === 1 ? 'organización' : 'organizaciones'} registradas
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Building2 className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-500">No hay organizaciones</p>
            <p className="mt-1 text-sm text-slate-400">
              Aún no se han registrado organizaciones en la plataforma
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Table header */}
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_2fr_2fr] gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
              <span>Organización</span>
              <span>Plan actual</span>
              <span>Centros</span>
              <span>Usuarios</span>
              <span>Add-ons activos</span>
              <span>Cambiar plan</span>
            </div>

            {organizations.map((org) => (
              <div
                key={org.id}
                className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-[2fr_1fr_1fr_1fr_2fr_2fr] sm:items-center"
              >
                {/* Nombre + fecha */}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{org.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    /{org.slug} · {new Date(org.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>

                {/* Plan badge */}
                <div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      PLAN_COLORS[org.plan] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {PLAN_MARKETING[org.plan].name}
                  </span>
                </div>

                {/* Centros */}
                <div className="text-sm text-slate-700">{org._count.centers}</div>

                {/* Usuarios */}
                <div className="text-sm text-slate-700">{org._count.users}</div>

                {/* Add-ons */}
                <div className="flex flex-wrap gap-1">
                  {org.addOns.length === 0 ? (
                    <span className="text-xs text-slate-300">Ninguno</span>
                  ) : (
                    org.addOns.map((a) => (
                      <span
                        key={a.addOnType}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        {a.addOnType}
                      </span>
                    ))
                  )}
                </div>

                {/* Cambiar plan */}
                <form
                  action={async (fd) => {
                    'use server'
                    await changePlan(org.id, fd)
                  }}
                  className="flex items-center gap-2"
                >
                  <select
                    name="plan"
                    defaultValue={org.plan}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-300"
                  >
                    {PLAN_ORDER.map(plan => (
                      <option key={plan} value={plan}>{PLAN_MARKETING[plan].name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Cambiar
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 px-6 py-3">
          <p className="text-xs text-slate-400">
            {organizations.length} {organizations.length === 1 ? 'registro' : 'registros'} en total
          </p>
        </div>
      </div>
    </div>
  )
}
