'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react'
import { createBookingAction } from '@/app/actions/booking'

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

interface Props {
  centerId: string
  centerSlug: string
  centerName: string
  services: ServiceData[]
  preSelectedServiceId?: string
}

const STEP_NAMES = ['Servicio', 'Profesional', 'Fecha y hora', 'Tus datos', 'Confirmar']
const NEXT_DAYS = getNextDays(14)

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
    day: d.toLocaleDateString('es-ES', { day: 'numeric' }),
    month: d.toLocaleDateString('es-ES', { month: 'short' }),
  }
}

function fmtDateLong(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function BookingWizard({ centerId, centerSlug, centerName, services, preSelectedServiceId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { data: session, status: sessionStatus } = useSession()
  const isAuthenticated = sessionStatus === 'authenticated'

  const initialService = preSelectedServiceId
    ? (services.find(service => service.id === preSelectedServiceId) ?? null)
    : null

  const [step, setStep] = useState<Step>(initialService ? 2 : 1)
  const [selectedService, setSelectedService] = useState<ServiceData | null>(initialService)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedStaffName, setSelectedStaffName] = useState('Sin preferencia')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null)
  const [custName, setCustName] = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [slots, setSlots] = useState<SlotData[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user) return
    if (session.user.name) setCustName(current => current || session.user!.name!)
    if (session.user.email) setCustEmail(current => current || session.user!.email!)
  }, [session])

  useEffect(() => {
    if (step !== 2 || !selectedService) return
    setLoadingStaff(true)
    setStaffList([])
    fetch(`/api/v1/staff?centerId=${centerId}&serviceId=${selectedService.id}`)
      .then(response => response.json())
      .then(data => setStaffList(data.staff ?? []))
      .catch(() => {})
      .finally(() => setLoadingStaff(false))
  }, [centerId, selectedService, step])

  useEffect(() => {
    if (step !== 3 || !selectedDate || !selectedService) return
    setLoadingSlots(true)
    setSlots([])
    const params = new URLSearchParams({ centerId, serviceId: selectedService.id, date: selectedDate })
    if (selectedStaffId) params.set('staffId', selectedStaffId)
    fetch(`/api/v1/availability?${params}`)
      .then(response => response.json())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => {})
      .finally(() => setLoadingSlots(false))
  }, [centerId, selectedDate, selectedService, selectedStaffId, step])

  function goBack() {
    if (step === 1) return
    const prev = (step - 1) as Step
    if (prev < 3) {
      setSelectedDate('')
      setSelectedSlot(null)
      setSlots([])
    }
    if (prev < 2) {
      setSelectedStaffId(null)
      setSelectedStaffName('Sin preferencia')
    }
    setStep(prev)
  }

  function selectService(service: ServiceData) {
    setSelectedService(service)
    setSelectedStaffId(null)
    setSelectedStaffName('Sin preferencia')
    setSelectedDate('')
    setSelectedSlot(null)
    setStep(2)
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
        return
      }

      setSubmitError(result.error)
      if (result.error?.toLowerCase().includes('horario') || result.error?.toLowerCase().includes('ocupado')) {
        setSelectedSlot(null)
        setSelectedDate('')
        setSlots([])
        setStep(3)
      }
    })
  }

  return (
    <div>
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9f3f2f]">Reserva online</p>
          <span className="text-xs font-bold text-[#6c625a]">{STEP_NAMES[step - 1]}</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {STEP_NAMES.map((name, index) => (
            <div
              key={name}
              className={`h-1.5 rounded-full transition-all ${index + 1 <= step ? 'bg-[#e36952]' : 'bg-[#e5ded3]'}`}
            />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <Link href={`/centro/${centerSlug}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#6c625a] hover:text-[#171412]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al centro
        </Link>
      ) : (
        <button onClick={goBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#6c625a] hover:text-[#171412]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Atras
        </button>
      )}

      <div className="overflow-hidden rounded-lg border border-[#e5ded3] bg-white shadow-[0_24px_70px_rgba(42,32,24,0.08)]">
        {step === 1 && (
          <section className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-[#171412]">Que servicio quieres?</h2>
            <p className="mt-1 text-sm text-[#6c625a]">{centerName}</p>
            <div className="mt-6 space-y-2">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => selectService(service)}
                  className="group flex w-full items-center justify-between rounded-md border border-[#e5ded3] p-4 text-left transition-all hover:border-[#d7cbbb] hover:bg-[#fbfaf7]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-black text-[#171412]">{service.name}</span>
                    {service.description && (
                      <span className="mt-0.5 block truncate text-xs text-[#6c625a]">{service.description}</span>
                    )}
                    <span className="mt-1 flex items-center gap-1 text-xs text-[#6c625a]">
                      <Clock className="h-3 w-3" />
                      {fmtDuration(service.durationMinutes)}
                    </span>
                  </span>
                  <span className="ml-4 flex shrink-0 items-center gap-2">
                    <span className="font-black text-[#171412]">{fmtPrice(service.priceCents)}</span>
                    <ChevronRight className="h-4 w-4 text-[#cbbcaf] transition-colors group-hover:text-[#9f3f2f]" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && selectedService && (
          <section className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-[#171412]">Elige profesional</h2>
            <p className="mt-1 text-sm text-[#6c625a]">
              {selectedService.name} · {fmtDuration(selectedService.durationMinutes)}
            </p>
            {loadingStaff ? (
              <LoadingState label="Cargando profesionales..." />
            ) : (
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => {
                    setSelectedStaffId(null)
                    setSelectedStaffName('Sin preferencia')
                    setStep(3)
                  }}
                  className="group flex w-full items-center gap-4 rounded-md border border-[#e5ded3] p-4 text-left transition-all hover:border-[#d7cbbb] hover:bg-[#fbfaf7]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eee7dd]">
                    <Users className="h-5 w-5 text-[#6c625a]" />
                  </span>
                  <span>
                    <span className="block font-black text-[#171412]">Sin preferencia</span>
                    <span className="text-xs text-[#6c625a]">Primer profesional disponible</span>
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 text-[#cbbcaf] group-hover:text-[#9f3f2f]" />
                </button>

                {staffList.map(staff => (
                  <button
                    key={staff.id}
                    onClick={() => {
                      setSelectedStaffId(staff.id)
                      setSelectedStaffName(staff.name)
                      setStep(3)
                    }}
                    className="group flex w-full items-center gap-4 rounded-md border border-[#e5ded3] p-4 text-left transition-all hover:border-[#d7cbbb] hover:bg-[#fbfaf7]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171412] text-sm font-black text-white">
                      {staff.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block font-black text-[#171412]">{staff.name}</span>
                      {staff.role && <span className="text-xs text-[#6c625a]">{staff.role}</span>}
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 text-[#cbbcaf] group-hover:text-[#9f3f2f]" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 3 && selectedService && (
          <section className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-[#171412]">Elige fecha y hora</h2>
            <p className="mt-1 text-sm text-[#6c625a]">
              {selectedService.name} · {selectedStaffName}
            </p>

            <div className="-mx-1 mt-6 overflow-x-auto pb-1">
              <div className="flex gap-2 px-1" style={{ minWidth: 'max-content' }}>
                {NEXT_DAYS.map(date => {
                  const { weekday, day, month } = getDateLabel(date)
                  const active = selectedDate === date
                  return (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date)
                        setSelectedSlot(null)
                      }}
                      className={`flex min-w-16 flex-col items-center rounded-md border px-3.5 py-2.5 text-center transition-all ${
                        active
                          ? 'border-[#171412] bg-[#171412] text-white'
                          : 'border-[#e5ded3] bg-white text-[#332b26] hover:border-[#d7cbbb] hover:bg-[#fbfaf7]'
                      }`}
                    >
                      <span className={`text-xs font-bold capitalize ${active ? 'text-white/70' : 'text-[#6c625a]'}`}>{weekday}</span>
                      <span className="text-lg font-black leading-tight">{day}</span>
                      <span className={`text-[10px] capitalize ${active ? 'text-white/58' : 'text-[#9a8f84]'}`}>{month}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {!selectedDate && (
              <EmptyState icon={<CalendarDays className="h-8 w-8 text-[#9a8f84]" />} label="Selecciona un dia para ver disponibilidad" />
            )}
            {selectedDate && loadingSlots && <LoadingState label="Cargando horarios..." />}
            {selectedDate && !loadingSlots && slots.length === 0 && (
              <EmptyState label="Sin disponibilidad para este dia. Prueba con otra fecha." />
            )}
            {selectedDate && !loadingSlots && slots.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map(slot => (
                  <button
                    key={`${slot.time}-${slot.staffId}`}
                    onClick={() => {
                      setSelectedSlot(slot)
                      setStep(4)
                    }}
                    className="rounded-md border border-[#e5ded3] bg-white py-3 text-center text-sm font-black text-[#332b26] transition-all hover:border-[#e36952] hover:bg-[#f4ded6]"
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 4 && selectedService && selectedSlot && (
          <section className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-[#171412]">Tus datos</h2>
            <p className="mt-1 text-sm text-[#6c625a]">
              {selectedService.name} · {fmtDateLong(selectedDate)} · {selectedSlot.time}
            </p>

            {isAuthenticated && session?.user && (
              <div className="mt-6 flex items-center gap-3 rounded-md border border-[#e5ded3] bg-[#fbfaf7] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#171412] text-sm font-black text-white">
                  {(session.user.name ?? 'U')[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#171412]">{session.user.name}</p>
                  <p className="truncate text-xs text-[#6c625a]">{session.user.email}</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-[#eef4eb] px-2.5 py-1 text-xs font-bold text-[#4b7258]">
                  <BadgeCheck className="h-3 w-3" />
                  Identificado
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <Field label="Nombre completo" required>
                <input value={custName} onChange={event => setCustName(event.target.value)} className="input-base" placeholder="Tu nombre completo" autoComplete="name" />
              </Field>
              <Field label="Email" required>
                <input value={custEmail} onChange={event => setCustEmail(event.target.value)} className="input-base" placeholder="tu@email.com" autoComplete="email" type="email" readOnly={isAuthenticated} />
                {isAuthenticated && <p className="mt-1 text-[11px] text-[#6c625a]">Recibiras la confirmacion en el email de tu cuenta.</p>}
              </Field>
              <Field label="Telefono">
                <input value={custPhone} onChange={event => setCustPhone(event.target.value)} className="input-base" placeholder="+34 600 000 000" autoComplete="tel" type="tel" />
              </Field>

              <ConsentRow checked={consentGiven} onChange={setConsentGiven}>
                Acepto la{' '}
                <Link href="/privacidad" className="font-bold text-[#9f3f2f] underline" target="_blank" rel="noreferrer">
                  politica de privacidad
                </Link>{' '}
                y el tratamiento de mis datos para gestionar la reserva. *
              </ConsentRow>
              <ConsentRow checked={marketingConsent} onChange={setMarketingConsent}>
                Acepto recibir comunicaciones del centro sobre ofertas y novedades. <span className="text-[#9a8f84]">(Opcional)</span>
              </ConsentRow>

              <button
                disabled={!custName.trim() || !custEmail.trim() || !consentGiven}
                onClick={() => setStep(5)}
                className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar a confirmacion
              </button>
            </div>
          </section>
        )}

        {step === 5 && selectedService && selectedSlot && (
          <section className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-[#171412]">Confirma tu reserva</h2>

            <div className="mt-6 overflow-hidden rounded-lg border border-[#e5ded3]">
              {[
                { label: 'Centro', value: centerName },
                { label: 'Servicio', value: selectedService.name },
                { label: 'Profesional', value: selectedStaffName },
                { label: 'Fecha', value: fmtDateLong(selectedDate) },
                { label: 'Hora', value: selectedSlot.time },
                { label: 'Duracion', value: fmtDuration(selectedService.durationMinutes) },
              ].map((row, index) => (
                <div key={row.label} className={`flex justify-between gap-4 px-5 py-3.5 text-sm ${index > 0 ? 'border-t border-[#eee7dd]' : ''}`}>
                  <span className="text-[#6c625a]">{row.label}</span>
                  <span className="text-right font-bold text-[#171412]">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-[#e5ded3] bg-[#f7f4ef] px-5 py-4">
                <span className="font-black text-[#171412]">Total</span>
                <span className="text-lg font-black text-[#9f3f2f]">{fmtPrice(selectedService.priceCents)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-md border border-[#eee7dd] bg-[#fbfaf7] px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee7dd] text-xs font-black text-[#5f554d]">
                {custName[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-[#171412]">{custName}</p>
                <p className="truncate text-xs text-[#6c625a]">{custEmail}{custPhone ? ` · ${custPhone}` : ''}</p>
              </div>
            </div>

            {submitError && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <button onClick={handleConfirm} disabled={isPending} className="btn-primary mt-5 w-full py-4 text-base disabled:opacity-60">
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
            <p className="mt-3 text-center text-xs text-[#6c625a]">
              Cancelacion gratuita hasta 24h antes · Confirmacion por email
            </p>

            {!isAuthenticated && (
              <div className="mt-5 rounded-lg border border-[#f2b5a7] bg-[#fff6f2] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#9f3f2f]" />
                  <p className="text-sm font-black text-[#171412]">Primera vez aqui?</p>
                </div>
                <p className="mb-3 text-xs text-[#6c625a]">
                  Crea una cuenta gratis para ver y gestionar tus reservas sin introducir tus datos de nuevo.
                </p>
                <Link
                  href={`/auth/register?email=${encodeURIComponent(custEmail)}&name=${encodeURIComponent(custName)}`}
                  className="block w-full rounded-md border border-[#f2b5a7] py-2 text-center text-sm font-bold text-[#9f3f2f] transition-colors hover:bg-[#f4ded6]"
                >
                  Crear cuenta con este email
                </Link>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[#6c625a]">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

function EmptyState({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <div className="mt-6 rounded-md border border-dashed border-[#d7cbbb] py-8 text-center">
      {icon && <div className="mb-2 flex justify-center">{icon}</div>}
      <p className="text-sm text-[#6c625a]">{label}</p>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-[#9f3f2f]">*</span>}
      </label>
      {children}
    </div>
  )
}

function ConsentRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md bg-[#fbfaf7] p-4 transition-colors hover:bg-[#f7f4ef]">
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#e36952]"
      />
      <span className="text-sm text-[#5f554d]">{children}</span>
    </label>
  )
}
