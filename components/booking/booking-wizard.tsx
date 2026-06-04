'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Loader2, Check, Users } from 'lucide-react'
import { createBookingAction } from '@/app/actions/booking'

// ─── Types ───────────────────────────────────────────────────────────────────

type ServiceData = {
  id: string
  name: string
  durationMinutes: number
  priceCents: number
  description: string | null
}

type StaffMember = {
  id: string
  name: string
  role: string | null
}

type SlotData = {
  time: string
  startAt: string
  endAt: string
  staffId: string
}

type Step = 1 | 2 | 3 | 4 | 5

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function getNextDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })
}

function getDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return {
    weekday: d.toLocaleDateString('es-ES', { weekday: 'short' }),
    day: d.toLocaleDateString('es-ES', { day: 'numeric' }),
    month: d.toLocaleDateString('es-ES', { month: 'short' }),
  }
}

function fmtDateLong(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

const STEP_NAMES = ['Servicio', 'Profesional', 'Fecha y hora', 'Tus datos', 'Confirmar']
const NEXT_DAYS = getNextDays(14)

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  centerId: string
  centerSlug: string
  centerName: string
  services: ServiceData[]
  preSelectedServiceId?: string
}

export function BookingWizard({ centerId, centerSlug, centerName, services, preSelectedServiceId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const initialService = preSelectedServiceId
    ? (services.find(s => s.id === preSelectedServiceId) ?? null)
    : null

  // Wizard state
  const [step, setStep] = useState<Step>(initialService ? 2 : 1)
  const [selectedService, setSelectedService] = useState<ServiceData | null>(initialService)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedStaffName, setSelectedStaffName] = useState('Sin preferencia')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null)

  // Customer data
  const [custName, setCustName] = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  // Async data
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [slots, setSlots] = useState<SlotData[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Load staff when entering step 2
  useEffect(() => {
    if (step !== 2 || !selectedService) return
    setLoadingStaff(true)
    setStaffList([])
    fetch(`/api/v1/staff?centerId=${centerId}&serviceId=${selectedService.id}`)
      .then(r => r.json())
      .then(d => setStaffList(d.staff ?? []))
      .catch(() => {})
      .finally(() => setLoadingStaff(false))
  }, [step, selectedService, centerId])

  // Load slots when date changes in step 3
  useEffect(() => {
    if (step !== 3 || !selectedDate || !selectedService) return
    setLoadingSlots(true)
    setSlots([])
    const p = new URLSearchParams({ centerId, serviceId: selectedService.id, date: selectedDate })
    if (selectedStaffId) p.set('staffId', selectedStaffId)
    fetch(`/api/v1/availability?${p}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .catch(() => {})
      .finally(() => setLoadingSlots(false))
  }, [step, selectedDate, selectedService, selectedStaffId, centerId])

  function goBack() {
    const prev = (step - 1) as Step
    if (prev < 3) { setSelectedDate(''); setSelectedSlot(null); setSlots([]) }
    if (prev < 2) { setSelectedStaffId(null); setSelectedStaffName('Sin preferencia') }
    setStep(prev)
  }

  function handleConfirm() {
    if (!selectedService || !selectedSlot) return
    setSubmitError(null)
    startTransition(async () => {
      const result = await createBookingAction({
        centerId,
        serviceId: selectedService.id,
        staffId: selectedSlot.staffId || null,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
        customerName: custName.trim(),
        customerEmail: custEmail.trim().toLowerCase(),
        customerPhone: custPhone.trim() || undefined,
        consentGiven: true,
        marketingConsent,
      })
      if (result.success) {
        router.push(`/reserva/confirmada/${result.confirmationCode}`)
      } else {
        setSubmitError(result.error)
        if (result.error.toLowerCase().includes('horario') || result.error.toLowerCase().includes('ocupado')) {
          setSelectedSlot(null)
          setSelectedDate('')
          setSlots([])
          setStep(3)
        }
      }
    })
  }

  const resolvedStaffName = selectedStaffId
    ? (staffList.find(s => s.id === selectedSlot?.staffId)?.name ?? selectedStaffName)
    : selectedSlot?.staffId
      ? (staffList.find(s => s.id === selectedSlot.staffId)?.name ?? 'Sin preferencia')
      : 'Sin preferencia'

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-xs text-slate-500">
          <span>Paso {step} de 5</span>
          <span className="font-semibold text-slate-700">{STEP_NAMES[step - 1]}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-1.5 rounded-full bg-rose-600 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Back */}
      {step === 1 ? (
        <Link
          href={`/centro/${centerSlug}`}
          className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al centro
        </Link>
      ) : (
        <button
          onClick={goBack}
          className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Atrás
        </button>
      )}

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        {/* ── Step 1: Service ───────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="mb-1 text-xl font-bold text-slate-900">¿Qué servicio quieres?</h2>
            <p className="mb-5 text-sm text-slate-500">{centerName}</p>
            <div className="space-y-2">
              {services.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep(2) }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-rose-300 hover:bg-rose-50"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{svc.name}</p>
                    {svc.description && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">{svc.description}</p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {fmtDuration(svc.durationMinutes)}
                    </p>
                  </div>
                  <span className="ml-4 shrink-0 font-bold text-slate-900">{fmtPrice(svc.priceCents)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Staff ─────────────────────────────────────────── */}
        {step === 2 && selectedService && (
          <div>
            <h2 className="mb-1 text-xl font-bold text-slate-900">¿Con quién quieres la cita?</h2>
            <p className="mb-5 text-sm text-slate-500">
              {selectedService.name} · {fmtDuration(selectedService.durationMinutes)}
            </p>
            {loadingStaff ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedStaffId(null)
                    setSelectedStaffName('Sin preferencia')
                    setStep(3)
                  }}
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-rose-300 hover:bg-rose-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <Users className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Sin preferencia</p>
                    <p className="text-xs text-slate-500">Primer profesional disponible</p>
                  </div>
                </button>
                {staffList.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStaffId(s.id)
                      setSelectedStaffName(s.name)
                      setStep(3)
                    }}
                    className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-rose-300 hover:bg-rose-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      {s.role && <p className="text-xs text-slate-500">{s.role}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Date + Slots ───────────────────────────────────── */}
        {step === 3 && selectedService && (
          <div>
            <h2 className="mb-1 text-xl font-bold text-slate-900">Elige fecha y hora</h2>
            <p className="mb-5 text-sm text-slate-500">
              {selectedService.name} · {selectedStaffName}
            </p>

            {/* Date picker */}
            <div className="-mx-1 mb-5 overflow-x-auto pb-1">
              <div className="flex gap-2 px-1" style={{ minWidth: 'max-content' }}>
                {NEXT_DAYS.map(d => {
                  const { weekday, day, month } = getDateLabel(d)
                  const active = selectedDate === d
                  return (
                    <button
                      key={d}
                      onClick={() => { setSelectedDate(d); setSelectedSlot(null) }}
                      className={`flex flex-col items-center rounded-xl border px-3.5 py-2.5 text-center transition-colors ${
                        active
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      <span className="text-xs font-medium capitalize">{weekday}</span>
                      <span className="text-lg font-bold leading-tight">{day}</span>
                      <span className="text-xs capitalize">{month}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Slots */}
            {!selectedDate && (
              <p className="py-6 text-center text-sm text-slate-400">Selecciona un día para ver la disponibilidad</p>
            )}
            {selectedDate && loadingSlots && (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios...
              </div>
            )}
            {selectedDate && !loadingSlots && slots.length === 0 && (
              <div className="rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-500">
                Sin disponibilidad para este día. Prueba con otra fecha.
              </div>
            )}
            {selectedDate && !loadingSlots && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map(slot => {
                  const active = selectedSlot?.time === slot.time && selectedSlot?.staffId === slot.staffId
                  return (
                    <button
                      key={`${slot.time}-${slot.staffId}`}
                      onClick={() => { setSelectedSlot(slot); setStep(4) }}
                      className={`rounded-xl border py-3 text-center text-sm font-semibold transition-colors ${
                        active
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50'
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

        {/* ── Step 4: Customer data ─────────────────────────────────── */}
        {step === 4 && selectedService && selectedSlot && (
          <div>
            <h2 className="mb-1 text-xl font-bold text-slate-900">Tus datos</h2>
            <p className="mb-5 text-sm text-slate-500">
              {selectedService.name} · {fmtDateLong(selectedDate)} · {selectedSlot.time}
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nombre *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  placeholder="Tu nombre completo"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email *</label>
                <input
                  type="email"
                  required
                  value={custEmail}
                  onChange={e => setCustEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Teléfono <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  placeholder="+34 600 000 000"
                  autoComplete="tel"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={e => setConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-rose-600"
                />
                <span className="text-sm text-slate-600">
                  Acepto la{' '}
                  <Link href="/legal/privacidad" className="text-rose-600 underline" target="_blank" rel="noreferrer">
                    política de privacidad
                  </Link>{' '}
                  y el tratamiento de mis datos para gestionar la reserva. *
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={e => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-rose-600"
                />
                <span className="text-sm text-slate-600">
                  Acepto recibir comunicaciones del centro sobre ofertas y promociones.{' '}
                  <span className="text-slate-400">(Opcional)</span>
                </span>
              </label>

              <button
                disabled={!custName.trim() || !custEmail.trim() || !consentGiven}
                onClick={() => setStep(5)}
                className="w-full rounded-xl bg-rose-600 py-3 font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Confirm ───────────────────────────────────────── */}
        {step === 5 && selectedService && selectedSlot && (
          <div>
            <h2 className="mb-5 text-xl font-bold text-slate-900">Confirma tu reserva</h2>

            <div className="mb-5 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50">
              {[
                { label: 'Centro', value: centerName },
                { label: 'Servicio', value: selectedService.name },
                { label: 'Profesional', value: resolvedStaffName },
                { label: 'Fecha', value: fmtDateLong(selectedDate) },
                { label: 'Hora', value: selectedSlot.time },
                { label: 'Duración', value: fmtDuration(selectedService.durationMinutes) },
              ].map(row => (
                <div key={row.label} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">{row.label}</span>
                  <span className="font-semibold text-slate-900">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-lg font-bold text-rose-600">{fmtPrice(selectedService.priceCents)}</span>
              </div>
            </div>

            <div className="mb-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold">{custName}</span>
              <span className="mx-2 text-slate-300">·</span>
              {custEmail}
              {custPhone && (
                <>
                  <span className="mx-2 text-slate-300">·</span>
                  {custPhone}
                </>
              )}
            </div>

            {submitError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-4 font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar reserva
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Cancelación gratuita hasta 24h antes. Recibirás confirmación por email.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
