import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Gift, Clock, Calendar, MapPin } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'
import { BonoPurchaseForm } from '@/components/bonos/bono-purchase-form'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const bono = await prisma.bono.findFirst({
    where: { id, active: true },
    select: { name: true, sessions: true, priceCents: true, center: { select: { name: true } } },
  })
  if (!bono) return { title: 'Bono no encontrado' }
  return {
    title: `${bono.name} — ${bono.center.name} | BellezaLocal`,
    description: `Compra el bono ${bono.name}: ${bono.sessions} sesiones por ${formatPrice(bono.priceCents)} en ${bono.center.name}.`,
  }
}

export default async function BonoPage({ params }: Props) {
  const { id } = await params

  const bono = await prisma.bono.findFirst({
    where: { id, active: true },
    include: {
      service: { select: { name: true } },
      center: { select: { id: true, name: true, slug: true, addressCity: true, coverImage: true, published: true } },
    },
  })

  if (!bono || !bono.center.published) notFound()

  const pricePerSession = Math.round(bono.priceCents / bono.sessions)

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-md px-4 py-3.5">
        <div className="mx-auto flex max-w-[640px] items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1.5 font-black text-zinc-900">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <span className="hidden sm:inline">BellezaLocal</span>
          </Link>
          <span className="mx-1 text-zinc-300">/</span>
          <Link href={`/centro/${bono.center.slug}`} className="max-w-[120px] truncate text-zinc-400 hover:text-zinc-700 transition-colors">
            {bono.center.name}
          </Link>
          <span className="mx-1 text-zinc-300">/</span>
          <span className="max-w-[120px] truncate font-semibold text-zinc-700">Bono</span>
        </div>
      </header>

      <div className="mx-auto max-w-[640px] px-4 py-8">
        <Link href={`/centro/${bono.center.slug}`} className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          ← Volver al centro
        </Link>

        {/* Bono hero card */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 to-beauty-50 p-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Gift className="h-7 w-7 text-primary-600" />
          </div>

          <h1 className="text-2xl font-black text-zinc-900">{bono.name}</h1>
          {bono.description && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{bono.description}</p>
          )}

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/70 p-3 text-center">
              <Gift className="mx-auto mb-1 h-4 w-4 text-primary-500" />
              <p className="text-lg font-black text-zinc-900">{bono.sessions}</p>
              <p className="text-[10px] text-zinc-500">sesiones</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 text-center">
              <Calendar className="mx-auto mb-1 h-4 w-4 text-primary-500" />
              <p className="text-lg font-black text-zinc-900">{bono.validityDays}</p>
              <p className="text-[10px] text-zinc-500">días validez</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 text-center">
              <Clock className="mx-auto mb-1 h-4 w-4 text-primary-500" />
              <p className="text-lg font-black text-zinc-900">{formatPrice(pricePerSession)}</p>
              <p className="text-[10px] text-zinc-500">por sesión</p>
            </div>
          </div>

          {bono.service && (
            <p className="mt-4 inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary-700">
              ✂ Válido para: {bono.service.name}
            </p>
          )}

          {/* Price + center */}
          <div className="mt-5 flex items-end justify-between">
            <p className="text-3xl font-black text-zinc-900">{formatPrice(bono.priceCents)}</p>
            <Link
              href={`/centro/${bono.center.slug}`}
              className="flex items-center gap-1.5 rounded-xl bg-white/70 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-white transition-colors"
            >
              {bono.center.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bono.center.coverImage} alt={bono.center.name} className="h-5 w-5 rounded-lg object-cover" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary-400" />
              )}
              <span className="max-w-[100px] truncate">{bono.center.name}</span>
              <MapPin className="h-3 w-3 text-zinc-400" />
              <span>{bono.center.addressCity}</span>
            </Link>
          </div>
        </div>

        {/* Purchase form (client component) */}
        <BonoPurchaseForm
          bonoId={bono.id}
          bonoName={bono.name}
          priceCents={bono.priceCents}
          centerName={bono.center.name}
        />
      </div>
    </div>
  )
}
