import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CalendarPlus, CheckCircle2, Clock, Repeat2, ShieldCheck, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getRebookingOpportunities, scheduleFollowUpForBookingAction } from '@/app/actions/follow-ups'

export default async function RecurrenciaPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId }, select: { id: true } })
  if (!center) redirect('/dashboard/configuracion')

  const [opportunities, completedThisMonth, recurringCustomers] = await Promise.all([
    getRebookingOpportunities(orgId, 30),
    prisma.booking.count({
      where: {
        centerId: center.id,
        status: 'COMPLETED',
        startAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.customer.count({
      where: {
        centerId: center.id,
        bookings: { some: { status: 'COMPLETED' } },
      },
    }),
  ])

  const pending = opportunities.filter(opportunity => !opportunity.hasScheduledFollowUp)
  const withConsent = opportunities.filter(opportunity => opportunity.marketingConsent)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Recurrencia</h1>
          <p className="mt-1 text-sm text-zinc-500">Detecta clientas que ya tuvieron una visita y no tienen la siguiente cita programada.</p>
        </div>
        <Link href="/dashboard/seguimientos" className="btn-outline py-2 text-xs">
          Ver seguimientos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Repeat2} label="Oportunidades" value={opportunities.length} />
        <MetricCard icon={Clock} label="Sin seguimiento" value={pending.length} />
        <MetricCard icon={Users} label="Clientas recurrentes potenciales" value={recurringCustomers} />
        <MetricCard icon={ShieldCheck} label="Con opt-in marketing" value={withConsent.length} />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-zinc-900">Oportunidades de repeticion</h2>
              <p className="mt-1 text-xs text-zinc-500">{completedThisMonth} servicios completados este mes.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Sin proxima cita activa</span>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Repeat2 className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
            <p className="font-bold text-zinc-700">Aun no hay oportunidades detectadas</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-zinc-400">
              Apareceran cuando haya reservas completadas sin una proxima reserva pendiente o confirmada.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {opportunities.map(opportunity => (
              <article key={opportunity.lastBookingId} className="px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-black text-zinc-700">
                        {opportunity.daysSince} dias desde la ultima visita
                      </span>
                      {opportunity.hasScheduledFollowUp ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Seguimiento programado
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">Pendiente</span>
                      )}
                      {opportunity.marketingConsent && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">Opt-in marketing</span>
                      )}
                    </div>
                    <h3 className="mt-3 font-black text-zinc-900">{opportunity.customerName}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{opportunity.customerEmail}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      Ultimo servicio: <strong className="text-zinc-900">{opportunity.serviceName}</strong> el {formatDate(opportunity.lastVisitAt, { day: 'numeric', month: 'short', year: 'numeric' })}. Historial: {opportunity.bookingCount} visita{opportunity.bookingCount === 1 ? '' : 's'} completada{opportunity.bookingCount === 1 ? '' : 's'}.
                    </p>
                  </div>

                  <form action={async () => {
                    'use server'
                    await scheduleFollowUpForBookingAction(opportunity.lastBookingId)
                  }}>
                    <button type="submit" className="btn-primary py-2 text-xs" disabled={opportunity.hasScheduledFollowUp}>
                      <CalendarPlus className="h-4 w-4" />
                      Programar seguimiento
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Repeat2; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-black tracking-tight text-zinc-900">{value}</p>
      <p className="mt-1 text-sm font-bold text-zinc-600">{label}</p>
    </div>
  )
}
