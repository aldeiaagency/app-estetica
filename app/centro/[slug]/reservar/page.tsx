import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { BookingWizard } from '@/components/booking/booking-wizard'

export const metadata: Metadata = {
  title: 'Reservar cita',
  robots: { index: false },
}

interface Props {
  params:       Promise<{ slug: string }>
  searchParams: Promise<{ servicio?: string }>
}

export default async function ReservarPage({ params, searchParams }: Props) {
  const { slug }     = await params
  const { servicio } = await searchParams

  const center = await prisma.center.findUnique({
    where: { slug, published: true },
    select: {
      id:   true,
      name: true,
      slug: true,
      services: {
        where:   { active: true },
        orderBy: { order: 'asc' },
        select: {
          id:              true,
          name:            true,
          durationMinutes: true,
          priceCents:      true,
          description:     true,
        },
      },
    },
  })

  if (!center) notFound()

  if (center.services.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="border-b border-zinc-200 bg-white px-4 py-3.5">
          <div className="mx-auto flex max-w-[640px] items-center gap-2 text-sm">
            <Link href="/" className="flex items-center gap-1.5 font-black text-zinc-900">
              <Sparkles className="h-4 w-4 text-primary-600" />
              BellezaLocal
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-300" />
            <Link href={`/centro/${slug}`} className="text-zinc-400 hover:text-zinc-700 transition-colors">{center.name}</Link>
            <ChevronRight className="h-3 w-3 text-zinc-300" />
            <span className="text-zinc-700">Reservar</span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-4">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
              <Sparkles className="h-7 w-7 text-zinc-400" />
            </div>
            <p className="font-semibold text-zinc-700">Este centro no tiene servicios disponibles todavía.</p>
            <Link href={`/centro/${slug}`} className="mt-4 inline-block font-medium text-primary-600 hover:text-primary-700">
              ← Volver al centro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-md px-4 py-3.5">
        <div className="mx-auto flex max-w-[640px] items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1.5 font-black text-zinc-900">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <span className="hidden sm:inline">BellezaLocal</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-zinc-300" />
          <Link href={`/centro/${slug}`} className="max-w-[140px] truncate text-zinc-400 hover:text-zinc-700 transition-colors">
            {center.name}
          </Link>
          <ChevronRight className="h-3 w-3 text-zinc-300" />
          <span className="font-semibold text-zinc-700">Reservar</span>
        </div>
      </header>

      <div className="mx-auto max-w-[640px] px-4 py-8">
        <BookingWizard
          centerId={center.id}
          centerSlug={center.slug}
          centerName={center.name}
          services={center.services}
          preSelectedServiceId={servicio}
        />
      </div>
    </div>
  )
}
