import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CalendarCheck, Gift, PiggyBank, ShoppingBag, Sparkles, Ticket } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'
import { getBeautyProfile } from '@/app/actions/beauty-profile'
import { getOrCreateMonthlyBeautyPlan } from '@/app/actions/beauty-plan'
import { ensureStarterBenefitsAction, getAvailableBenefits } from '@/app/actions/benefits'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'
import { BenefitCard } from '@/components/beauty/benefit-card'
import { WalletSummaryCard } from '@/components/beauty/wallet-summary-card'

export const metadata: Metadata = {
  title: 'Beauty Wallet - Belleza Local',
  description: 'Tus beneficios, bonos, pedidos y plan de belleza en un solo lugar.',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function WalletPage() {
  const session = await auth()
  const userId = session?.user?.id
  const email = session?.user?.email?.toLowerCase()
  if (!userId || !email) redirect('/auth/signin?callbackUrl=/wallet')

  const profile = await getBeautyProfile(userId)

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f1f4f8]">
        <PublicHeader />
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-[#d8dee9] bg-white p-8 text-center shadow-[0_24px_70px_rgba(12,19,36,0.08)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#e5edff] text-[#2355c8]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-[#0c1324]">Tu wallet empieza con tu perfil</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#647089]">
              Completa tu Beauty Profile para activar recomendaciones, beneficios y valor acumulado.
            </p>
            <Link href="/diagnostico" className="btn-primary mt-6 inline-flex">
              Crear mi Beauty Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    )
  }

  await ensureStarterBenefitsAction()

  const [plan, benefits, bonos, orders, bookings] = await Promise.all([
    getOrCreateMonthlyBeautyPlan(userId),
    getAvailableBenefits(profile.id, 9),
    prisma.bonoInstance.findMany({
      where: { customer: { email } },
      include: {
        bono: { select: { name: true, center: { select: { name: true } } } },
      },
      orderBy: { purchasedAt: 'desc' },
      take: 6,
    }),
    prisma.order.findMany({
      where: { customerEmail: email },
      include: { items: { select: { name: true, quantity: true } }, center: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.booking.findMany({
      where: { customer: { email }, status: { in: ['PENDING', 'CONFIRMED'] } },
      include: {
        center: { select: { name: true, slug: true } },
        service: { select: { name: true } },
      },
      orderBy: { startAt: 'asc' },
      take: 4,
    }),
  ])

  const claimedBenefits = benefits.filter(benefit => benefit.userBenefitStatus === 'CLAIMED' || benefit.userBenefitStatus === 'ACTIVE')
  const doneItems = plan?.items.filter(item => item.status === 'DONE').length ?? 0
  const pendingItems = plan?.items.filter(item => item.status === 'PENDING' && item.type !== 'AVOID').length ?? 0
  const estimatedSaving = claimedBenefits.length * 1000
  const firstName = session.user.name?.split(' ')[0] ?? 'Hola'

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <PublicHeader />

      <main>
        <section className="border-b border-[#d8dee9] bg-[#0c1324] text-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-white/64">{firstName}, este es tu club</p>
                <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Beauty Wallet</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
                  Beneficios, bonos, compras y próximas acciones para que tu plan no se pierda entre reservas sueltas.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
                <p className="text-sm font-black text-white">Nivel actual</p>
                <p className="mt-2 text-3xl font-black text-white">Club</p>
                <p className="mt-2 text-sm leading-6 text-white/64">
                  Beneficios activos por completar tu perfil y usar tu plan mensual.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <WalletSummaryCard
              icon={Gift}
              label="Beneficios"
              value={claimedBenefits.length}
              detail="Guardados o activos en tu wallet."
            />
            <WalletSummaryCard
              icon={Ticket}
              label="Bonos"
              value={bonos.length}
              detail="Bonos comprados vinculados a tu email."
            />
            <WalletSummaryCard
              icon={CalendarCheck}
              label="Plan"
              value={`${doneItems}/${Math.max(doneItems + pendingItems, 1)}`}
              detail="Acciones completadas frente a recomendaciones activas."
            />
            <WalletSummaryCard
              icon={PiggyBank}
              label="Valor estimado"
              value={formatPrice(estimatedSaving)}
              detail="Estimación orientativa de beneficios guardados."
            />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              <section>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Club</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0c1324]">Beneficios para ti</h2>
                  </div>
                  <Link href="/mi-plan" className="inline-flex items-center gap-2 text-sm font-black text-[#2355c8]">
                    Ver mi plan
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                {benefits.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {benefits.map(benefit => (
                      <BenefitCard key={benefit.id} benefit={benefit} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Aún no hay beneficios activos" text="En la siguiente tanda los centros podrán publicar ventajas propias." />
                )}
              </section>

              <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Plan mensual</p>
                    <h2 className="mt-1 text-xl font-black text-[#0c1324]">{plan?.title ?? 'Sin plan activo'}</h2>
                  </div>
                  <Link href="/mi-plan" className="btn-outline">
                    Abrir plan
                  </Link>
                </div>
                <div className="mt-5 divide-y divide-[#e5eaf2]">
                  {(plan?.items ?? []).slice(0, 6).map(item => (
                    <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                      <div>
                        <p className="font-bold text-[#0c1324]">{item.title}</p>
                        {item.reason && <p className="mt-0.5 line-clamp-2 text-sm text-[#647089]">{item.reason}</p>}
                      </div>
                      <span className="shrink-0 rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs font-bold text-[#647089]">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-[#2355c8]" />
                  <h2 className="font-black text-[#0c1324]">Bonos activos</h2>
                </div>
                {bonos.length > 0 ? (
                  <div className="mt-4 divide-y divide-[#e5eaf2]">
                    {bonos.map(bono => (
                      <div key={bono.id} className="py-3">
                        <p className="font-bold text-[#0c1324]">{bono.bono.name}</p>
                        <p className="mt-0.5 text-xs text-[#647089]">{bono.bono.center.name}</p>
                        <p className="mt-1 text-xs font-bold text-[#2355c8]">
                          {bono.sessionsRemaining} sesiones restantes
                          {bono.expiresAt ? ` · caduca ${fmtDate(bono.expiresAt)}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Sin bonos todavía" text="Cuando compres packs o bonos, aparecerán aquí." compact />
                )}
              </section>

              <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[#2355c8]" />
                  <h2 className="font-black text-[#0c1324]">Compras recientes</h2>
                </div>
                {orders.length > 0 ? (
                  <div className="mt-4 divide-y divide-[#e5eaf2]">
                    {orders.map(order => (
                      <div key={order.id} className="py-3">
                        <p className="font-bold text-[#0c1324]">{formatPrice(order.totalCents)}</p>
                        <p className="mt-0.5 text-xs text-[#647089]">{order.center.name} · {fmtDate(order.createdAt)}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-[#647089]">
                          {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Sin compras" text="Tus productos y reposiciones aparecerán aquí." compact />
                )}
              </section>

              <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-[#2355c8]" />
                  <h2 className="font-black text-[#0c1324]">Próximas citas</h2>
                </div>
                {bookings.length > 0 ? (
                  <div className="mt-4 divide-y divide-[#e5eaf2]">
                    {bookings.map(booking => (
                      <Link key={booking.id} href={`/centro/${booking.center.slug}`} className="block py-3">
                        <p className="font-bold text-[#0c1324]">{booking.service.name}</p>
                        <p className="mt-0.5 text-xs text-[#647089]">{booking.center.name} · {fmtDate(booking.startAt)}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Sin citas próximas" text="Reserva desde tu plan cuando tengas clara la acción principal." compact />
                )}
              </section>
            </aside>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

function EmptyState({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) {
  return (
    <div className={compact ? 'py-5 text-sm' : 'rounded-lg border border-dashed border-[#d8dee9] bg-white px-6 py-12 text-center'}>
      <p className="font-bold text-[#0c1324]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#647089]">{text}</p>
    </div>
  )
}
