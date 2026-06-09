import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import Link from 'next/link'
import { Calendar, Users, TrendingUp, AlertCircle, Plus, Copy, ArrowUpRight, Zap, DollarSign, ShoppingCart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId

  const center = orgId
    ? await prisma.center.findFirst({
        where: { organizationId: orgId },
        include: { _count: { select: { bookings: true, customers: true } } },
      })
    : null

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const [todayBookings, monthOrderRevenue, pendingOrders] = center
    ? await Promise.all([
        prisma.booking.findMany({
          where: { centerId: center.id, startAt: { gte: todayStart, lte: todayEnd } },
          include: { service: true, staff: true, customer: true },
          orderBy: { startAt: 'asc' },
        }),
        prisma.order.aggregate({
          where: { centerId: center.id, status: { in: ['CONFIRMED', 'DELIVERED'] }, createdAt: { gte: monthStart } },
          _sum: { totalCents: true },
        }),
        prisma.order.count({ where: { centerId: center.id, status: 'PENDING' } }),
      ])
    : [[], null, 0]

  const bookingLink = center ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/centro/${center.slug}` : null

  const confirmedToday = todayBookings.filter(b => b.status === 'CONFIRMED').length
  const pendingToday   = todayBookings.filter(b => b.status === 'PENDING').length
  const revenueThisMonth = monthOrderRevenue?._sum?.totalCents ?? 0

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            Hola, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          href="/dashboard/reservas/nueva"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/20 transition-all hover:bg-primary-700 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />Nueva reserva
        </Link>
      </div>

      {/* No center — onboarding */}
      {!center && (
        <div className="rounded-3xl border-2 border-dashed border-zinc-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <AlertCircle className="h-7 w-7 text-primary-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-zinc-900">Configura tu centro</h2>
          <p className="mb-6 max-w-sm mx-auto text-sm text-zinc-500">
            Aún no tienes ningún centro configurado. Créalo en menos de 5 minutos.
          </p>
          <Link href="/dashboard/configuracion" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700">
            <Plus className="h-4 w-4" />Crear mi centro
          </Link>
        </div>
      )}

      {center && (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Citas hoy',        value: todayBookings.length,    sub: `${confirmedToday} confirmadas · ${pendingToday} pendientes`, icon: Calendar,     color: 'bg-primary-50 text-primary-600', href: '/dashboard/reservas' },
              { label: 'Ingresos este mes', value: formatPrice(revenueThisMonth), sub: 'Pedidos confirmados/entregados',                       icon: DollarSign,   color: 'bg-emerald-50 text-emerald-600', href: '/dashboard/pedidos'  },
              { label: 'Pedidos pendientes',value: pendingOrders,           sub: 'Requieren confirmación',                                    icon: ShoppingCart, color: pendingOrders > 0 ? 'bg-amber-50 text-amber-600' : 'bg-zinc-50 text-zinc-400', href: '/dashboard/pedidos?estado=PENDING' },
              { label: 'Clientes totales',  value: center._count.customers, sub: 'En tu CRM',                                                 icon: Users,        color: 'bg-beauty-50 text-beauty-600',   href: '/dashboard/clientes' },
            ].map((kpi) => (
              <Link key={kpi.label} href={kpi.href} className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div className="text-3xl font-black tracking-tight text-zinc-900">{kpi.value}</div>
                <div className="mt-1 text-sm font-medium text-zinc-700">{kpi.label}</div>
                <div className="mt-0.5 text-xs text-zinc-400">{kpi.sub}</div>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Today agenda */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                <h2 className="font-bold text-zinc-900">Agenda de hoy</h2>
                <Link href="/dashboard/reservas" className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700">
                  Ver todo <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {todayBookings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
                  <p className="text-sm text-zinc-400">No hay citas programadas para hoy</p>
                  <Link href="/dashboard/reservas/nueva" className="mt-3 inline-flex text-sm font-semibold text-primary-600 hover:text-primary-700">
                    + Añadir cita manual
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {todayBookings.map((b) => (
                    <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50/50 transition-colors">
                      <div className="shrink-0 text-center">
                        <p className="text-sm font-bold text-zinc-900">
                          {new Date(b.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`h-10 w-1 shrink-0 rounded-full ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-400' :
                        b.status === 'PENDING'   ? 'bg-amber-400' : 'bg-zinc-300'
                      }`} />
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-600">
                        {b.customer.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 truncate">{b.customer.name}</p>
                        <p className="text-sm text-zinc-500 truncate">{b.service.name}{b.staff ? ` · ${b.staff.name}` : ''}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                        b.status === 'PENDING'   ? 'bg-amber-50 text-amber-700' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {b.status === 'CONFIRMED' ? 'Confirmada' : b.status === 'PENDING' ? 'Pendiente' : b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar cards */}
            <div className="space-y-4">
              {/* Quick actions */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-zinc-900">Acciones rápidas</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Nueva reserva',  href: '/dashboard/reservas/nueva', icon: Calendar,     color: 'bg-primary-50 text-primary-600' },
                    { label: 'Servicios',      href: '/dashboard/servicios',      icon: Zap,          color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Clientes',       href: '/dashboard/clientes',       icon: Users,        color: 'bg-beauty-50 text-beauty-600'   },
                    { label: 'Pedidos',        href: '/dashboard/pedidos',        icon: ShoppingCart, color: 'bg-amber-50 text-amber-600'     },
                  ].map((a) => (
                    <Link key={a.href} href={a.href}
                      className="flex flex-col items-center gap-2 rounded-xl border border-zinc-100 p-3 text-center transition-all hover:border-zinc-200 hover:shadow-sm hover:-translate-y-0.5">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.color}`}>
                        <a.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-zinc-600 leading-tight">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Booking link */}
              {bookingLink && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-1 font-semibold text-zinc-900">Tu enlace de reserva</h3>
                  <p className="mb-3 text-xs text-zinc-400">Compártelo con tus clientes.</p>
                  <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5">
                    <span className="flex-1 truncate font-mono text-xs text-zinc-500">{bookingLink}</span>
                    <button
                      className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                      title="Copiar"
                    >
                      <Copy className="h-3.5 w-3.5" />Copiar
                    </button>
                  </div>
                  <Link
                    href={`/centro/${center.slug}`}
                    target="_blank"
                    className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />Ver mi página pública
                  </Link>
                </div>
              )}

              {/* Status */}
              <div className={`rounded-2xl border p-5 ${center.published ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${center.published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <p className={`text-sm font-semibold ${center.published ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {center.published ? 'Centro publicado' : 'Pendiente de publicación'}
                  </p>
                </div>
                <p className={`mt-1 text-xs ${center.published ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {center.published
                    ? 'Tu perfil es visible en el marketplace.'
                    : 'Tu perfil está en revisión. Te avisaremos pronto.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
