import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { formatDate, formatTime } from '@/lib/utils'
import { updateBookingStatusAction } from '@/app/actions/dashboard'
import type { BookingStatus } from '@prisma/client'

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: 'Confirmada',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No presentado',
}

const STATUS_BADGE: Record<BookingStatus, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
  NO_SHOW: 'bg-orange-100 text-orange-700',
}

const VALID_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']

function isValidStatus(s: string): s is BookingStatus {
  return VALID_STATUSES.includes(s as BookingStatus)
}

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
  if (!center) redirect('/dashboard/configuracion')

  const params = await searchParams
  const estadoFilter = params.estado && isValidStatus(params.estado) ? params.estado : undefined

  const bookings = await prisma.booking.findMany({
    where: {
      centerId: center.id,
      ...(estadoFilter ? { status: estadoFilter } : {}),
    },
    include: {
      service: { select: { name: true } },
      staff: { select: { name: true } },
      customer: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { startAt: 'desc' },
    take: 50,
  })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservas</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona las citas de tu centro</p>
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href="/dashboard/reservas"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !estadoFilter
              ? 'bg-rose-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todas
        </a>
        {VALID_STATUSES.map((s) => (
          <a
            key={s}
            href={`/dashboard/reservas?estado=${s}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              estadoFilter === s
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {STATUS_LABELS[s]}
          </a>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-500">No hay reservas{estadoFilter ? ` con estado "${STATUS_LABELS[estadoFilter]}"` : ''}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Cliente</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Servicio</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Profesional</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Fecha y hora</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Estado</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{booking.customer.name}</p>
                      <p className="text-xs text-slate-500">{booking.customer.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{booking.service.name}</td>
                    <td className="px-6 py-4 text-slate-500">{booking.staff?.name ?? '—'}</td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{formatDate(booking.startAt, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-slate-500">{formatTime(booking.startAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[booking.status]}`}>
                        {STATUS_LABELS[booking.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <BookingActions bookingId={booking.id} status={booking.status} orgId={orgId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-slate-100">
            {bookings.map((booking) => (
              <div key={booking.id} className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{booking.customer.name}</p>
                    <p className="text-sm text-slate-500">{booking.service.name}{booking.staff ? ` · ${booking.staff.name}` : ''}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[booking.status]}`}>
                    {STATUS_LABELS[booking.status]}
                  </span>
                </div>
                <p className="mb-3 text-sm text-slate-600">
                  {formatDate(booking.startAt, { day: 'numeric', month: 'short' })} · {formatTime(booking.startAt)}
                </p>
                <BookingActions bookingId={booking.id} status={booking.status} orgId={orgId} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BookingActions({
  bookingId,
  status,
  orgId,
}: {
  bookingId: string
  status: BookingStatus
  orgId: string
}) {
  if (status === 'CANCELLED' || status === 'COMPLETED' || status === 'NO_SHOW') {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'PENDING' && (
        <form
          action={async () => {
            'use server'
            await updateBookingStatusAction(bookingId, 'CONFIRMED', orgId)
          }}
        >
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Confirmar
          </button>
        </form>
      )}
      {status === 'CONFIRMED' && (
        <>
          <form
            action={async () => {
              'use server'
              await updateBookingStatusAction(bookingId, 'COMPLETED', orgId)
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Completar
            </button>
          </form>
          <form
            action={async () => {
              'use server'
              await updateBookingStatusAction(bookingId, 'NO_SHOW', orgId)
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              No-show
            </button>
          </form>
        </>
      )}
      <form
        action={async () => {
          'use server'
          await updateBookingStatusAction(bookingId, 'CANCELLED', orgId)
        }}
      >
        <button
          type="submit"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
        >
          Cancelar
        </button>
      </form>
    </div>
  )
}
