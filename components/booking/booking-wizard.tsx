'use client'

import { type ReactNode, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react'
import { createBookingAction, joinWaitlistAction } from '@/app/actions/booking'

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
type MonthAvailability = Record<string, number>

interface Props {
  centerId: string
  centerSlug: string
  centerName: string
  services: ServiceData[]
  preSelectedServiceId?: string
  bookingWindowMonths?: 3 | 6
}

const STEP_NAMES = ['Servicio', 'Profesional', 'Fecha y hora', 'Tus datos', 'Confirmar']
const DEFAULT_BOOKING_WINDOW_MONTHS = 6
const WEEK_DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

function fmtPrice(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function startOfLocalDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function fmtDateLong(dateStr: string) {
  return parseLocalDate(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function localDayOfWeekMondayZero(date: Date) {
  return date.getDay() === 0 ? 6 : date.getDay() - 1
}

function buildCalendarDays(monthDate: Date) {
  const monthStart = startOfMonth(monthDate)
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - localDayOfWeekMondayZero(monthStart))

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
}

export function BookingWizard({
  centerId,
  centerSlug,
  centerName,
  services,
  preSelectedServiceId,
  bookingWindowMonths = DEFAULT_BOOKING_WINDOW_MONTHS,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isWaitlistPending, startWaitlistTransition] = useTransition()
  const { data: session, status: sessionStatus } = useSession()
  const isAuthenticated = sessionStatus === 'authenticated'

  const initialService = preSelectedServiceId
    ? (services.find(service => service.id === preSelectedServiceId) ?? null)
    : null
  const today = useMemo(() => startOfLocalDay(new Date()), [])
  const maxBookableDate = useMemo(() => startOfLocalDay(new Date(today.getFullYear(), today.getMonth() + bookingWindowMonths, today.getDate())), [bookingWindowMonths, today])
  const firstMonth = useMemo(() => startOfMonth(today), [today])
  const maxMonth = useMemo(() => startOfMonth(maxBookableDate), [maxBookableDate])

  const [step, setStep] = useState<Step>(initialService ? 2 : 1)
  const [selectedService, setSelectedService] = useState<ServiceData | null>(initialService)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedStaffName, setSelectedStaffName] = useState('Sin preferencia')
  const [visibleMonth, setVisibleMonth] = useState(firstMonth)
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
  const [monthAvailability, setMonthAvailability] = useState<MonthAvailability>({})
  const [loadingMonthAvailability, setLoadingMonthAvailability] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [waitlistMessage, setWaitlistMessage] = useState<string | null>(null)
  const [waitlistError, setWaitlistError] = useState<string | null>(null)

  const selectedSlotStaffName = selectedSlot
    ? (staffList.find(staff => staff.id === selectedSlot.staffId)?.name ?? selectedStaffName)
    : selectedStaffName
  const confirmationStaffLabel = selectedStaffId
    ? selectedStaffName
    : selectedSlot
      ? `${selectedSlotStaffName} (asignado automaticamente)`
      : selectedStaffName

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
      .catch(() => setStaffList([]))
      .finally(() => setLoadingStaff(false))
  }, [centerId, selectedService, step])

  useEffect(() => {
    if (step !== 3 || !selectedService) return
    setLoadingMonthAvailability(true)
    setMonthAvailability({})
    const params = new URLSearchParams({
      centerId,
      serviceId: selectedService.id,
      month: monthKey(visibleMonth),
    })
    if (selectedStaffId) params.set('staffId', selectedStaffId)

    fetch(`/api/v1/availability/month?${params}`)
      .then(response => response.json())
      .then(data => {
        const next: MonthAvailability = {}
        for (const day of data.days ?? []) next[day.date] = day.count
        setMonthAvailability(next)
      })
      .catch(() => setMonthAvailability({}))
      .finally(() => setLoadingMonthAvailability(false))
  }, [centerId, selectedService, selectedStaffId, step, visibleMonth])

  useEffect(() => {
    if (step !== 3 || !selectedDate || !selectedService) return
    setLoadingSlots(true)
    setSlots([])
    const params = new URLSearchParams({ centerId, serviceId: selectedService.id, date: selectedDate })
    if (selectedStaffId) params.set('staffId', selectedStaffId)
    fetch(`/api/v1/availability?${params}`)
      .then(response => response.json())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [centerId, selectedDate, selectedService, selectedStaffId, step])

  function goBack() {
    if (step === 1) return
    const prev = (step - 1) as Step
    if (prev < 3) {
      setSelectedDate('')
      setSelectedSlot(null)
      setSlots([])
      setVisibleMonth(firstMonth)
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
    setSlots([])
    setVisibleMonth(firstMonth)
    setStep(2)
  }

  function selectStaff(staffId: string | null, staffName: string) {
    setSelectedStaffId(staffId)
    setSelectedStaffName(staffName)
    setSelectedDate('')
    setSelectedSlot(null)
    setSlots([])
    setVisibleMonth(firstMonth)
    setStep(3)
  }

  function selectDate(date: Date) {
    setSelectedDate(formatDate(date))
    setSelectedSlot(null)
    setWaitlistMessage(null)
    setWaitlistError(null)
  }

  function moveMonth(direction: -1 | 1) {
    const next = addMonths(visibleMonth, direction)
    if (next < firstMonth || next > maxMonth) return
    setVisibleMonth(next)
    setSelectedDate('')
    setSelectedSlot(null)
    setSlots([])
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

  function handleJoinWaitlist() {
    if (!selectedService || !selectedDate) return
    setWaitlistMessage(null)
    setWaitlistError(null)

    startWaitlistTransition(async () => {
      const result = await joinWaitlistAction({
        centerId,
        serviceId: selectedService.id,
        staffId: selectedStaffId,
        requestedDate: selectedDate,
        customerName: custName.trim(),
        customerEmail: custEmail.trim().toLowerCase(),
        customerPhone: custPhone.trim() || undefined,
        consentGiven,
        marketingConsent,
      })

      if (result.success) {
        setWaitlistMessage(
          result.alreadyJoined
            ? 'Ya estabas en la lista de espera para este dia. Te avisaremos si se libera un hueco.'
            : 'Listo. Te avisaremos si se libera un hueco para este servicio.'
        )
        return
      }

      setWaitlistError(result.error)
    })
  }

  return (
    <div>
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2f6df6]">Reserva online</p>
          <span className="text-xs font-bold text-[#647089]">{STEP_NAMES[step - 1]}</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {STEP_NAMES.map((name, index) => (
            <div key={name} className={`h-1.5 rounded-full transition-all ${index + 1 <= step ? 'bg-[#2f6df6]' : 'bg-[#d8dee9]'}`} />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <Link href={`/centro/${centerSlug}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#647089] hover:text-[#0c1324]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al centro
        </Link>
      ) : (
        <button onClick={goBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#647089] hover:text-[#0c1324]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Atras
        </button>
      )}

      <div className="overflow-hidden rounded-lg border border-[#d8dee9] bg-white shadow-[0_24px_70px_rgba(12,19,36,0.08)]">
        {step === 1 && (
          <section className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-[#0c1324]">Que servicio quieres?</h2>
            <p className="mt-1 text-sm text-[#647089]">{centerName}</p>
            <div className="mt-6 grid gap-2 lg:grid-cols-2">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => selectService(service)}
                  className="group flex w-full items-center justify-between rounded-md border border-[#d8dee9] p-4 text-left transition-all hover:border-[#b9c4d5] hover:bg-[#f7f9fc]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-black text-[#0c1324]">{service.name}</span>
                    {service.description && <span className="mt-0.5 block truncate text-xs text-[#647089]">{service.description}</span>}
                    <span className="mt-1 flex items-center gap-1 text-xs text-[#647089]">
                      <Clock className="h-3 w-3" />
                      {fmtDuration(service.durationMinutes)}
                    </span>
                  </span>
                  <span className="ml-4 flex shrink-0 items-center gap-2">
                    <span className="font-black text-[#0c1324]">{fmtPrice(service.priceCents)}</span>
                    <ChevronRight className="h-4 w-4 text-[#8b96aa] transition-colors group-hover:text-[#2f6df6]" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && selectedService && (
          <section className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-[#0c1324]">Elige profesional</h2>
            <p className="mt-1 text-sm text-[#647089]">
              {selectedService.name} - {fmtDuration(selectedService.durationMinutes)}
            </p>
            {loadingStaff ? (
              <LoadingState label="Cargando profesionales..." />
            ) : (
              <div className="mt-6 grid gap-2 lg:grid-cols-2">
                <button
                  onClick={() => selectStaff(null, 'Sin preferencia')}
                  className="group flex w-full items-center gap-4 rounded-md border border-[#d8dee9] p-4 text-left transition-all hover:border-[#b9c4d5] hover:bg-[#f7f9fc]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5edff]">
                    <Users className="h-5 w-5 text-[#2f6df6]" />
                  </span>
                  <span>
                    <span className="block font-black text-[#0c1324]">Sin preferencia</span>
                    <span className="text-xs text-[#647089]">Mostraremos horas de cualquier profesional apto para este servicio</span>
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 text-[#8b96aa] group-hover:text-[#2f6df6]" />
                </button>

                {staffList.map(staff => (
                  <button
                    key={staff.id}
                    onClick={() => selectStaff(staff.id, staff.name)}
                    className="group flex w-full items-center gap-4 rounded-md border border-[#d8dee9] p-4 text-left transition-all hover:border-[#b9c4d5] hover:bg-[#f7f9fc]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0c1324] text-sm font-black text-white">
                      {staff.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block font-black text-[#0c1324]">{staff.name}</span>
                      {staff.role && <span className="text-xs text-[#647089]">{staff.role}</span>}
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 text-[#8b96aa] group-hover:text-[#2f6df6]" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 3 && selectedService && (
          <section className="p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#0c1324]">Elige fecha y hora</h2>
                <p className="mt-1 text-sm text-[#647089]">
                  {selectedService.name} - {selectedStaffName} - reservas hasta {bookingWindowMonths} meses
                </p>
              </div>
              <div className="inline-flex rounded-md border border-[#d8dee9] bg-[#f7f9fc] p-1">
                <button onClick={() => moveMonth(-1)} disabled={visibleMonth <= firstMonth} className="flex h-9 w-9 items-center justify-center rounded text-[#647089] transition hover:bg-white disabled:opacity-30">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setVisibleMonth(firstMonth)
                    setSelectedDate('')
                    setSelectedSlot(null)
                    setSlots([])
                  }}
                  className="rounded px-3 text-xs font-black uppercase tracking-wide text-[#0c1324] transition hover:bg-white"
                >
                  Hoy
                </button>
                <button onClick={() => moveMonth(1)} disabled={visibleMonth >= maxMonth} className="flex h-9 w-9 items-center justify-center rounded text-[#647089] transition hover:bg-white disabled:opacity-30">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
              <MonthCalendar
                visibleMonth={visibleMonth}
                today={today}
                maxBookableDate={maxBookableDate}
                selectedDate={selectedDate}
                availability={monthAvailability}
                loading={loadingMonthAvailability}
                onSelectDate={selectDate}
              />

              <aside className="rounded-lg border border-[#d8dee9] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2f6df6]">Horas disponibles</p>
                <h3 className="mt-2 text-lg font-black text-[#0c1324]">
                  {selectedDate ? fmtDateLong(selectedDate) : 'Selecciona un dia'}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#647089]">
                  {selectedStaffId
                    ? `Profesional: ${selectedStaffName}`
                    : 'Sin preferencia: cada hora se asigna a un profesional disponible para este servicio.'}
                </p>

                {!selectedDate && (
                  <EmptyState icon={<CalendarDays className="h-8 w-8 text-[#8b96aa]" />} label="Selecciona un dia del calendario mensual" compact />
                )}
                {selectedDate && loadingSlots && <LoadingState label="Cargando horarios..." />}
                {selectedDate && !loadingSlots && slots.length === 0 && (
                  <>
                    <EmptyState label="Sin disponibilidad para este dia. Puedes probar otra fecha o apuntarte a la lista de espera." compact />
                    <div className="mt-4 rounded-lg border border-[#cfe0ff] bg-[#edf3ff] p-4">
                      <p className="text-sm font-black text-[#0c1324]">Lista de espera</p>
                      <p className="mt-1 text-xs leading-5 text-[#647089]">
                        Si alguien cancela o el centro abre nuevos huecos, podra contactarte para ofrecerte una cita.
                      </p>

                      <div className="mt-4 space-y-3">
                        <Field label="Nombre" required>
                          <input value={custName} onChange={event => setCustName(event.target.value)} className="input-base" placeholder="Tu nombre" autoComplete="name" />
                        </Field>
                        <Field label="Email" required>
                          <input value={custEmail} onChange={event => setCustEmail(event.target.value)} className="input-base" placeholder="tu@email.com" autoComplete="email" type="email" readOnly={isAuthenticated} />
                        </Field>
                        <Field label="Telefono">
                          <input value={custPhone} onChange={event => setCustPhone(event.target.value)} className="input-base" placeholder="+34 600 000 000" autoComplete="tel" type="tel" />
                        </Field>
                        <ConsentRow checked={consentGiven} onChange={setConsentGiven}>
                          Acepto la{' '}
                          <Link href="/privacidad" className="font-bold text-[#2f6df6] underline" target="_blank" rel="noreferrer">
                            politica de privacidad
                          </Link>{' '}
                          y el tratamiento de mis datos para gestionar la lista de espera. *
                        </ConsentRow>
                        <ConsentRow checked={marketingConsent} onChange={setMarketingConsent}>
                          Acepto recibir comunicaciones del centro sobre ofertas y novedades. <span className="text-[#8b96aa]">(Opcional)</span>
                        </ConsentRow>
                      </div>

                      {waitlistMessage && (
                        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                          {waitlistMessage}
                        </div>
                      )}
                      {waitlistError && (
                        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                          {waitlistError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleJoinWaitlist}
                        disabled={isWaitlistPending || !custName.trim() || !custEmail.trim() || !consentGiven}
                        className="btn-primary mt-4 w-full py-3 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isWaitlistPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Avisadme si se libera
                      </button>
                    </div>
                  </>
                )}
                {selectedDate && !loadingSlots && slots.length > 0 && (
                  <div className="mt-4 grid gap-2">
                    {slots.map(slot => {
                      const slotStaff = staffList.find(staff => staff.id === slot.staffId)?.name
                      return (
                        <button
                          key={`${slot.time}-${slot.staffId}`}
                          onClick={() => {
                            setSelectedSlot(slot)
                            setStep(4)
                          }}
                          className="flex items-center justify-between rounded-md border border-[#d8dee9] bg-[#f7f9fc] px-3 py-2.5 text-left transition hover:border-[#2f6df6] hover:bg-[#edf3ff]"
                        >
                          <span className="font-black text-[#0c1324]">{slot.time}</span>
                          <span className="text-xs font-bold text-[#647089]">{slotStaff ?? 'Disponible'}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}

        {step === 4 && selectedService && selectedSlot && (
          <section className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-[#0c1324]">Tus datos</h2>
            <p className="mt-1 text-sm text-[#647089]">
              {selectedService.name} - {fmtDateLong(selectedDate)} - {selectedSlot.time} - {confirmationStaffLabel}
            </p>

            {isAuthenticated && session?.user && (
              <div className="mt-6 flex items-center gap-3 rounded-md border border-[#d8dee9] bg-[#f7f9fc] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c1324] text-sm font-black text-white">
                  {(session.user.name ?? 'U')[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#0c1324]">{session.user.name}</p>
                  <p className="truncate text-xs text-[#647089]">{session.user.email}</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-[#e7f7f5] px-2.5 py-1 text-xs font-bold text-[#10786f]">
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
                {isAuthenticated && <p className="mt-1 text-[11px] text-[#647089]">Recibiras la confirmacion en el email de tu cuenta.</p>}
              </Field>
              <Field label="Telefono">
                <input value={custPhone} onChange={event => setCustPhone(event.target.value)} className="input-base" placeholder="+34 600 000 000" autoComplete="tel" type="tel" />
              </Field>

              <ConsentRow checked={consentGiven} onChange={setConsentGiven}>
                Acepto la{' '}
                <Link href="/privacidad" className="font-bold text-[#2f6df6] underline" target="_blank" rel="noreferrer">
                  politica de privacidad
                </Link>{' '}
                y el tratamiento de mis datos para gestionar la reserva. *
              </ConsentRow>
              <ConsentRow checked={marketingConsent} onChange={setMarketingConsent}>
                Acepto recibir comunicaciones del centro sobre ofertas y novedades. <span className="text-[#8b96aa]">(Opcional)</span>
              </ConsentRow>

              <button disabled={!custName.trim() || !custEmail.trim() || !consentGiven} onClick={() => setStep(5)} className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-40">
                Continuar a confirmacion
              </button>
            </div>
          </section>
        )}

        {step === 5 && selectedService && selectedSlot && (
          <section className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-[#0c1324]">Confirma tu reserva</h2>

            <div className="mt-6 overflow-hidden rounded-lg border border-[#d8dee9]">
              {[
                { label: 'Centro', value: centerName },
                { label: 'Servicio', value: selectedService.name },
                { label: 'Profesional', value: confirmationStaffLabel },
                { label: 'Fecha', value: fmtDateLong(selectedDate) },
                { label: 'Hora', value: selectedSlot.time },
                { label: 'Duracion', value: fmtDuration(selectedService.durationMinutes) },
              ].map((row, index) => (
                <div key={row.label} className={`flex justify-between gap-4 px-5 py-3.5 text-sm ${index > 0 ? 'border-t border-[#e5eaf2]' : ''}`}>
                  <span className="text-[#647089]">{row.label}</span>
                  <span className="text-right font-bold text-[#0c1324]">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-[#d8dee9] bg-[#f1f4f8] px-5 py-4">
                <span className="font-black text-[#0c1324]">Total</span>
                <span className="text-lg font-black text-[#2f6df6]">{fmtPrice(selectedService.priceCents)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-md border border-[#d8dee9] bg-[#f7f9fc] px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5edff] text-xs font-black text-[#2355c8]">
                {custName[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-[#0c1324]">{custName}</p>
                <p className="truncate text-xs text-[#647089]">{custEmail}{custPhone ? ` - ${custPhone}` : ''}</p>
              </div>
            </div>

            {submitError && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>}

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
            <p className="mt-3 text-center text-xs text-[#647089]">
              Cancelacion gratuita hasta 24h antes - Confirmacion por email
            </p>

            {!isAuthenticated && (
              <div className="mt-5 rounded-lg border border-[#cfe0ff] bg-[#edf3ff] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#2f6df6]" />
                  <p className="text-sm font-black text-[#0c1324]">Primera vez aqui?</p>
                </div>
                <p className="mb-3 text-xs text-[#647089]">
                  Crea una cuenta gratis para ver y gestionar tus reservas sin introducir tus datos de nuevo.
                </p>
                <Link href={`/auth/register?email=${encodeURIComponent(custEmail)}&name=${encodeURIComponent(custName)}`} className="block w-full rounded-md border border-[#cfe0ff] py-2 text-center text-sm font-bold text-[#2355c8] transition-colors hover:bg-[#e5edff]">
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

function MonthCalendar({
  visibleMonth,
  today,
  maxBookableDate,
  selectedDate,
  availability,
  loading,
  onSelectDate,
}: {
  visibleMonth: Date
  today: Date
  maxBookableDate: Date
  selectedDate: string
  availability: MonthAvailability
  loading: boolean
  onSelectDate: (date: Date) => void
}) {
  const days = buildCalendarDays(visibleMonth)
  const currentMonth = visibleMonth.getMonth()

  return (
    <div className="overflow-hidden rounded-lg border border-[#d8dee9] bg-white">
      <div className="flex items-center justify-between border-b border-[#d8dee9] px-4 py-3">
        <div>
          <h3 className="text-lg font-black capitalize text-[#0c1324]">
            {visibleMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h3>
          <p className="text-xs font-semibold text-[#647089]">
            {loading ? 'Actualizando disponibilidad...' : 'Vista mensual completa'}
          </p>
        </div>
        <div className="hidden items-center gap-2 text-xs font-bold text-[#647089] sm:flex">
          <span className="h-2 w-2 rounded-full bg-[#2f6df6]" /> Disponible
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Pocos huecos
          <span className="h-2 w-2 rounded-full bg-[#d8dee9]" /> Sin huecos
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-[#d8dee9] bg-[#f7f9fc]">
        {WEEK_DAYS.map(day => (
          <div key={day} className="border-r border-[#d8dee9] px-2 py-2 text-center text-[11px] font-black uppercase tracking-wide text-[#647089] last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map(date => {
          const dateStr = formatDate(date)
          const inCurrentMonth = date.getMonth() === currentMonth
          const isPast = date < today
          const isOutOfWindow = date > maxBookableDate
          const disabled = !inCurrentMonth || isPast || isOutOfWindow
          const selected = selectedDate === dateStr
          const count = availability[dateStr] ?? 0
          const hasAvailability = count > 0
          const lowAvailability = count > 0 && count <= 3

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => !disabled && onSelectDate(date)}
              disabled={disabled}
              className={`min-h-[76px] border-r border-b border-[#d8dee9] p-2 text-left transition last:border-r-0 [&:nth-child(7n)]:border-r-0 sm:min-h-[92px] ${
                selected
                  ? 'bg-[#edf3ff] ring-2 ring-inset ring-[#2f6df6]'
                  : inCurrentMonth
                    ? 'bg-white hover:bg-[#f7f9fc]'
                    : 'bg-[#f7f9fc] text-[#8b96aa]'
              } ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
            >
              <span className={`text-xs font-black ${inCurrentMonth ? 'text-[#0c1324]' : 'text-[#8b96aa]'}`}>
                {date.getDate()}
              </span>
              {!disabled && inCurrentMonth && (
                <span className={`mt-2 block truncate rounded px-1.5 py-1 text-[10px] font-black ${
                  hasAvailability
                    ? lowAvailability
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-[#e5edff] text-[#2355c8]'
                    : loading
                      ? 'bg-[#f1f4f8] text-[#8b96aa]'
                      : 'bg-[#f1f4f8] text-[#647089]'
                }`}>
                  {loading ? '...' : hasAvailability ? `${count} huecos` : 'Sin huecos'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[#647089]">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

function EmptyState({ icon, label, compact = false }: { icon?: ReactNode; label: string; compact?: boolean }) {
  return (
    <div className={`mt-4 rounded-md border border-dashed border-[#d8dee9] text-center ${compact ? 'px-4 py-6' : 'py-8'}`}>
      {icon && <div className="mb-2 flex justify-center">{icon}</div>}
      <p className="text-sm text-[#647089]">{label}</p>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-[#2f6df6]">*</span>}
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
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md bg-[#f7f9fc] p-4 transition-colors hover:bg-[#f1f4f8]">
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#2f6df6]"
      />
      <span className="text-sm text-[#647089]">{children}</span>
    </label>
  )
}
