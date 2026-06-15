import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, ShoppingBag, Ticket, Sparkles, MapPin, Clock } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Mi cuenta',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-700' },
  COMPLETED: { label: 'Completada', cls: 'bg-[#e5eaf2] text-[#46546b]' },
  CANCELLED: { label: 'Cancelada',  cls: 'bg-red-50 text-red-600' },
  NO_SHOW:   { label: 'No asistió',  cls: 'bg-red-50 text-red-600' },
}

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pendiente de pago', cls: 'bg-amber-50 text-amber-700' },
  PAID:      { label: 'Pagado',            cls: 'bg-emerald-50 text-emerald-700' },
  READY:     { label: 'Listo para recoger',cls: 'bg-[#e5edff] text-[#2355c8]' },
  COMPLETED: { label: 'Recogido',          cls: 'bg-[#e5eaf2] text-[#46546b]' },
  CONFIRMED: { label: 'Confirmado',        cls: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Cancelado',         cls: 'bg-red-50 text-red-600' },
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default async function CuentaPage() {
  const session = await auth()
  const email = session?.user?.email?.toLowerCase()
  if (!email) redirect('/auth/signin?callbackUrl=/cuenta')

  // Todo se filtra por el email del usuario autenticado: solo ve sus propios datos.
  const [bookings, orders, bonos] = await Promise.all([
    prisma.booking.findMany({
      where: { customer: { email } },
      include: {
        center:  { select: { name: true, slug: true, addressCity: true } },
        service: { select: { name: true } },
      },
      orderBy: { startAt: 'desc' },
      take: 50,
    }),
    prisma.order.findMany({
      where: { customerEmail: email },
      include: {
        center: { select: { name: true, slug: true } },
        items:  { select: { name: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.bonoInstance.findMany({
      where: { customer: { email } },
      include: {
        bono: { select: { name: true, center: { select: { name: true } } } },
      },
      orderBy: { purchasedAt: 'desc' },
      take: 50,
    }),
  ])

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Hola'

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <header className="sticky top-0 z-30 border-b border-[#d8dee9] bg-white/90 backdrop-blur-md px-4 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 font-black text-[#0c1324]">
            <Sparkles className="h-4 w-4 text-[#2f6df6]" />BellezaLocal
          </Link>
          <Link href="/auth/signout" className="text-sm text-[#8b96aa] hover:text-[#273244] transition-colors">
            Cerrar sesión
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-black tracking-tight text-[#0c1324]">{firstName}, esta es tu cuenta</h1>
        <p className="mt-1 text-sm text-[#647089]">Tus reservas, pedidos y bonos en un solo lugar.</p>

        {/* ── Reservas ── */}
        <Section icon={Calendar} title="Mis reservas" count={bookings.length}>
          {bookings.length === 0 ? (
            <Empty text="Aún no tienes reservas." cta={{ href: '/buscar', label: 'Buscar centros' }} />
          ) : (
            <div className="divide-y divide-[#eef2f7]">
              {bookings.map(b => {
                const st = BOOKING_STATUS[b.status] ?? { label: b.status, cls: 'bg-[#e5eaf2] text-[#46546b]' }
                return (
                  <div key={b.id} className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e5edff] text-[#2f6df6]">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#0c1324]">{b.service.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-[#647089]">
                        <MapPin className="h-3 w-3 shrink-0" />{b.center.name} · {b.center.addressCity}
                      </p>
                      <p className="mt-0.5 text-xs text-[#8b96aa]">{fmtDateTime(b.startAt)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* ── Pedidos ── */}
        <Section icon={ShoppingBag} title="Mis pedidos" count={orders.length}>
          {orders.length === 0 ? (
            <Empty text="Aún no tienes pedidos." cta={{ href: '/productos', label: 'Ver productos' }} />
          ) : (
            <div className="divide-y divide-[#eef2f7]">
              {orders.map(o => {
                const st = ORDER_STATUS[o.status] ?? { label: o.status, cls: 'bg-[#e5eaf2] text-[#46546b]' }
                const summary = o.items.map(i => `${i.quantity}× ${i.name}`).join(', ')
                return (
                  <div key={o.id} className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e7f7f5] text-[#10786f]">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#0c1324]">{o.center.name}</p>
                      <p className="truncate text-xs text-[#647089]">{summary}</p>
                      <p className="mt-0.5 text-xs text-[#8b96aa]">{fmtDate(o.createdAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-[#0c1324]">{formatPrice(o.totalCents)}</p>
                      <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* ── Bonos ── */}
        <Section icon={Ticket} title="Mis bonos" count={bonos.length}>
          {bonos.length === 0 ? (
            <Empty text="Aún no tienes bonos." />
          ) : (
            <div className="divide-y divide-[#eef2f7]">
              {bonos.map(bi => {
                const expired = bi.expiresAt && new Date(bi.expiresAt) < new Date()
                return (
                  <div key={bi.id} className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e5edff] text-[#2f6df6]">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#0c1324]">{bi.bono.name}</p>
                      <p className="truncate text-xs text-[#647089]">{bi.bono.center.name}</p>
                      <p className="mt-0.5 text-xs text-[#8b96aa]">
                        {bi.expiresAt ? `Caduca: ${fmtDate(bi.expiresAt)}` : 'Sin caducidad'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`font-bold ${expired ? 'text-red-500' : 'text-[#0c1324]'}`}>
                        {bi.sessionsRemaining} {bi.sessionsRemaining === 1 ? 'sesión' : 'sesiones'}
                      </p>
                      {expired && <span className="text-xs font-semibold text-red-500">Caducado</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, count, children }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section className="mt-8 rounded-lg border border-[#d8dee9] bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#8b96aa]" />
        <h2 className="font-bold text-[#0c1324]">{title}</h2>
        {count > 0 && <span className="rounded-full bg-[#e5eaf2] px-2 py-0.5 text-xs font-semibold text-[#647089]">{count}</span>}
      </div>
      {children}
    </section>
  )
}

function Empty({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-[#8b96aa]">{text}</p>
      {cta && (
        <Link href={cta.href} className="mt-3 inline-flex text-sm font-semibold text-[#2f6df6] hover:text-[#2355c8]">
          {cta.label} →
        </Link>
      )}
    </div>
  )
}
