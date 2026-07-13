import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Sparkles, Gift, Calendar, Clock, ShoppingBag } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'
import { auth } from '@/lib/auth/config'

export const metadata: Metadata = {
  title: 'Bono confirmado — BellezaLocal',
  robots: { index: false },
}

interface Props { params: Promise<{ id: string }> }

export default async function BonoConfirmadoPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const instance = await prisma.bonoInstance.findUnique({
    where: { id },
    include: {
      bono: {
        include: {
          service: { select: { name: true } },
          center:  { select: { name: true, slug: true, addressCity: true, phone: true } },
        },
      },
      customer: { select: { name: true, email: true, userId: true } },
    },
  })

  if (!instance || !session?.user?.id || instance.customer.userId !== session.user.id) notFound()

  const { bono, customer } = instance
  const purchaseDate = instance.purchasedAt.toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const expiryDate = instance.expiresAt
    ? instance.expiresAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const shortRef = instance.id.slice(-8).toUpperCase()

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <header className="border-b border-[#d8dee9] bg-white px-4 py-3.5">
        <div className="mx-auto max-w-[640px]">
          <Link href="/" className="flex items-center gap-1.5 font-black text-[#0c1324]">
            <Sparkles className="h-4 w-4 text-[#2f6df6]" />BellezaLocal
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[640px] px-4 py-12">
        {/* Success hero */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-[#0c1324]">¡Bono adquirido!</h1>
          <p className="mt-2 text-sm text-[#647089]">
            Confirmación enviada a <span className="font-semibold text-[#273244]">{customer.email}</span>
          </p>
          <p className="mt-1 text-xs text-[#8b96aa]">{purchaseDate}</p>
        </div>

        {/* Bono card */}
        <div className="mb-5 overflow-hidden rounded-lg border border-[#cfe0ff] bg-gradient-to-br from-[#e5edff] to-[#e7f7f5] p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
              <Gift className="h-6 w-6 text-[#2f6df6]" />
            </div>
            <div>
              <p className="font-black text-[#0c1324]">{bono.name}</p>
              <p className="text-sm text-[#647089]">{bono.center.name} · {bono.center.addressCity}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md bg-white/70 p-3 text-center">
              <Gift className="mx-auto mb-1 h-4 w-4 text-[#2f6df6]" />
              <p className="text-lg font-black text-[#0c1324]">{instance.sessionsRemaining}</p>
              <p className="text-[10px] text-[#647089]">sesiones</p>
            </div>
            <div className="rounded-md bg-white/70 p-3 text-center">
              <p className="mb-1 text-sm">💶</p>
              <p className="text-lg font-black text-[#0c1324]">{formatPrice(bono.priceCents)}</p>
              <p className="text-[10px] text-[#647089]">total</p>
            </div>
            {expiryDate && (
              <div className="col-span-2 rounded-md bg-white/70 p-3 text-center">
                <Calendar className="mx-auto mb-1 h-4 w-4 text-[#2f6df6]" />
                <p className="text-sm font-bold text-[#0c1324]">Válido hasta</p>
                <p className="text-xs text-[#647089]">{expiryDate}</p>
              </div>
            )}
          </div>

          {bono.service && (
            <p className="mt-3 inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#2355c8]">
              ✂ Para: {bono.service.name}
            </p>
          )}
        </div>

        {/* Reference */}
        <div className="mb-5 rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
          <h3 className="mb-1 font-bold text-[#0c1324]">Referencia del bono</h3>
          <p className="font-mono text-2xl font-black tracking-widest text-[#2f6df6]">{shortRef}</p>
          <p className="mt-1 text-xs text-[#8b96aa]">
            Muestra este código al centro para que registren el uso de cada sesión
          </p>
        </div>

        {/* What's next */}
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-1.5 font-bold text-amber-900">¿Cómo usar el bono?</h3>
          <ol className="space-y-1.5 text-sm text-amber-800">
            <li>1. Reserva tu cita en {bono.center.name} como siempre</li>
            <li>2. Al llegar, muestra el código de referencia <strong>{shortRef}</strong></li>
            <li>3. El profesional marcará la sesión como usada en su panel</li>
            {bono.center.phone && (
              <li>📞 Contacto: <a href={`tel:${bono.center.phone}`} className="font-semibold underline">{bono.center.phone}</a></li>
            )}
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/centro/${bono.center.slug}/reservar`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2f6df6] py-3 text-sm font-semibold text-white transition-all hover:bg-[#2355c8]"
          >
            <Clock className="h-4 w-4" />Reservar cita ahora
          </Link>
          <Link
            href={`/centro/${bono.center.slug}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#d8dee9] bg-white py-3 text-sm font-semibold text-[#273244] transition-colors hover:bg-[#f1f4f8]"
          >
            <ShoppingBag className="h-4 w-4" />Ver el centro
          </Link>
        </div>
      </div>
    </div>
  )
}
