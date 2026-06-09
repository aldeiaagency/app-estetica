import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { formatDate, formatTime } from '@/lib/utils'
import { updateBookingStatusAction } from '@/app/actions/dashboard'
import { BookingCalendar, type CalendarBooking } from '@/components/dashboard/booking-calendar'
import { StatusBadge } from '@/components/ui/badge'
import type { BookingStatus } from '@prisma/client'

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED:  'Confirmada',
  PENDING:    'Pendiente',
  CANCELLED:  'Cancelada',
  COMPLETED:  'Completada',
  NO_SHOW:    'No se presentó',
}

const VALID_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']
function isValidStatus(s: string): s is BookingStatus { return VALID_STATUSES.includes(s as BookingStatus) }

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; vista?: string }>
}) {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
  if (!center) redirect('/dashboard/configuracion')

  const { estado, vista } = await searchParams
  const estadoFilter = estado && isValidStatus(estado) ? estado : undefined
  const view = vista === 'lista' ? 'lista' : 'calendario'

  // Fetch bookings: last month + next 3 months for calendar
  const calStart = new Date(); calStart.setMonth(calStart.getMonth() - 1); calStart.setDate(1); calStart.setHours(0,0,0,0)
  const calEnd   = new Date(); calEnd.setMonth(calEnd.getMonth() + 3); calEnd.setDate(0); calEnd.setHours(23,59,59,999)

  const allBookings = await prisma.booking.findMany({
    where: {
      centerId: center.id,
      startAt: { gte: calStart, lte: calEnd },
    },
    include: {
      service:  { select: { name: true } },
      staff:    { select: { name: true } },
      customer: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { startAt: 'asc' },
  })

  // Serialize for client component
  const calendarBookings: CalendarBooking[] = allBookings.map(b => ({
    id:           b.id,
    startAt:      b.startAt.toISOString(),
    startTime:    b.startAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }),
    status:       b.status,
    customerName: b.customer.name,
    serviceName:  b.service.name,
    staffName:    b.staff?.name ?? null,
  }))

  // List view: filter + sort desc
  const listBookings = estadoFilter
    ? allBookings.filter(b => b.status === estadoFilter).sort((a,b) => b.startAt.getTime() - a.startAt.getTime())
    : allBookings.slice().sort((a,b) => b.startAt.getTime() - a.startAt.getTime())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reservas</h1>
          <p className="mt-1 text-sm text-zinc-500">Gestiona las citas de tu centro</p>
        </div>
      </div>

      {/* View toggle + status filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1">
          <a
            href="/dashboard/reservas"
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              view === 'calendario'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Calendario
          </a>
          <a
            href="/dashboard/reservas?vista=lista"
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              view === 'lista'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Lista
          </a>
        </div>

        {view === 'lista' && (
          <div className="flex flex-wrap gap-2">
            <a
              href="/dashboard/reservas?vista=lista"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                !estadoFilter ? 'bg-primary-600 text-white shadow-sm' : 'border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
              }`}
            >
              Todas
            </a>
            {VALID_STATUSES.map((s) => (
              <a
                key={s}
                href={`/dashboard/reservas?vista=lista&estado=${s}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  estadoFilter === s ? 'bg-primary-600 text-white shadow-sm' : 'border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                }`}
              >
                {STATUS_LABELS[s]}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Calendar view */}
      {view === 'calendario' && (
        <BookingCalendar bookings={calendarBookings} />
      )}

      {/* List view */}
      {view === 'lista' && (
        <>
          {listBookings.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
              <p className="text-sm text-zinc-400">
                No hay reservas{estadoFilter ? ` con estado "${STATUS_LABELS[estadoFilter]}"` : ''}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {['Cliente', 'Servicio', 'Profesional', 'Fecha y hora', 'Estado', ''].map((h) => (
                        <th key={h} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider text-zinc-400 ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {listBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">
                              {booking.customer.name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900">{booking.customer.name}</p>
                              <p className="text-xs text-zinc-400">{booking.customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-700">{booking.service.name}</td>
                        <td className="px-6 py-4 text-zinc-500">{booking.staff?.name ?? '—'}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-zinc-900">
                            {formatDate(booking.startAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-zinc-400">{formatTime(booking.startAt)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <BookingActions bookingId={booking.id} status={booking.status} orgId={orgId} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-zinc-100">
                {listBookings.map((booking) => (
                  <div key={booking.id} className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-zinc-900">{booking.customer.name}</p>
                        <p className="text-sm text-zinc-500">{booking.service.name}{booking.staff ? ` · ${booking.staff.name}` : ''}</p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="mb-3 text-sm text-zinc-500">
                      {formatDate(booking.startAt, { day: 'numeric', month: 'short' })} · {formatTime(booking.startAt)}
                    </p>
                    <BookingActions bookingId={booking.id} status={booking.status} orgId={orgId} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BookingActions({ bookingId, status, orgId }: { bookingId: string; status: BookingStatus; orgId: string }) {
  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(status)) return null

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'PENDING' && (
        <form action={async () => { 'use server'; await updateBookingStatusAction(bookingId, 'CONFIRMED', orgId) }}>
          <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
            Confirmar
          </button>
        </form>
      )}
      {status === 'CONFIRMED' && (
        <>
          <form action={async () => { 'use server'; await updateBookingStatusAction(bookingId, 'COMPLETED', orgId) }}>
            <button type="submit" className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors">
              Completar
            </button>
          </form>
          <form action={async () => { 'use server'; await updateBookingStatusAction(bookingId, 'NO_SHOW', orgId) }}>
            <button type="submit" className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors">
              No-show
            </button>
          </form>
        </>
      )}
      <form action={async () => { 'use server'; await updateBookingStatusAction(bookingId, 'CANCELLED', orgId) }}>
        <button type="submit" className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
          Cancelar
        </button>
      </form>
    </div>
  )
}
