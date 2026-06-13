'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Loader2, Check, Users, Sparkles,
  ChevronRight, CalendarDays, BadgeCheck,
} from 'lucide-react'
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

function fmtDateLong(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

const STEP_NAMES = ['Servicio', 'Profesional', 'Fecha y hora', 'Tus datos', 'Confirmar']
const NEXT_DAYS  = getNextDays(14)

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
  const { data: session, status: sessionStatus } = useSession()

  const isAuthenticated = sessionStatus === 'authenticated'

  const initialService = preSelectedServiceId
    ? (services.find(s => s.id === preSelectedServiceId) ?? null)
    : null

  // Wizard state
  const [step, setStep]                       = useState<Step>(initialService ? 2 : 1)
  const [selectedService, setSelectedService] = useState<ServiceData | null>(initialService)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedStaffName, setSelectedStaffName] = useState('Sin preferencia')
  const [selectedDate, setSelectedDate]       = useState('')
  const [selectedSlot, setSelectedSlot]       = useState<SlotData | null>(null)

  // Customer data — pre-filled from session if available
  const [custName,         setCustName]         = useState('')
  const [custEmail,        setCustEmail]        = useState('')
  const [custPhone,        setCustPhone]        = useState('')
  const [consentGiven,     setConsentGiven]     = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  // Async data
  const [staffList,     setStaffList]     = useState<StaffMember[]>([])
  const [loadingStaff,  setLoadingStaff]  = useState(false)
  const [slots,         setSlots]         = useState<SlotData[]>([])
  const [loadingSlots,  setLoadingSlots]  = useState(false)
  const [submitError,   setSubmitError]   = useState<string | null>(null)

  // Pre-fill from session — functional updater form avoids reading state in effect
  useEffect(() => {
    if (!session?.user) return
    if (session.user.name)  setCustName(n => n || session.user!.name!)
    if (session.user.email) setCustEmail(e => e || session.user!.email!)
  }, [session])

  // Load staff on step 2
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

  // Load slots on date change in step 3
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
        serviceId:       selectedService.id,
        staffId:         selectedSlot.staffId || null,
        startAt:         selectedSlot.startAt,
        endAt:           selectedSlot.endAt,
        customerName:    custName.trim(),
        customerEmail:   custEmail.trim().toLowerCase(),
        customerPhone:   custPhone.trim() || undefined,
        consentGiven:    true,
        marketingConsent,
      })
      if (result.success) {
        router.push(`/reserva/confirmada/${result.confirmationCode}`)
      } else {
        setSubmitError(result.error)
        if (result.error?.toLowerCase().includes('horario') || result.error?.toLowerCase().includes('ocupado')) {
          setSelectedSlot(null)
          setSelectedDate('')
          setSlots([])
          setStep(3)
        }
      }
    })
  }

  // ── Progress bar ──────────────────────────────────────────────────────────
  const progressBar = (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          {STEP_NAMES.map((name, i) => (
            <div
              key={name}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 <= step ? 'bg-primary-600' : 'bg-zinc-200'
              }`}
              style={{ width: i + 1 === step ? 32 : 16 }}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-zinc-500">{STEP_NAMES[step - 1]}</span>
      </div>
    </div>
  )

  // ── Back button ───────────────────────────────────────────────────────────
  const backBtn = step === 1 ? (
    <Link
      href={`/centro/${centerSlug}`}
      className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Volver al centro
    </Link>
  ) : (
    <button
      onClick={goBack}
      className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Atrás
    </button>
  )

  return (
    <div>
      {progressBar}
      {backBtn}

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">

        {/* ── Step 1: Service ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="p-6">
            <h2 className="mb-1 text-xl font-black tracking-tight text-zinc-900">¿Qué servicio quieres?</h2>
            <p className="mb-5 text-sm text-zinc-400">{centerName}</p>
            <div className="space-y-2">
              {services.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep(2) }}
                  className="group flex w-full items-center justify-between rounded-2xl border border-zinc-200 p-4 text-left transition-all hover:border-primary-300 hover:bg-primary-50/50 active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900">{svc.name}</p>
                    {svc.description && (
                      <p className="mt-0.5 truncate text-xs text-zinc-400">{svc.description}</p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="h-3 w-3" />{fmtDuration(svc.durationMinutes)}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-2">
                    <span className="font-bold text-zinc-900">{fmtPrice(svc.priceCents)}</span>
                    <ChevronRight className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-primary-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Staff ────────────────────────────────────────────── */}
        {step === 2 && selectedService && (
          <div className="p-6">
            <h2 className="mb-1 text-xl font-black tracking-tight text-zinc-900">¿Con quién quieres la cita?</h2>
            <p className="mb-5 text-sm text-zinc-400">
              {selectedService.name} · {fmtDuration(selectedService.durationMinutes)}
            </p>
            {loadingStaff ? (
              <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando profesionales...
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => { setSelectedStaffId(null); setSelectedStaffName('Sin preferencia'); setStep(3) }}
                  className="flex w-full items-center gap-4 rounded-2xl border border-zinc-200 p-4 text-left transition-all hover:border-primary-300 hover:bg-primary-50/50 active:scale-[0.99]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                    <Users className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">Sin preferencia</p>
                    <p className="text-xs text-zinc-400">Primer profesional disponible</p>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-zinc-300" />
                </button>
                {staffList.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStaffId(s.id); setSelectedStaffName(s.name); setStep(3) }}
                    className="flex w-full items-center gap-4 rounded-2xl border border-zinc-200 p-4 text-left transition-all hover:border-primary-300 hover:bg-primary-50/50 active:scale-[0.99]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{s.name}</p>
                      {s.role && <p className="text-xs text-zinc-400">{s.role}</p>}
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-zinc-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Date + Slots ──────────────────────────────────────── */}
        {step === 3 && selectedService && (
          <div className="p-6">
            <h2 className="mb-1 text-xl font-black tracking-tight text-zinc-900">Elige fecha y hora</h2>
            <p className="mb-5 text-sm text-zinc-400">
              {selectedService.name} · {selectedStaffName}
            </p>

            {/* Date strip */}
            <div className="-mx-1 mb-5 overflow-x-auto pb-1">
              <div className="flex gap-2 px-1" style={{ minWidth: 'max-content' }}>
                {NEXT_DAYS.map(d => {
                  const { weekday, day, month } = getDateLabel(d)
                  const active = selectedDate === d
                  return (
                    <button
                      key={d}
                      onClick={() => { setSelectedDate(d); setSelectedSlot(null) }}
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
            {!selectedDate && (
              <div className="rounded-2xl border border-dashed border-zinc-200 py-8 text-center">
                <CalendarDays className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                <p className="text-sm text-zinc-400">Selecciona un día para ver disponibilidad</p>
              </div>
            )}
            {selectedDate && loadingSlots && (
              <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios...
              </div>
            )}
            {selectedDate && !loadingSlots && slots.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-200 py-8 text-center">
                <p className="text-sm text-zinc-400">Sin disponibilidad para este día. Prueba con otra fecha.</p>
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

        {/* ── Step 4: Customer data ─────────────────────────────────────── */}
        {step === 4 && selectedService && selectedSlot && (
          <div className="p-6">
            <h2 className="mb-1 text-xl font-black tracking-tight text-zinc-900">Tus datos</h2>
            <p className="mb-5 text-sm text-zinc-400">
              {selectedService.name} · {fmtDateLong(selectedDate)} · {selectedSlot.time}
            </p>

            {/* Logged-in user card */}
            {isAuthenticated && session?.user && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white">
                  {(session.user.name ?? 'U')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 truncate">{session.user.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700">
                  <BadgeCheck className="h-3 w-3" />Identificado
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">Nombre completo <span className="text-beauty-500">*</span></label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  className="input-base"
                  placeholder="Tu nombre completo"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="label">Email <span className="text-beauty-500">*</span></label>
                <input
                  type="email"
                  required
                  value={custEmail}
                  onChange={e => setCustEmail(e.target.value)}
                  className="input-base"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  readOnly={isAuthenticated}
                />
                {isAuthenticated && (
                  <p className="mt-1 text-[11px] text-zinc-400">Email de tu cuenta — recibirás la confirmación aquí</p>
                )}
              </div>
              <div>
                <label className="label">
                  Teléfono <span className="text-zinc-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  className="input-base"
                  placeholder="+34 600 000 000"
                  autoComplete="tel"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100 transition-colors">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={e => setConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary-600"
                />
                <span className="text-sm text-zinc-600">
                  Acepto la{' '}
                  <Link href="/privacidad" className="text-primary-600 underline hover:text-primary-700" target="_blank" rel="noreferrer">
                    política de privacidad
                  </Link>{' '}
                  y el tratamiento de mis datos para gestionar la reserva. *
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100 transition-colors">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={e => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary-600"
                />
                <span className="text-sm text-zinc-600">
                  Acepto recibir comunicaciones del centro sobre ofertas y novedades.{' '}
                  <span className="text-zinc-400">(Opcional)</span>
                </span>
              </label>

              <button
                disabled={!custName.trim() || !custEmail.trim() || !consentGiven}
                onClick={() => setStep(5)}
                className="btn-primary w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar a la confirmación
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Confirm ───────────────────────────────────────────── */}
        {step === 5 && selectedService && selectedSlot && (
          <div className="p-6">
            <h2 className="mb-5 text-xl font-black tracking-tight text-zinc-900">Confirma tu reserva</h2>

            <div className="mb-5 overflow-hidden rounded-2xl border border-zinc-200">
              {[
                { label: 'Centro',      value: centerName },
                { label: 'Servicio',    value: selectedService.name },
                { label: 'Profesional', value: selectedStaffName },
                { label: 'Fecha',       value: fmtDateLong(selectedDate) },
                { label: 'Hora',        value: selectedSlot.time },
                { label: 'Duración',    value: fmtDuration(selectedService.durationMinutes) },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={`flex justify-between px-5 py-3.5 text-sm ${i > 0 ? 'border-t border-zinc-100' : ''}`}
                >
                  <span className="text-zinc-500">{row.label}</span>
                  <span className="font-semibold text-zinc-900">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-zinc-200 bg-zinc-50 px-5 py-4">
                <span className="font-bold text-zinc-900">Total</span>
                <span className="text-lg font-black text-primary-600">{fmtPrice(selectedService.priceCents)}</span>
              </div>
            </div>

            {/* Customer summary */}
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                {custName[0]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 truncate">{custName}</p>
                <p className="text-xs text-zinc-400 truncate">{custEmail}{custPhone ? ` · ${custPhone}` : ''}</p>
              </div>
            </div>

            {submitError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="btn-primary w-full justify-center py-4 text-base disabled:opacity-60"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Confirmando...</>
              ) : (
                <><Check className="h-4 w-4" /> Confirmar reserva</>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-zinc-400">
              Cancelación gratuita hasta 24h antes · Confirmación por email
            </p>

            {/* Post-booking: create account CTA for guests */}
            {!isAuthenticated && (
              <div className="mt-5 rounded-2xl border border-primary-100 bg-primary-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary-500" />
                  <p className="text-sm font-semibold text-zinc-900">¿Primera vez aquí?</p>
                </div>
                <p className="text-xs text-zinc-500 mb-3">
                  Crea una cuenta gratis para ver y gestionar todas tus reservas en un solo lugar, sin tener que volver a introducir tus datos.
                </p>
                <Link
                  href={`/auth/register?email=${encodeURIComponent(custEmail)}&name=${encodeURIComponent(custName)}`}
                  className="block w-full rounded-xl border border-primary-200 py-2 text-center text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                >
                  Crear cuenta con este email →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
