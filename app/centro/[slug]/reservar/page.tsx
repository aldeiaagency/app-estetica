import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Sparkles } from 'lucide-react'
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
      <div className="flex min-h-screen flex-col bg-[#f1f4f8]">
        <BookingHeader slug={slug} centerName={center.name} />
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-[#e5edff]">
              <Sparkles className="h-7 w-7 text-[#2f6df6]" />
            </div>
            <p className="font-bold text-[#0c1324]">Este centro no tiene servicios disponibles todavia.</p>
            <Link href={`/centro/${slug}`} className="mt-4 inline-block font-bold text-[#2355c8] hover:text-[#2f6df6]">
              Volver al centro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <BookingHeader slug={slug} centerName={center.name} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <BookingWizard
          centerId={center.id}
          centerSlug={center.slug}
          centerName={center.name}
          services={center.services}
          preSelectedServiceId={servicio}
        />
      </main>
    </div>
  )
}

function BookingHeader({ slug, centerName }: { slug: string; centerName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#d8dee9] bg-[#f1f4f8]/92 px-4 py-3.5 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 text-sm">
        <Link href="/" className="flex items-center gap-1.5 font-black text-[#0c1324]">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2f6df6]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="hidden sm:inline">Belleza Local</span>
        </Link>
        <ChevronRight className="h-3 w-3 text-[#8b96aa]" />
        <Link href={`/centro/${slug}`} className="max-w-[180px] truncate text-[#647089] transition-colors hover:text-[#0c1324]">
          {centerName}
        </Link>
        <ChevronRight className="h-3 w-3 text-[#8b96aa]" />
        <span className="font-bold text-[#0c1324]">Reservar</span>
      </div>
    </header>
  )
}
