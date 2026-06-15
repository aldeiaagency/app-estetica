import Link from 'next/link'
import { AlertCircle, ArrowUpRight, Calendar, Copy, DollarSign, Plus, ShoppingCart, Users, Zap } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
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

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

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
  const confirmedToday = todayBookings.filter(booking => booking.status === 'CONFIRMED').length
  const pendingToday = todayBookings.filter(booking => booking.status === 'PENDING').length
  const revenueThisMonth = monthOrderRevenue?._sum?.totalCents ?? 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9f3f2f]">Panel de negocio</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#171412]">
            Hola, {session?.user?.name?.split(' ')[0] ?? 'equipo'}
          </h1>
          <p className="mt-1 text-sm text-[#6c625a]">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/dashboard/reservas/nueva" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nueva reserva
        </Link>
      </div>

      {!center && (
        <div className="rounded-lg border border-dashed border-[#d7cbbb] bg-white p-10 text-center shadow-[0_20px_55px_rgba(42,32,24,0.06)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-[#f4ded6]">
            <AlertCircle className="h-7 w-7 text-[#9f3f2f]" />
          </div>
          <h2 className="mb-2 text-xl font-black text-[#171412]">Configura tu centro</h2>
          <p className="mx-auto mb-6 max-w-sm text-sm text-[#6c625a]">
            Aun no tienes ningun centro configurado. Crealo en menos de 5 minutos.
          </p>
          <Link href="/dashboard/configuracion" className="btn-primary">
            <Plus className="h-4 w-4" />
            Crear mi centro
          </Link>
        </div>
      )}

      {center && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Citas hoy',
                value: todayBookings.length,
                sub: `${confirmedToday} confirmadas · ${pendingToday} pendientes`,
                icon: Calendar,
                color: 'bg-[#f4ded6] text-[#9f3f2f]',
                href: '/dashboard/reservas',
              },
              {
                label: 'Ingresos este mes',
                value: formatPrice(revenueThisMonth),
                sub: 'Pedidos confirmados y entregados',
                icon: DollarSign,
                color: 'bg-[#eef4eb] text-[#4b7258]',
                href: '/dashboard/pedidos',
              },
              {
                label: 'Pedidos pendientes',
                value: pendingOrders,
                sub: 'Requieren confirmacion',
                icon: ShoppingCart,
                color: pendingOrders > 0 ? 'bg-amber-50 text-amber-700' : 'bg-[#eee7dd] text-[#6c625a]',
                href: '/dashboard/pedidos?estado=PENDING',
              },
              {
                label: 'Clientes totales',
                value: center._count.customers,
                sub: 'En tu CRM',
                icon: Users,
                color: 'bg-[#eef4eb] text-[#4b7258]',
                href: '/dashboard/clientes',
              },
            ].map(kpi => (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="group rounded-lg border border-[#e5ded3] bg-white p-5 shadow-[0_20px_55px_rgba(42,32,24,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(42,32,24,0.1)]"
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div className="text-3xl font-black tracking-tight text-[#171412]">{kpi.value}</div>
                <div className="mt-1 text-sm font-bold text-[#332b26]">{kpi.label}</div>
                <div className="mt-0.5 text-xs text-[#6c625a]">{kpi.sub}</div>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="overflow-hidden rounded-lg border border-[#e5ded3] bg-white shadow-[0_20px_55px_rgba(42,32,24,0.06)]">
              <div className="flex items-center justify-between border-b border-[#eee7dd] px-6 py-4">
                <div>
                  <h2 className="font-black text-[#171412]">Agenda de hoy</h2>
                  <p className="text-xs text-[#6c625a]">Vista rapida de citas y estados.</p>
                </div>
                <Link href="/dashboard/reservas" className="flex items-center gap-1.5 text-sm font-bold text-[#9f3f2f] hover:text-[#e36952]">
                  Ver todo <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {todayBookings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar className="mx-auto mb-3 h-10 w-10 text-[#cbbcaf]" />
                  <p className="text-sm text-[#6c625a]">No hay citas programadas para hoy</p>
                  <Link href="/dashboard/reservas/nueva" className="mt-3 inline-flex text-sm font-bold text-[#9f3f2f] hover:text-[#e36952]">
                    Anadir cita manual
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#f0e8dc]">
                  {todayBookings.map(booking => (
                    <div key={booking.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[#fbfaf7]">
                      <div className="shrink-0 text-center">
                        <p className="text-sm font-black text-[#171412]">
                          {new Date(booking.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`h-10 w-1 shrink-0 rounded-full ${
                        booking.status === 'CONFIRMED' ? 'bg-[#9fc4aa]' :
                        booking.status === 'PENDING' ? 'bg-amber-400' : 'bg-[#cbbcaf]'
                      }`} />
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4ded6] text-sm font-black text-[#9f3f2f]">
                        {booking.customer.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[#171412]">{booking.customer.name}</p>
                        <p className="truncate text-sm text-[#6c625a]">
                          {booking.service.name}{booking.staff ? ` · ${booking.staff.name}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        booking.status === 'CONFIRMED' ? 'bg-[#eef4eb] text-[#4b7258]' :
                        booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-[#eee7dd] text-[#6c625a]'
                      }`}>
                        {booking.status === 'CONFIRMED' ? 'Confirmada' : booking.status === 'PENDING' ? 'Pendiente' : booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-[#e5ded3] bg-white p-5 shadow-[0_20px_55px_rgba(42,32,24,0.06)]">
                <h3 className="mb-4 font-black text-[#171412]">Acciones rapidas</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Nueva reserva', href: '/dashboard/reservas/nueva', icon: Calendar, color: 'bg-[#f4ded6] text-[#9f3f2f]' },
                    { label: 'Servicios', href: '/dashboard/servicios', icon: Zap, color: 'bg-[#eef4eb] text-[#4b7258]' },
                    { label: 'Clientes', href: '/dashboard/clientes', icon: Users, color: 'bg-[#eee7dd] text-[#5f554d]' },
                    { label: 'Pedidos', href: '/dashboard/pedidos', icon: ShoppingCart, color: 'bg-amber-50 text-amber-700' },
                  ].map(action => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex flex-col items-center gap-2 rounded-md border border-[#eee7dd] p-3 text-center transition-all hover:-translate-y-0.5 hover:border-[#d7cbbb]"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${action.color}`}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold leading-tight text-[#5f554d]">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {bookingLink && (
                <div className="rounded-lg border border-[#e5ded3] bg-white p-5 shadow-[0_20px_55px_rgba(42,32,24,0.06)]">
                  <h3 className="mb-1 font-black text-[#171412]">Tu enlace de reserva</h3>
                  <p className="mb-3 text-xs text-[#6c625a]">Compartelo con tus clientes.</p>
                  <div className="flex items-center gap-2 rounded-md bg-[#f7f4ef] px-3 py-2.5">
                    <span className="flex-1 truncate font-mono text-xs text-[#6c625a]">{bookingLink}</span>
                    <button
                      className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#9f3f2f] transition-colors hover:text-[#e36952]"
                      title="Copiar"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </button>
                  </div>
                  <Link
                    href={`/centro/${center.slug}`}
                    target="_blank"
                    className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-[#6c625a] transition-colors hover:text-[#171412]"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Ver mi pagina publica
                  </Link>
                </div>
              )}

              <div className={`rounded-lg border p-5 ${
                center.published ? 'border-[#cfe0d2] bg-[#eef4eb]' : 'border-amber-200 bg-amber-50'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${center.published ? 'bg-[#4b7258]' : 'bg-amber-500'}`} />
                  <p className={`text-sm font-black ${center.published ? 'text-[#4b7258]' : 'text-amber-700'}`}>
                    {center.published ? 'Centro publicado' : 'Pendiente de publicacion'}
                  </p>
                </div>
                <p className={`mt-1 text-xs ${center.published ? 'text-[#4b7258]' : 'text-amber-700'}`}>
                  {center.published
                    ? 'Tu perfil es visible en el marketplace.'
                    : 'Tu perfil esta en revision. Te avisaremos pronto.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
