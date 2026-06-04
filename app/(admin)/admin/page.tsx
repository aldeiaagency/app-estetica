import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, Building2, Users, CalendarDays } from 'lucide-react'

export default async function AdminPage() {
  const session = await auth()
  if (session?.user?.role !== 'PLATFORM_ADMIN') redirect('/')

  const [totalCenters, publishedCenters, pendingCenters, totalOrgs, totalUsers, totalBookings] = await Promise.all([
    prisma.center.count(),
    prisma.center.count({ where: { published: true } }),
    prisma.center.count({ where: { published: false } }),
    prisma.organization.count(),
    prisma.user.count(),
    prisma.booking.count(),
  ])

  const recentCenters = await prisma.center.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { organization: true },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Plataforma Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Panel de administración · {new Date().toLocaleDateString('es-ES')}</p>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Centros totales', value: totalCenters, icon: Building2, sub: `${publishedCenters} publicados · ${pendingCenters} pendientes` },
          { label: 'Organizaciones', value: totalOrgs, icon: Users, sub: 'Cuentas de negocio' },
          { label: 'Usuarios', value: totalUsers, icon: Users, sub: 'Clientes + negocios' },
          { label: 'Reservas totales', value: totalBookings, icon: CalendarDays, sub: 'Todas las plataforma' },
          { label: 'Publicados', value: publishedCenters, icon: CheckCircle2, sub: 'Centros activos' },
          { label: 'Pendientes', value: pendingCenters, icon: Clock, sub: 'Esperando aprobación' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <kpi.icon className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-500">{kpi.label}</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{kpi.value}</div>
            <p className="mt-1 text-xs text-slate-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Centros recientes */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-900">Centros recientes</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {recentCenters.map((c) => (
            <div key={c.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                🏪
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                <p className="text-xs text-slate-400">{c.organization.name} · {c.addressCity}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  c.published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {c.published ? (
                    <><CheckCircle2 className="h-3 w-3" /> Publicado</>
                  ) : (
                    <><Clock className="h-3 w-3" /> Pendiente</>
                  )}
                </span>
                <Link
                  href={`/admin/centros/${c.id}`}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  Gestionar
                </Link>
              </div>
            </div>
          ))}
          {recentCenters.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              No hay centros registrados aún
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 px-6 py-3">
          <Link href="/admin/centros" className="text-sm font-medium text-rose-600 hover:text-rose-700">
            Ver todos los centros →
          </Link>
        </div>
      </div>
    </div>
  )
}
