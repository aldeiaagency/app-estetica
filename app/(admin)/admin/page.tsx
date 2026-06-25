import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2, Clock, Building2, Users, CalendarDays,
  TrendingUp, ShoppingCart, Gift, MessageSquareText
} from 'lucide-react'

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export default async function AdminPage() {
  const session = await auth()
  if (session?.user?.role !== 'PLATFORM_ADMIN') redirect('/')

  const [
    totalCenters, publishedCenters, pendingCenters,
    totalOrgs, totalUsers, totalBookings,
    totalOrderRevenue, totalOrders, totalBonoInstances, totalLeads,
  ] = await Promise.all([
    prisma.center.count(),
    prisma.center.count({ where: { published: true } }),
    prisma.center.count({ where: { published: false } }),
    prisma.organization.count(),
    prisma.user.count(),
    prisma.booking.count(),
    prisma.order.aggregate({
      where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
      _sum: { totalCents: true },
    }),
    prisma.order.count(),
    prisma.bonoInstance.count(),
    prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "Lead"`,
  ])

  const recentCenters = await prisma.center.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { organization: true },
  })

  const revenue = totalOrderRevenue._sum.totalCents ?? 0
  const leadsCount = Number(totalLeads[0]?.count ?? 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Plataforma Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Panel de administración · {new Date().toLocaleDateString('es-ES')}
        </p>
      </div>

      {/* KPIs — infraestructura */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Infraestructura</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Centros totales',  value: totalCenters,       icon: Building2,   sub: `${publishedCenters} publicados · ${pendingCenters} pendientes`,  color: 'text-primary-600 bg-primary-50',  href: '/admin/centros' },
            { label: 'Organizaciones',   value: totalOrgs,          icon: Users,       sub: 'Cuentas de negocio',                                              color: 'text-emerald-600 bg-emerald-50',  href: '/admin/organizaciones' },
            { label: 'Usuarios totales', value: totalUsers,         icon: Users,       sub: 'Clientes y negocios',                                             color: 'text-zinc-600 bg-zinc-100',       href: '#' },
            { label: 'Reservas totales', value: totalBookings,      icon: CalendarDays,sub: 'Todas las plataformas',                                           color: 'text-amber-600 bg-amber-50',      href: '#' },
            { label: 'Leads B2B',         value: leadsCount,         icon: MessageSquareText, sub: 'Solicitudes comerciales',                                   color: 'text-blue-600 bg-blue-50',        href: '/admin/leads' },
            { label: 'Publicados',       value: publishedCenters,   icon: CheckCircle2,sub: 'Centros activos',                                                 color: 'text-emerald-600 bg-emerald-50',  href: '/admin/centros?estado=published' },
            { label: 'Pendientes',       value: pendingCenters,     icon: Clock,       sub: 'Esperando aprobación',                                            color: pendingCenters > 0 ? 'text-amber-600 bg-amber-50' : 'text-zinc-400 bg-zinc-50', href: '/admin/centros?estado=pending' },
          ].map(kpi => (
            <Link key={kpi.label} href={kpi.href} className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-4.5 w-4.5 h-5 w-5" />
              </div>
              <div className="text-3xl font-black tracking-tight text-zinc-900">{kpi.value}</div>
              <div className="mt-1 text-sm font-medium text-zinc-700">{kpi.label}</div>
              <p className="mt-0.5 text-xs text-zinc-400">{kpi.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* KPIs — comercio */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Comercio</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Ingresos totales',  value: formatPrice(revenue),   icon: TrendingUp,    sub: 'Pedidos confirmados/entregados', color: 'text-emerald-600 bg-emerald-50', href: '/admin/metricas' },
            { label: 'Pedidos totales',   value: totalOrders,            icon: ShoppingCart,  sub: 'Todos los estados',              color: 'text-primary-600 bg-primary-50', href: '/admin/metricas' },
            { label: 'Bonos vendidos',    value: totalBonoInstances,     icon: Gift,          sub: 'Instancias creadas',             color: 'text-beauty-600 bg-beauty-50',   href: '/admin/metricas' },
          ].map(kpi => (
            <Link key={kpi.label} href={kpi.href} className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-black tracking-tight text-zinc-900">{kpi.value}</div>
              <div className="mt-1 text-sm font-medium text-zinc-700">{kpi.label}</div>
              <p className="mt-0.5 text-xs text-zinc-400">{kpi.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Centros recientes */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="font-bold text-zinc-900">Centros recientes</h2>
        </div>
        <div className="divide-y divide-zinc-50">
          {recentCenters.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50/50 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg">
                🏪
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 truncate">{c.name}</p>
                <p className="text-xs text-zinc-400">{c.organization.name} · {c.addressCity}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  c.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {c.published ? (
                    <><CheckCircle2 className="h-3 w-3" /> Publicado</>
                  ) : (
                    <><Clock className="h-3 w-3" /> Pendiente</>
                  )}
                </span>
                <Link
                  href={`/admin/centros/${c.id}`}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Gestionar
                </Link>
              </div>
            </div>
          ))}
          {recentCenters.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-zinc-400">
              No hay centros registrados aún
            </div>
          )}
        </div>
        <div className="border-t border-zinc-100 px-6 py-3">
          <Link href="/admin/centros" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Ver todos los centros →
          </Link>
        </div>
      </div>
    </div>
  )
}
