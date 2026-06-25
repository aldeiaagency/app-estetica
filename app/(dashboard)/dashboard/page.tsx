import Link from 'next/link'
import { AlertCircle, ArrowUpRight, Calendar, CheckCircle2, Circle, Copy, DollarSign, Plus, Repeat2, ShoppingCart, Users, Zap } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'
import { getRebookingOpportunities } from '@/app/actions/follow-ups'
import { getPublicAppUrl } from '@/lib/config/app-url'

export default async function DashboardPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId

  const center = orgId
    ? await prisma.center.findFirst({
        where: { organizationId: orgId },
        include: {
          scheduleRules: { where: { active: true }, select: { id: true }, take: 1 },
          _count: { select: { bookings: true, customers: true, services: true, staff: true } },
        },
      })
    : null

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [todayBookings, monthOrderRevenue, pendingOrders, rebookingOpportunities] = center
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
        getRebookingOpportunities(orgId ?? '', 8),
      ])
    : [[], null, 0, []]

  const bookingLink = center ? `${getPublicAppUrl()}/centro/${center.slug}` : null
  const confirmedToday = todayBookings.filter(booking => booking.status === 'CONFIRMED').length
  const pendingToday = todayBookings.filter(booking => booking.status === 'PENDING').length
  const revenueThisMonth = monthOrderRevenue?._sum?.totalCents ?? 0
  const activationSteps = center
    ? [
        { label: 'Ficha del centro', done: Boolean(center.name && center.addressCity), href: '/dashboard/configuracion' },
        { label: 'Servicios', done: center._count.services > 0, href: '/dashboard/servicios' },
        { label: 'Profesionales', done: center._count.staff > 0, href: '/dashboard/staff' },
        { label: 'Horario activo', done: center.scheduleRules.length > 0, href: '/dashboard/horarios' },
        { label: 'Perfil publicado', done: center.published, href: '/dashboard/configuracion' },
      ]
    : []
  const completedActivationSteps = activationSteps.filter(step => step.done).length
  const activationComplete = center ? completedActivationSteps === activationSteps.length : false

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2355c8]">Panel de negocio</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0c1324]">
            Hola, {session?.user?.name?.split(' ')[0] ?? 'equipo'}
          </h1>
          <p className="mt-1 text-sm text-[#647089]">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/dashboard/reservas" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nueva reserva
        </Link>
      </div>

      {!center && (
        <div className="rounded-lg border border-dashed border-[#d8dee9] bg-white p-10 text-center shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-[#e5edff]">
            <AlertCircle className="h-7 w-7 text-[#2355c8]" />
          </div>
          <h2 className="mb-2 text-xl font-black text-[#0c1324]">Configura tu centro</h2>
          <p className="mx-auto mb-6 max-w-sm text-sm text-[#647089]">
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
          {!activationComplete && (
            <div className="rounded-lg border border-[#cfe0ff] bg-[#edf3ff] p-5 shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2355c8]">Activacion</p>
                  <h2 className="mt-1 text-xl font-black text-[#0c1324]">Prepara tu centro para recibir reservas</h2>
                  <p className="mt-1 text-sm text-[#647089]">
                    {completedActivationSteps} de {activationSteps.length} pasos completados.
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white lg:max-w-xs">
                  <div
                    className="h-full rounded-full bg-[#2f6df6] transition-all"
                    style={{ width: `${(completedActivationSteps / activationSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {activationSteps.map(step => (
                  <Link
                    key={step.label}
                    href={step.href}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-bold transition ${
                      step.done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-[#cfe0ff] bg-white text-[#0c1324] hover:border-[#8bb7ff]'
                    }`}
                  >
                    {step.done ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0 text-[#8b96aa]" />}
                    <span>{step.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Citas hoy',
                value: todayBookings.length,
                sub: `${confirmedToday} confirmadas · ${pendingToday} pendientes`,
                icon: Calendar,
                color: 'bg-[#e5edff] text-[#2355c8]',
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
                color: pendingOrders > 0 ? 'bg-amber-50 text-amber-700' : 'bg-[#e5eaf2] text-[#647089]',
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
              {
                label: 'Oportunidades de vuelta',
                value: rebookingOpportunities.length,
                sub: 'Sin proxima cita activa',
                icon: Repeat2,
                color: rebookingOpportunities.length > 0 ? 'bg-blue-50 text-blue-700' : 'bg-[#e5eaf2] text-[#647089]',
                href: '/dashboard/recurrencia',
              },
            ].map(kpi => (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="group rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_20px_55px_rgba(12,19,36,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(12,19,36,0.1)]"
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div className="text-3xl font-black tracking-tight text-[#0c1324]">{kpi.value}</div>
                <div className="mt-1 text-sm font-bold text-[#0c1324]">{kpi.label}</div>
                <div className="mt-0.5 text-xs text-[#647089]">{kpi.sub}</div>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="overflow-hidden rounded-lg border border-[#d8dee9] bg-white shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
              <div className="flex items-center justify-between border-b border-[#e5eaf2] px-6 py-4">
                <div>
                  <h2 className="font-black text-[#0c1324]">Agenda de hoy</h2>
                  <p className="text-xs text-[#647089]">Vista rapida de citas y estados.</p>
                </div>
                <Link href="/dashboard/reservas" className="flex items-center gap-1.5 text-sm font-bold text-[#2355c8] hover:text-[#2f6df6]">
                  Ver todo <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {todayBookings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar className="mx-auto mb-3 h-10 w-10 text-[#8b96aa]" />
                  <p className="text-sm text-[#647089]">No hay citas programadas para hoy</p>
                  <Link href="/dashboard/reservas" className="mt-3 inline-flex text-sm font-bold text-[#2355c8] hover:text-[#2f6df6]">
                    Anadir cita manual
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#f0e8dc]">
                  {todayBookings.map(booking => (
                    <div key={booking.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[#f7f9fc]">
                      <div className="shrink-0 text-center">
                        <p className="text-sm font-black text-[#0c1324]">
                          {new Date(booking.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`h-10 w-1 shrink-0 rounded-full ${
                        booking.status === 'CONFIRMED' ? 'bg-[#9fc4aa]' :
                        booking.status === 'PENDING' ? 'bg-amber-400' : 'bg-[#8b96aa]'
                      }`} />
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5edff] text-sm font-black text-[#2355c8]">
                        {booking.customer.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[#0c1324]">{booking.customer.name}</p>
                        <p className="truncate text-sm text-[#647089]">
                          {booking.service.name}{booking.staff ? ` · ${booking.staff.name}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        booking.status === 'CONFIRMED' ? 'bg-[#eef4eb] text-[#4b7258]' :
                        booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-[#e5eaf2] text-[#647089]'
                      }`}>
                        {booking.status === 'CONFIRMED' ? 'Confirmada' : booking.status === 'PENDING' ? 'Pendiente' : booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
                <h3 className="mb-4 font-black text-[#0c1324]">Acciones rapidas</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Nueva reserva', href: '/dashboard/reservas', icon: Calendar, color: 'bg-[#e5edff] text-[#2355c8]' },
                    { label: 'Servicios', href: '/dashboard/servicios', icon: Zap, color: 'bg-[#eef4eb] text-[#4b7258]' },
                    { label: 'Clientes', href: '/dashboard/clientes', icon: Users, color: 'bg-[#e5eaf2] text-[#647089]' },
                    { label: 'Pedidos', href: '/dashboard/pedidos', icon: ShoppingCart, color: 'bg-amber-50 text-amber-700' },
                  ].map(action => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex flex-col items-center gap-2 rounded-md border border-[#e5eaf2] p-3 text-center transition-all hover:-translate-y-0.5 hover:border-[#d8dee9]"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${action.color}`}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold leading-tight text-[#647089]">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {bookingLink && (
                <div className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
                  <h3 className="mb-1 font-black text-[#0c1324]">Tu enlace de reserva</h3>
                  <p className="mb-3 text-xs text-[#647089]">Compartelo con tus clientes.</p>
                  <div className="flex items-center gap-2 rounded-md bg-[#f1f4f8] px-3 py-2.5">
                    <span className="flex-1 truncate font-mono text-xs text-[#647089]">{bookingLink}</span>
                    <button
                      className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#2355c8] transition-colors hover:text-[#2f6df6]"
                      title="Copiar"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </button>
                  </div>
                  <Link
                    href={`/centro/${center.slug}`}
                    target="_blank"
                    className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-[#647089] transition-colors hover:text-[#0c1324]"
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
