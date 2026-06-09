'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Calendar, Clock, User, Scissors } from 'lucide-react'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

export interface CalendarBooking {
  id: string
  startAt: string
  startTime: string   // "HH:mm" Europe/Madrid
  status: BookingStatus
  customerName: string
  serviceName: string
  staffName?: string | null
}

interface BookingCalendarProps {
  bookings: CalendarBooking[]
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Full names for screen readers / month headers
const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const STATUS_PILL: Record<BookingStatus, string> = {
  CONFIRMED: 'bg-emerald-500 text-white',
  PENDING:   'bg-amber-400 text-white',
  CANCELLED: 'bg-zinc-200 text-zinc-500 line-through',
  COMPLETED: 'bg-zinc-400 text-white',
  NO_SHOW:   'bg-orange-400 text-white',
}

const STATUS_DOT: Record<BookingStatus, string> = {
  CONFIRMED: 'bg-emerald-500',
  PENDING:   'bg-amber-400',
  CANCELLED: 'bg-zinc-300',
  COMPLETED: 'bg-zinc-400',
  NO_SHOW:   'bg-orange-400',
}

const STATUS_BADGE: Record<BookingStatus, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  COMPLETED: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  NO_SHOW:   'bg-orange-50 text-orange-700 border-orange-200',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: 'Confirmada',
  PENDING:   'Pendiente',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  NO_SHOW:   'No se presentó',
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Monday = 0, Sunday = 6
function getFirstDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

function addMonths(year: number, month: number, delta: number) {
  const total = month + delta
  const m = ((total % 12) + 12) % 12
  const y = year + Math.floor(total / 12)
  return { year: y, month: m }
}

// ─── Tab: mini overview for 1 month ────────────────────────────────────────
interface MonthTabProps {
  year: number
  month: number
  count: number
  active: boolean
  onClick: () => void
}

function MonthTab({ year, month, count, active, onClick }: MonthTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl border px-3 py-3 text-center transition-all ${
        active
          ? 'border-primary-200 bg-primary-50 shadow-sm'
          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
      }`}
    >
      <span className={`text-[11px] font-bold uppercase tracking-wider ${active ? 'text-primary-600' : 'text-zinc-400'}`}>
        {MONTH_NAMES_SHORT[month]}
      </span>
      <span className={`text-lg font-black leading-none ${active ? 'text-primary-700' : 'text-zinc-700'}`}>
        {year}
      </span>
      <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        count > 0
          ? active ? 'bg-primary-600 text-white' : 'bg-zinc-100 text-zinc-500'
          : 'bg-zinc-50 text-zinc-300'
      }`}>
        {count} cita{count !== 1 ? 's' : ''}
      </span>
    </button>
  )
}

// ─── Full month Google-Calendar-style grid ──────────────────────────────────
interface FullMonthGridProps {
  year: number
  month: number
  bookingsByDate: Map<string, CalendarBooking[]>
  selectedDate: string | null
  todayKey: string
  onSelect: (key: string) => void
}

const MAX_PILLS_VISIBLE = 3

function FullMonthGrid({ year, month, bookingsByDate, selectedDate, todayKey, onSelect }: FullMonthGridProps) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2.5 text-center text-xs font-bold uppercase tracking-wider text-zinc-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={idx}
                className="min-h-[100px] border-b border-r border-zinc-100 bg-zinc-50/40 last:border-r-0"
              />
            )
          }

          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayBookings = (bookingsByDate.get(key) ?? [])
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
          const activeBookings = dayBookings.filter(b => b.status !== 'CANCELLED')
          const isToday = key === todayKey
          const isSelected = key === selectedDate
          const overflow = Math.max(0, activeBookings.length - MAX_PILLS_VISIBLE)

          return (
            <button
              key={idx}
              onClick={() => onSelect(key)}
              className={`group relative flex min-h-[100px] flex-col gap-0.5 border-b border-r border-zinc-100 p-1.5 text-left transition-colors last:border-r-0 ${
                isSelected
                  ? 'bg-primary-50/80'
                  : 'hover:bg-zinc-50/70'
              }`}
            >
              {/* Day number */}
              <div className="flex justify-end">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                  isToday
                    ? 'bg-primary-600 text-white'
                    : isSelected
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-zinc-500 group-hover:bg-zinc-100'
                }`}>
                  {day}
                </span>
              </div>

              {/* Event pills */}
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {activeBookings.slice(0, MAX_PILLS_VISIBLE).map((b, i) => (
                  <div
                    key={i}
                    className={`w-full truncate rounded-[5px] px-1.5 py-[2px] text-[10px] font-semibold leading-snug ${STATUS_PILL[b.status]}`}
                    title={`${b.startTime} · ${b.customerName} · ${b.serviceName}`}
                  >
                    <span className="hidden sm:inline">{b.startTime} </span>
                    <span className="truncate">{b.customerName}</span>
                  </div>
                ))}

                {overflow > 0 && (
                  <span className="pl-1 text-[9px] font-semibold text-zinc-400">
                    +{overflow} más
                  </span>
                )}

                {/* Cancelled bookings: shown as dots only */}
                {dayBookings.filter(b => b.status === 'CANCELLED').length > 0 && activeBookings.length === 0 && (
                  <div className="flex gap-0.5 pt-0.5">
                    {dayBookings.filter(b => b.status === 'CANCELLED').slice(0, 3).map((b, i) => (
                      <div key={i} className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[b.status]}`} />
                    ))}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Selected day detail panel ─────────────────────────────────────────────
