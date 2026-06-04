'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Calendar, Clock, MapPin } from 'lucide-react'
import { cancelBookingAction } from '@/app/actions/booking'

interface BookingInfo {
  id: string
  confirmationCode: string
  status: string
  startAt: string
  endAt: string
  service: { name: string; durationMinutes: number; priceCents: number }
  staff: { name: string; role: string | null } | null
  center: { name: string; slug: string; addressCity: string }
  customer: { name: string; email: string }
  canCancel: boolean
  cancelMessage?: string
}

type Phase = 'form' | 'loading' | 'found' | 'not-found' | 'cancelled' | 'error'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function fmtPrice(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default function GestionarPage() {
  const [phase, setPhase] = useState<Phase>('form')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [isCancelling, startCancelTransition] = useTransition()

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const trimCode = code.trim().toUpperCase()
    const trimEmail = email.trim().toLowerCase()
    if (!trimCode || !trimEmail) return

    setPhase('loading')
    setLookupError('')

    try {
      const res = await fetch(`/api/v1/booking?code=${trimCode}&email=${encodeURIComponent(trimEmail)}`)
      if (res.status === 404) {
        setPhase('not-found')
        return
      }
      if (!res.ok) {
        setLookupError('Error al buscar la reserva. Inténtalo de nuevo.')
        setPhase('form')
        return
      }
      const data = await res.json()
      setBooking(data)
      setPhase('found')
    } catch {
      setLookupError('Error de conexión. Inténtalo de nuevo.')
      setPhase('form')
    }
  }

  function handleCancel() {
    if (!booking) return
    setCancelError('')
    startCancelTransition(async () => {
      const result = await cancelBookingAction(booking.confirmationCode, booking.customer.email, cancelReason || undefined)
      if (result.success) {
        setPhase('cancelled')
      } else {
        setCancelError(result.error ?? 'No se pudo cancelar. Inténtalo de nuevo.')
      }
    })
  }

  const statusLabel: Record<string, string> = {
    CONFIRMED: 'Confirmada',
    PENDING: 'Pendiente',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada',
    NO_SHOW: 'No presentado',
  }

  const statusColor: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-slate-100 text-slate-600',
    NO_SHOW: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[600px] items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-slate-900">
            <Sparkles className="h-4 w-4 text-rose-600" />
            BellezaLocal
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[600px] px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Gestionar reserva</h1>
        <p className="mb-8 text-sm text-slate-500">
          Consulta el estado de tu cita o cancélala si lo necesitas.
        </p>

        {/* ── Lookup form ─────────────────────────────────────────── */}
        {(phase === 'form' || phase === 'loading') && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Código de confirmación
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: AB12CD34"
                  maxLength={8}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm uppercase tracking-wider outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
                <p className="mt-1 text-xs text-slate-400">Está en el email de confirmación</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email con el que reservaste
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>
              {lookupError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{lookupError}</p>
              )}
              <button
                type="submit"
                disabled={phase === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
              >
                {phase === 'loading' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Buscando...</>
                ) : (
                  'Buscar reserva'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Not found ─────────────────────────────────────────────── */}
        {phase === 'not-found' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h2 className="mb-2 font-bold text-slate-900">No encontramos tu reserva</h2>
            <p className="mb-5 text-sm text-slate-500">
              Comprueba el código de confirmación y el email que usaste al reservar.
            </p>
            <button
              onClick={() => setPhase('form')}
              className="text-sm font-semibold text-rose-600 hover:text-rose-700"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* ── Found ─────────────────────────────────────────────────── */}
        {phase === 'found' && booking && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Tu cita</h2>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[booking.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {statusLabel[booking.status] ?? booking.status}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-slate-600">
                    {booking.confirmationCode}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-900">{booking.center.name}</p>
                    <p className="text-sm text-slate-500">{booking.center.addressCity}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-semibold capitalize text-slate-900">{fmtDate(booking.startAt)}</p>
                    <p className="text-sm text-slate-500">{fmtTime(booking.startAt)} – {fmtTime(booking.endAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-900">{booking.service.name}</p>
                    <p className="text-sm text-slate-500">
                      {fmtDuration(booking.service.durationMinutes)} · {fmtPrice(booking.service.priceCents)}
                      {booking.staff && ` · ${booking.staff.name}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancel form */}
            {booking.canCancel && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-slate-900">Cancelar esta cita</h3>
                <div className="mb-3">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Motivo <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="Cambio de planes, enfermedad..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
                {cancelError && (
                  <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{cancelError}</p>
                )}
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                >
                  {isCancelling ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Cancelando...</>
                  ) : (
                    'Cancelar esta reserva'
                  )}
                </button>
                <p className="mt-2 text-center text-xs text-slate-400">
                  La cancelación es gratuita hasta 24h antes de la cita.
                </p>
              </div>
            )}

            {!booking.canCancel && booking.cancelMessage && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                {booking.cancelMessage}
              </div>
            )}
          </div>
        )}

        {/* ── Cancelled ─────────────────────────────────────────────── */}
        {phase === 'cancelled' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
            <h2 className="mb-2 font-bold text-slate-900">Reserva cancelada</h2>
            <p className="mb-6 text-sm text-slate-500">
              Tu cita ha sido cancelada correctamente.
            </p>
            <Link href="/buscar" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
              Buscar otro centro →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
