'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Calendar, Clock, MapPin, CalendarDays, ArrowLeft } from 'lucide-react'
import { cancelBookingAction, rescheduleBookingAction } from '@/app/actions/booking'

interface SlotData {
  time: string
  startAt: string
  endAt: string
  staffId: string
}

interface BookingInfo {
  id: string
  confirmationCode: string
  status: string
  startAt: string
  endAt: string
  centerId: string
  serviceId: string
  staffId: string | null
  service: { name: string; durationMinutes: number; priceCents: number }
  staff: { name: string; role: string | null } | null
  center: { name: string; slug: string; addressCity: string }
  customer: { name: string; email: string }
  canCancel: boolean
  cancelMessage?: string
}

type Phase = 'form' | 'loading' | 'found' | 'not-found' | 'cancelled' | 'rescheduled'
type SubPhase = 'idle' | 'pick-date' | 'confirm-reschedule'

function getNextDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1) // start from tomorrow
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
}

function getDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return {
    weekday: d.toLocaleDateString('es-ES', { weekday: 'short' }),
    day:     d.toLocaleDateString('es-ES', { day: 'numeric' }),
    month:   d.toLocaleDateString('es-ES', { month: 'short' }),
  }
}

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

const NEXT_DAYS = getNextDays(14)

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

export default function GestionarPage() {
  const [phase, setPhase]       = useState<Phase>('form')
  const [subPhase, setSubPhase] = useState<SubPhase>('idle')
  const [code, setCode]         = useState('')
  const [email, setEmail]       = useState('')
  const [booking, setBooking]   = useState<BookingInfo | null>(null)

  // Cancel state
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError]   = useState('')
  const [isCancelling, startCancelTransition] = useTransition()

  // Reschedule state
  const [rescheduleDate, setRescheduleDate]     = useState('')
  const [rescheduleSlots, setRescheduleSlots]   = useState<SlotData[]>([])
  const [loadingSlots, setLoadingSlots]         = useState(false)
  const [selectedSlot, setSelectedSlot]         = useState<SlotData | null>(null)
  const [rescheduleError, setRescheduleError]   = useState('')
  const [isRescheduling, startRescheduleTransition] = useTransition()

  // Load slots when reschedule date changes
  useEffect(() => {
    if (!booking || !rescheduleDate) return
    setLoadingSlots(true)
    setRescheduleSlots([])
    setSelectedSlot(null)
    const p = new URLSearchParams({
      centerId:  booking.centerId,
      serviceId: booking.serviceId,
      date:      rescheduleDate,
      ...(booking.staffId ? { staffId: booking.staffId } : {}),
    })
    fetch(`/api/v1/availability?${p}`)
      .then(r => r.json())
      .then(d => setRescheduleSlots(d.slots ?? []))
      .catch(() => {})
      .finally(() => setLoadingSlots(false))
  }, [rescheduleDate, booking])

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const trimCode  = code.trim().toUpperCase()
    const trimEmail = email.trim().toLowerCase()
    if (!trimCode || !trimEmail) return
    setPhase('loading')
    try {
      const res = await fetch(`/api/v1/booking?code=${trimCode}&email=${encodeURIComponent(trimEmail)}`)
      if (res.status === 404) { setPhase('not-found'); return }
      if (!res.ok)            { setPhase('form'); return }
      setBooking(await res.json())
      setPhase('found')
    } catch {
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

  function handleRescheduleConfirm() {
    if (!booking || !selectedSlot) return
    setRescheduleError('')
    startRescheduleTransition(async () => {
      const result = await rescheduleBookingAction({
        confirmationCode: booking.confirmationCode,
        customerEmail:    booking.customer.email,
        newStartAt:       selectedSlot.startAt,
        newEndAt:         selectedSlot.endAt,
      })
      if (result.success) {
        setPhase('rescheduled')
      } else {
        setRescheduleError(result.error ?? 'Error al modificar. Inténtalo de nuevo.')
        if (result.error?.includes('ocupado')) {
          setSelectedSlot(null)
          setSubPhase('pick-date')
        }
      }
    })
  }

  function resetReschedule() {
    setSubPhase('idle')
    setRescheduleDate('')
    setRescheduleSlots([])
    setSelectedSlot(null)
    setRescheduleError('')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-3.5">
        <div className="mx-auto flex max-w-[600px] items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5 font-black text-zinc-900">
            <Sparkles className="h-4 w-4 text-primary-600" />
            BellezaLocal
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[600px] px-4 py-10">
        <h1 className="mb-2 text-2xl font-black text-zinc-900">Gestionar reserva</h1>
        <p className="mb-8 text-sm text-zinc-500">
          Consulta, modifica o cancela tu cita.
        </p>

        {/* ── Lookup form ─────────────────────────────────────────── */}
        {(phase === 'form' || phase === 'loading') && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
                  Código de confirmación
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: AB12CD34"
                  maxLength={8}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 font-mono text-sm uppercase tracking-wider outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
                <p className="mt-1 text-xs text-zinc-400">Está en el email de confirmación</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
                  Email con el que reservaste
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={phase === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
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
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
            <h2 className="mb-2 font-bold text-zinc-900">No encontramos tu reserva</h2>
            <p className="mb-5 text-sm text-zinc-500">
              Comprueba el código de confirmación y el email que usaste al reservar.
            </p>
            <button
              onClick={() => setPhase('form')}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* ── Found ─────────────────────────────────────────────────── */}
        {phase === 'found' && booking && (
          <div className="space-y-4">
            {/* Booking card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-zinc-900">Tu cita</h2>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[booking.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                    {statusLabel[booking.status] ?? booking.status}
                  </span>
                  <span className="rounded-lg bg-zinc-100 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-zinc-600">
                    {booking.confirmationCode}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <p className="font-semibold text-zinc-900">{booking.center.name}</p>
                    <p className="text-sm text-zinc-500">{booking.center.addressCity}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <p className="font-semibold capitalize text-zinc-900">{fmtDate(booking.startAt)}</p>
                    <p className="text-sm text-zinc-500">{fmtTime(booking.startAt)} – {fmtTime(booking.endAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <p className="font-semibold text-zinc-900">{booking.service.name}</p>
                    <p className="text-sm text-zinc-500">
                      {fmtDuration(booking.service.durationMinutes)} · {fmtPrice(booking.service.priceCents)}
                      {booking.staff && ` · ${booking.staff.name}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Reschedule: pick date + slot ──────────────────────── */}
            {booking.canCancel && subPhase === 'pick-date' && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <button onClick={resetReschedule} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h3 className="font-semibold text-zinc-900">Elige nueva fecha y hora</h3>
                </div>

                {/* Date strip */}
                <div className="-mx-1 mb-5 overflow-x-auto pb-1">
                  <div className="flex gap-2 px-1" style={{ minWidth: 'max-content' }}>
                    {NEXT_DAYS.map(d => {
                      const { weekday, day, month } = getDateLabel(d)
                      const active = rescheduleDate === d
                      return (
                        <button
                          key={d}
                          onClick={() => setRescheduleDate(d)}
                          className={`flex flex-col items-center rounded-2xl border px-3.5 py-2.5 text-center transition-all ${
                            active
                              ? 'border-primary-600 bg-primary-600 text-white shadow-md shadow-primary-500/20'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          <span className={`text-xs font-medium capitalize ${active ? 'text-primary-100' : 'text-zinc-400'}`}>{weekday}</span>
                          <span className="text-lg font-black leading-tight">{day}</span>
                          <span className={`text-[10px] capitalize ${active ? 'text-primary-200' : 'text-zinc-400'}`}>{month}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Slots */}
                {!rescheduleDate && (
                  <div className="rounded-2xl border border-dashed border-zinc-200 py-8 text-center">
                    <CalendarDays className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                    <p className="text-sm text-zinc-400">Selecciona un día para ver disponibilidad</p>
                  </div>
                )}
                {rescheduleDate && loadingSlots && (
                  <div className="flex items-center justify-center gap-2 py-8 text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios...
                  </div>
                )}
                {rescheduleDate && !loadingSlots && rescheduleSlots.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-zinc-200 py-8 text-center">
                    <p className="text-sm text-zinc-400">Sin disponibilidad para este día. Prueba con otra fecha.</p>
                  </div>
                )}
                {rescheduleDate && !loadingSlots && rescheduleSlots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {rescheduleSlots.map(slot => {
                      const active = selectedSlot?.time === slot.time
                      return (
                        <button
                          key={slot.time}
                          onClick={() => { setSelectedSlot(slot); setSubPhase('confirm-reschedule') }}
                          className={`rounded-2xl border py-3 text-center text-sm font-semibold transition-all ${
                            active
                              ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          {slot.time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Reschedule: confirm ───────────────────────────────── */}
            {booking.canCancel && subPhase === 'confirm-reschedule' && selectedSlot && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <button onClick={() => setSubPhase('pick-date')} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h3 className="font-semibold text-zinc-900">Confirmar cambio de fecha</h3>
                </div>

                <div className="mb-5 overflow-hidden rounded-2xl border border-zinc-200 text-sm">
                  <div className="flex justify-between px-5 py-3.5">
                    <span className="text-zinc-500">Antes</span>
                    <span className="font-semibold text-zinc-500 line-through">
                      {fmtDate(booking.startAt)} · {fmtTime(booking.startAt)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 bg-primary-50 px-5 py-3.5">
                    <span className="text-zinc-700">Ahora</span>
                    <span className="font-bold text-primary-700">
                      {fmtDate(selectedSlot.startAt)} · {selectedSlot.time}
                    </span>
                  </div>
                </div>

                {rescheduleError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {rescheduleError}
                  </div>
                )}

                <button
                  onClick={handleRescheduleConfirm}
                  disabled={isRescheduling}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                >
                  {isRescheduling ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Guardando cambio...</>
                  ) : (
                    'Confirmar nuevo horario'
                  )}
                </button>
                <p className="mt-2 text-center text-xs text-zinc-400">
                  Cancelación gratuita hasta 24h antes de la nueva cita.
                </p>
              </div>
            )}

            {/* ── Actions: cancel + reschedule buttons ─────────────── */}
            {booking.canCancel && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && subPhase === 'idle' && (
              <>
                {/* Reschedule button */}
                <button
                  onClick={() => setSubPhase('pick-date')}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 py-4 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                >
                  <CalendarDays className="h-4 w-4" /> Cambiar fecha y hora
                </button>

                {/* Cancel form */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-3 font-semibold text-zinc-900">Cancelar esta cita</h3>
                  <div className="mb-3">
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                      Motivo <span className="font-normal text-zinc-400">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder="Cambio de planes, enfermedad..."
                      className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
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
                  <p className="mt-2 text-center text-xs text-zinc-400">
                    La cancelación es gratuita hasta 24h antes de la cita.
                  </p>
                </div>
              </>
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
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
            <h2 className="mb-2 font-bold text-zinc-900">Reserva cancelada</h2>
            <p className="mb-6 text-sm text-zinc-500">Tu cita ha sido cancelada correctamente.</p>
            <Link href="/buscar" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              Buscar otro centro →
            </Link>
          </div>
        )}

        {/* ── Rescheduled ───────────────────────────────────────────── */}
        {phase === 'rescheduled' && selectedSlot && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
            <h2 className="mb-2 font-bold text-zinc-900">¡Cita reprogramada!</h2>
            <p className="mb-1 text-sm text-zinc-600">
              Tu nueva cita es el {fmtDate(selectedSlot.startAt)} a las {selectedSlot.time}.
            </p>
            <p className="mb-6 text-xs text-zinc-400">Recibirás un email con los nuevos datos.</p>
            <Link href="/buscar" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              Volver al inicio →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