interface DayPanelProps {
  dateKey: string
  bookings: CalendarBooking[]
  onClose: () => void
}

function DayPanel({ dateKey: dk, bookings, onClose }: DayPanelProps) {
  const [y, m, d] = dk.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const sorted = [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary-500" />
          <h3 className="font-semibold text-zinc-900 capitalize">{label}</h3>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-600">
            {sorted.length} cita{sorted.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-zinc-400">No hay citas para este día</div>
      ) : (
        <div className="divide-y divide-zinc-50">
          {sorted.map((b) => (
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
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const today = new Date()
  const todayKey = dateKey(today)

  const [anchorMonth, setAnchorMonth] = useState(today.getMonth())
  const [anchorYear, setAnchorYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth]     = useState(today.getMonth())
  const [viewYear, setViewYear]       = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>()
    for (const b of bookings) {
      const k = dateKey(new Date(b.startAt))
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(b)
    }
    return map
  }, [bookings])

  // Count bookings per month (for tabs)
  function countForMonth(y: number, m: number) {
    return bookings.filter(b => {
      const d = new Date(b.startAt)
      return d.getMonth() === m && d.getFullYear() === y
    }).length
  }

  // 3 tabs starting from anchorMonth
  const tabs = [0, 1, 2].map(i => {
    const { year, month } = addMonths(anchorYear, anchorMonth, i)
    return { year, month, count: countForMonth(year, month) }
  })

  function prevAnchor() {
    const { year, month } = addMonths(anchorYear, anchorMonth, -1)
    setAnchorYear(year)
    setAnchorMonth(month)
  }

  function nextAnchor() {
    const { year, month } = addMonths(anchorYear, anchorMonth, 1)
    setAnchorYear(year)
    setAnchorMonth(month)
  }

  function selectTab(year: number, month: number) {
    setViewYear(year)
    setViewMonth(month)
    setSelectedDate(null)
  }

  function handleDaySelect(key: string) {
    setSelectedDate(prev => prev === key ? null : key)
  }

  const selectedBookings = selectedDate
    ? (bookingsByDate.get(selectedDate) ?? [])
    : []

  const tabContainsView = tabs.some(t => t.year === viewYear && t.month === viewMonth)

  return (
    <div className="space-y-4">
      {/* 3-month tab selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={prevAnchor}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.95]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-1 gap-2">
          {tabs.map(tab => (
            <MonthTab
              key={`${tab.year}-${tab.month}`}
              year={tab.year}
              month={tab.month}
              count={tab.count}
              active={tab.year === viewYear && tab.month === viewMonth}
              onClick={() => selectTab(tab.year, tab.month)}
            />
          ))}
        </div>

        <button
          onClick={nextAnchor}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.95]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        {([['CONFIRMED','bg-emerald-500','Confirmadas'],['PENDING','bg-amber-400','Pendientes'],['COMPLETED','bg-zinc-400','Completadas'],['NO_SHOW','bg-orange-400','No-show']] as const).map(([, cls, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <div className={`h-2 w-4 rounded-sm ${cls}`} /> {label}
          </span>
        ))}
      </div>

      {/* Full month calendar */}
      <FullMonthGrid
        year={viewYear}
        month={viewMonth}
        bookingsByDate={bookingsByDate}
        selectedDate={selectedDate}
        todayKey={todayKey}
        onSelect={handleDaySelect}
      />

      {/* Month name header */}
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-500">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </p>
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <DayPanel
          dateKey={selectedDate}
          bookings={selectedBookings}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
