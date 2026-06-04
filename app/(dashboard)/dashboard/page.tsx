import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import Link from 'next/link'
import { Calendar, Users, TrendingUp, AlertCircle, Plus, ExternalLink, Copy } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId

  // Cargar centro del negocio
  const center = orgId
    ? await prisma.center.findFirst({
        where: { organizationId: orgId },
        include: {
          _count: { select: { bookings: true, services: true, customers: true } },
        },
      })
    : null

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const todayBookings = center
    ? await prisma.booking.findMany({
        where: {
          centerId: center.id,
          startAt: { gte: todayStart, lte: todayEnd },
        },
        include: { service: true, staff: true, customer: true },
        orderBy: { startAt: 'asc' },
      })
    : []

  const bookingLink = center ? `${process.env.NEXT_PUBLIC_APP_URL}/centro/${center.slug}` : null

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hola, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          href="/dashboard/reservas/nueva"
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva reserva
        </Link>
      </div>

      {/* Sin centro — onboarding */}
      {!center && (
        <div className="mb-8 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
            <AlertCircle className="h-7 w-7 text-rose-500" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-slate-900">Configura tu centro</h2>
          <p className="mb-6 text-sm text-slate-500">Aún no tienes ningún centro configurado. Créalo en menos de 5 minutos.</p>
          <Link
            href="/dashboard/configuracion"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" />
            Crear mi centro
          </Link>
        </div>
      )}

      {/* KPIs */}
      {center && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Citas hoy', value: todayBookings.length, icon: Calendar, color: 'bg-blue-50 text-blue-600' },
              { label: 'Servicios activos', value: center._count.services, icon: TrendingUp, color: 'bg-rose-50 text-rose-600' },
              { label: 'Clientes totales', value: center._count.customers, icon: Users, color: 'bg-green-50 text-green-600' },
              { label: 'Reservas totales', value: center._count.bookings, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
                <div className="mt-1 text-sm text-slate-500">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Citas de hoy */}
          <div className="mb-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-900">Citas de hoy</h2>
              <Link href="/dashboard/agenda" className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700">
                Ver agenda <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {todayBookings.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-400">
                No hay citas programadas para hoy
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {todayBookings.map((b) => (
                  <div key={b.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                      {b.customer.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{b.customer.name}</p>
                      <p className="text-sm text-slate-500 truncate">{b.service.name}{b.staff ? ` · ${b.staff.name}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(b.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className={`text-xs font-medium ${
                        b.status === 'CONFIRMED' ? 'text-green-600' :
                        b.status === 'PENDING' ? 'text-yellow-600' : 'text-slate-400'
                      }`}>
                        {b.status === 'CONFIRMED' ? 'Confirmada' : b.status === 'PENDING' ? 'Pendiente' : b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enlace de reserva */}
          {bookingLink && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-1 font-bold text-slate-900">Tu enlace de reserva</h2>
              <p className="mb-4 text-sm text-slate-500">Compártelo con tus clientes para que reserven directamente.</p>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex-1 truncate font-mono text-sm text-slate-600">{bookingLink}</span>
                <button className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700">
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
