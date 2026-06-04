import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Calendar, Clock, MapPin, Sparkles, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'Reserva confirmada',
  robots: { index: false },
}

interface Props {
  params: Promise<{ code: string }>
}

export default async function ConfirmadaPage({ params }: Props) {
  const { code } = await params

  const booking = await prisma.booking.findUnique({
    where: { confirmationCode: code },
    include: {
      center: { select: { name: true, slug: true, addressCity: true, addressStreet: true, phone: true } },
      service: { select: { name: true, durationMinutes: true, priceCents: true } },
      staff: { select: { name: true, role: true } },
      customer: { select: { name: true, email: true } },
    },
  })

  if (!booking) notFound()

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  const fmtPrice = (cents: number) =>
    (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

  const fmtDuration = (min: number) => {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  const isCancelled = booking.status === 'CANCELLED'
  const isCompleted = booking.status === 'COMPLETED'

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
        {/* Status badge */}
        <div className="mb-6 text-center">
          {isCancelled ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
              Reserva cancelada
            </div>
          ) : isCompleted ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              Servicio completado
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Reserva confirmada
            </div>
          )}
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">Detalles de tu cita</h1>
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm font-bold tracking-wider text-slate-700">
              {booking.confirmationCode}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="flex items-start gap-3 pb-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">{booking.center.name}</p>
                {booking.center.addressStreet && (
                  <p className="text-sm text-slate-500">{booking.center.addressStreet}</p>
                )}
                <p className="text-sm text-slate-500">{booking.center.addressCity}</p>
                {booking.center.phone && (
                  <a href={`tel:${booking.center.phone}`} className="text-sm text-rose-600 hover:text-rose-700">
                    {booking.center.phone}
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 py-4">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900 capitalize">{fmtDate(booking.startAt)}</p>
                <p className="text-sm text-slate-500">
                  {fmtTime(booking.startAt)} – {fmtTime(booking.endAt)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-4">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">{booking.service.name}</p>
                <p className="text-sm text-slate-500">
                  {fmtDuration(booking.service.durationMinutes)} · {fmtPrice(booking.service.priceCents)}
                </p>
                {booking.staff && (
                  <p className="text-sm text-slate-500">
                    Profesional: {booking.staff.name}
                    {booking.staff.role && ` · ${booking.staff.role}`}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 text-sm text-slate-500">
              Confirmación enviada a <span className="font-medium text-slate-700">{booking.customer.email}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!isCancelled && !isCompleted && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="mb-2 font-semibold text-slate-900">Qué hacer ahora</h2>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li>• Recibirás un email de confirmación con estos datos</li>
              <li>• El centro puede enviarte recordatorio antes de tu cita</li>
              <li>• Si necesitas cancelar, hazlo con al menos 24h de antelación</li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {!isCancelled && !isCompleted && (
            <Link
              href={`/reserva/gestionar?code=${booking.confirmationCode}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Gestionar / cancelar
            </Link>
          )}
          <Link
            href={`/centro/${booking.center.slug}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
          >
            Ver el centro <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
