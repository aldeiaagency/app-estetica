'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Calendar, Clock, User, Scissors } from 'lucide-react'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

export interface CalendarBooking {
  id: string
  startAt: string      // ISO string
  startTime: string    // "HH:mm" in Europe/Madrid
  status: BookingStatus
  customerName: string
  serviceName: string
  staffName?: string | null
}

interface BookingCalendarProps {
  bookings: CalendarBooking[]
  onStatusChange?: (bookingId: string, status: BookingStatus) => void
}

const MONTHS_SHOWN = 3

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const STATUS_DOT: Record<BookingStatus, string> = {
  CONFIRMED:  'bg-emerald-500',
  PENDING:    'bg-amber-400',
  CANCELLED:  'bg-red-400',
  COMPLETED:  'bg-zinc-400',
  NO_SHOW:    'bg-orange-400',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED:  'Confirmada',
  PENDING:    'Pendiente',
  CANCELLED:  'Cancelada',
  COMPLETED:  'Completada',
  NO_SHOW:    'No se presentó',
}

const STATUS_BADGE: Record<BookingStatus, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  COMPLETED: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  NO_SHOW:   'bg-orange-50 text-orange-700 border-orange-200',
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// 0 = Monday, 6 = Sunday
function getFirstDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay() // 0=Sun
  return d === 0 ? 6 : d - 1
}

interface MonthGridProps {
  year: number
  month: number
  bookingsByDate: Map<string, CalendarBooking[]>
  selectedDate: string | null
  todayKey: string
  onSelect: (key: string) => void
}

function MonthGrid({ year, month, bookingsByDate, selectedDate, todayKey, onSelect }: MonthGridProps) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      {/* Month header */}
      <p className="mb-3 text-sm font-bold text-zinc-900">
        {MONTH_NAMES[month]} <span className="font-normal text-zinc-400">{year}</span>
      </p>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />

          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayBookings = bookingsByDate.get(key) ?? []
          const isToday = key === todayKey
          const isSelected = key === selectedDate
          const hasBookings = dayBookings.length > 0

          return (
            <button
              key={idx}
              onClick={() => hasBookings || isToday ? onSelect(key) : undefined}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-all duration-150 ${
                isSelected
                  ? 'bg-primary-600 shadow-sm'
                  : isToday
                  ? 'bg-primary-50 ring-1 ring-primary-300'
                  : hasBookings
                  ? 'hover:bg-zinc-50 cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              <span className={`text-xs font-semibold ${
                isSelected ? 'text-white' : isToday ? 'text-primary-600' : 'text-zinc-700'
              }`}>
                {day}
              </span>
              {hasBookings && (
                <div className="flex gap-0.5">
                  {dayBookings.slice(0, 3).map((b, i) => (
                    <div
                      key={i}
                      className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white/70' : STATUS_DOT[b.status]}`}
                    />
                  ))}
                  {dayBookings.length > 3 && (
                    <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white/40' : 'bg-zinc-300'}`} />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function BookingCalendar({ bookings, onStatusChange }: BookingCalendarProps) {
  const today = new Date()
  const todayKey = dateKey(today)

  const [anchorYear, setAnchorYear]   = useState(today.getFullYear())
  const [anchorMonth, setAnchorMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Group bookings by YYYY-MM-DD
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>()
    for (const b of bookings) {
      const d = new Date(b.startAt)
      const key = dateKey(d)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(b)
    }
    return map
  }, [bookings])

  function prevMonth() {
    if (anchorMonth === 0) { setAnchorMonth(11); setAnchorYear(y => y - 1) }
    else setAnchorMonth(m => m - 1)
  }

  function nextMonth() {
    if (anchorMonth === 11) { setAnchorMonth(0); setAnchorYear(y => y + 1) }
    else setAnchorMonth(m => m + 1)
  }

  const months = useMemo(() =>
    Array.from({ length: MONTHS_SHOWN }, (_, i) => {
      const m = (anchorMonth + i) % 12
      const y = anchorYear + Math.floor((anchorMonth + i) / 12)
      return { year: y, month: m }
    }),
    [anchorYear, anchorMonth]
  )

  const selectedBookings = selectedDate
    ? (bookingsByDate.get(selectedDate) ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime))
    : []

  // Header range label
  const first = months[0]
  const last  = months[MONTHS_SHOWN - 1]
  const rangeLabel = first.year === last.year
    ? `${MONTH_NAMES[first.month]} – ${MONTH_NAMES[last.month]} ${first.year}`
    : `${MONTH_NAMES[first.month]} ${first.year} – ${MONTH_NAMES[last.month]} ${last.year}`

  function formatSelectedDate(key: string) {
    const [y, m, d] = key.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  // Legend counts
  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length
  const pendingCount   = bookings.filter(b => b.status === 'PENDING').length

  return (
    <div className="space-y-5">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.95]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-zinc-700 min-w-[200px] text-center">{rangeLabel}</span>
          <button
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.95]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="hidden items-center gap-4 text-xs text-zinc-500 sm:flex">
          <span className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" /> {confirmedCount} confirmadas
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-400" /> {pendingCount} pendientes
          </span>
        </div>
      </div>

      {/* Three month grids */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {months.map(({ year, month }) => (
          <MonthGrid
            key={`${year}-${month}`}
            year={year}
            month={month}
            bookingsByDate={bookingsByDate}
            selectedDate={selectedDate}
            todayKey={todayKey}
            onSelect={setSelectedDate}
          />
        ))}
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-500" />
              <h3 className="font-semibold text-zinc-900 capitalize">
                {formatSelectedDate(selectedDate)}
              </h3>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-600">
                {selectedBookings.length} cita{selectedBookings.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedBookings.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-zinc-400">
              No hay citas para este día
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {selectedBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-4 px-6 py-4">
                  <div className={`h-12 w-1.5 shrink-0 rounded-full ${STATUS_DOT[b.status]}`} />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-600">
                    {b.customerName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 truncate">{b.customerName}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{b.startTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Scissors className="h-3 w-3" />{b.serviceName}
                      </span>
                      {b.staffName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />{b.staffName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[b.status]}`}>
                    {STATUS_LABELS[b.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
