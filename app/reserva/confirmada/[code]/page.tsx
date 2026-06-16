import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Calendar, CheckCircle2, Clock, Hourglass, MapPin, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { prisma } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'Estado de reserva',
  robots: { index: false },
}

interface Props {
  params: Promise<{ code: string }>
  searchParams: Promise<{ paid?: string }>
}

export default async function ConfirmadaPage({ params, searchParams }: Props) {
  const { code } = await params
  const paid = (await searchParams)?.paid === '1'

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

  const now = new Date()
  const isCancelled = booking.status === 'CANCELLED'
  const isCompleted = booking.status === 'COMPLETED'
  const isPendingDeposit = booking.status === 'PENDING' && Boolean(booking.depositCents) && !booking.depositPaid
  const isExpiredPending = isPendingDeposit && booking.depositExpiresAt && booking.depositExpiresAt < now
  const isConfirmed = booking.status === 'CONFIRMED'

  const status = getStatusMeta({
    isCancelled,
    isCompleted,
    isPendingDeposit,
    isExpiredPending: Boolean(isExpiredPending),
    isConfirmed,
    paid,
  })

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <header className="border-b border-[#d8dee9] bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[680px] items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5 font-black text-[#0c1324]">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2f6df6]">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            Belleza Local
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[680px] px-4 py-10">
        <div className="mb-6 text-center">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${status.badgeClass}`}>
            <status.icon className="h-4 w-4" />
            {status.badge}
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-[#0c1324]">{status.title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647089]">{status.description}</p>
        </div>

        <section className="card mb-6 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[#e5eaf2] px-5 py-4">
            <h2 className="font-black text-[#0c1324]">Detalles de tu cita</h2>
            <span className="rounded-md bg-[#f1f4f8] px-3 py-1.5 font-mono text-sm font-black tracking-wider text-[#0c1324]">
              {booking.confirmationCode}
            </span>
          </div>

          <div className="divide-y divide-[#e5eaf2]">
            <DetailRow icon={MapPin}>
              <p className="font-bold text-[#0c1324]">{booking.center.name}</p>
              {booking.center.addressStreet && <p className="text-sm text-[#647089]">{booking.center.addressStreet}</p>}
              <p className="text-sm text-[#647089]">{booking.center.addressCity}</p>
              {booking.center.phone && (
                <a href={`tel:${booking.center.phone}`} className="text-sm font-bold text-[#2355c8] hover:text-[#2f6df6]">
                  {booking.center.phone}
                </a>
              )}
            </DetailRow>

            <DetailRow icon={Calendar}>
              <p className="font-bold capitalize text-[#0c1324]">{fmtDate(booking.startAt)}</p>
              <p className="text-sm text-[#647089]">{fmtTime(booking.startAt)} - {fmtTime(booking.endAt)}</p>
            </DetailRow>

            <DetailRow icon={Clock}>
              <p className="font-bold text-[#0c1324]">{booking.service.name}</p>
              <p className="text-sm text-[#647089]">
                {fmtDuration(booking.service.durationMinutes)} · {fmtPrice(booking.service.priceCents)}
              </p>
              {booking.staff && (
                <p className="text-sm text-[#647089]">
                  Profesional: {booking.staff.name}{booking.staff.role ? ` · ${booking.staff.role}` : ''}
                </p>
              )}
            </DetailRow>

            {booking.depositCents && (
              <DetailRow icon={ShieldCheck}>
                <p className="font-bold text-[#0c1324]">Senal online</p>
                <p className="text-sm text-[#647089]">
                  {fmtPrice(booking.depositCents)} · {booking.depositPaid ? 'Pagada' : isExpiredPending ? 'Caducada' : 'Pendiente'}
                </p>
              </DetailRow>
            )}

            <div className="px-5 py-4 text-sm text-[#647089]">
              {isPendingDeposit
                ? 'La confirmacion definitiva se enviara por email cuando el pago quede validado.'
                : <>Confirmacion enviada a <span className="font-bold text-[#0c1324]">{booking.customer.email}</span></>}
            </div>
          </div>
        </section>

        {!isCancelled && !isCompleted && (
          <section className={`mb-6 rounded-lg border p-5 ${status.panelClass}`}>
            <h2 className="mb-2 font-black text-[#0c1324]">{status.nextTitle}</h2>
            <ul className="space-y-1.5 text-sm leading-6 text-[#647089]">
              {status.nextSteps.map(step => <li key={step}>{step}</li>)}
            </ul>
          </section>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {!isCancelled && !isCompleted && !isPendingDeposit && (
            <Link
              href={`/reserva/gestionar?code=${booking.confirmationCode}`}
              className="btn-outline flex-1"
            >
              Gestionar / cancelar
            </Link>
          )}
          <Link href={`/centro/${booking.center.slug}`} className="btn-primary flex-1">
            Ver el centro <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}

function DetailRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#8b96aa]" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function getStatusMeta({
  isCancelled,
  isCompleted,
  isPendingDeposit,
  isExpiredPending,
  isConfirmed,
  paid,
}: {
  isCancelled: boolean
  isCompleted: boolean
  isPendingDeposit: boolean
  isExpiredPending: boolean
  isConfirmed: boolean
  paid: boolean
}) {
  if (isCancelled) {
    return {
      icon: AlertCircle,
      badge: 'Reserva cancelada',
      badgeClass: 'bg-red-50 text-red-700',
      title: 'Esta reserva esta cancelada',
      description: 'El hueco ya no esta reservado. Puedes volver al centro para elegir otra fecha disponible.',
      panelClass: 'border-red-100 bg-red-50',
      nextTitle: 'Estado',
      nextSteps: ['La reserva no generara recordatorios.', 'Si necesitas otra cita, vuelve a reservar desde el perfil del centro.'],
    }
  }

  if (isCompleted) {
    return {
      icon: CheckCircle2,
      badge: 'Servicio completado',
      badgeClass: 'bg-zinc-100 text-zinc-700',
      title: 'Servicio completado',
      description: 'La cita ya aparece como finalizada en el centro.',
      panelClass: 'border-zinc-200 bg-white',
      nextTitle: 'Estado',
      nextSteps: ['Gracias por usar Belleza Local.'],
    }
  }

  if (isExpiredPending) {
    return {
      icon: AlertCircle,
      badge: 'Senal caducada',
      badgeClass: 'bg-amber-50 text-amber-700',
      title: 'La reserva no quedo confirmada',
      description: 'El plazo de pago de la senal ha terminado. El hueco puede volver a estar disponible.',
      panelClass: 'border-amber-100 bg-amber-50',
      nextTitle: 'Que hacer ahora',
      nextSteps: ['Vuelve al centro y elige de nuevo el servicio y horario.', 'Si acabas de pagar, espera unos segundos y actualiza esta pagina.'],
    }
  }

  if (isPendingDeposit) {
    return {
      icon: Hourglass,
      badge: paid ? 'Pago validandose' : 'Pendiente de senal',
      badgeClass: 'bg-amber-50 text-amber-700',
      title: paid ? 'Estamos confirmando el pago' : 'Tu cita esta pendiente de pago',
      description: paid
        ? 'Stripe ha devuelto el pago a la app y el sistema esta esperando la confirmacion final del webhook.'
        : 'Para bloquear definitivamente el horario hay que completar el pago seguro de la senal.',
      panelClass: 'border-amber-100 bg-amber-50',
      nextTitle: 'Que hacer ahora',
      nextSteps: paid
        ? ['Actualiza esta pagina en unos segundos.', 'Recibiras el email de confirmacion cuando el pago quede validado.']
        : ['Completa el pago desde la ventana segura de Stripe.', 'Si cancelaste el pago, vuelve a iniciar la reserva.'],
    }
  }

  return {
    icon: CheckCircle2,
    badge: isConfirmed ? 'Reserva confirmada' : 'Reserva recibida',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    title: 'Reserva confirmada',
    description: 'Tu cita esta guardada y el centro ya tiene los datos necesarios para atenderte.',
    panelClass: 'border-[#cfe0ff] bg-[#edf3ff]',
    nextTitle: 'Que hacer ahora',
    nextSteps: ['Recibiras un email de confirmacion con estos datos.', 'El centro puede enviarte recordatorio antes de tu cita.', 'Si necesitas cancelar, hazlo con al menos 24h de antelacion.'],
  }
}
