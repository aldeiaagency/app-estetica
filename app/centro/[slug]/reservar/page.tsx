import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { BookingWizard } from '@/components/booking/booking-wizard'

export const metadata: Metadata = {
  title: 'Reservar cita',
  robots: { index: false },
}

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ servicio?: string }>
}

export default async function ReservarPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { servicio } = await searchParams

  const center = await prisma.center.findUnique({
    where: { slug, published: true },
    select: {
      id: true,
      name: true,
      slug: true,
      services: {
        where: { active: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          priceCents: true,
          description: true,
        },
      },
    },
  })

  if (!center) notFound()

  if (center.services.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-slate-600">Este centro no tiene servicios disponibles todavía.</p>
          <Link href={`/centro/${slug}`} className="font-medium text-rose-600 hover:text-rose-700">
            ← Volver al centro
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[640px] items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-slate-900">
            <Sparkles className="h-4 w-4 text-rose-600" />
            BellezaLocal
          </Link>
          <span className="text-slate-300">/</span>
          <Link href={`/centro/${slug}`} className="text-slate-500 hover:text-slate-900">
            {center.name}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700">Reservar</span>
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
