import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // TODO: fetch center from DB
  // const center = await getCenterBySlug(params.slug)
  // if (!center) return {}

  return {
    title: `Centro de belleza — ${params.slug}`,
    description: 'Reserva tu cita online. Disponibilidad real.',
  }
}

export default async function CenterPage({ params }: Props) {
  // TODO: fetch center from DB
  // const center = await getCenterBySlug(params.slug)
  // if (!center || !center.published) notFound()

  return (
    <div className="min-h-screen bg-[#fffaf7]">
      {/* Header de ficha */}
      <div className="border-b border-[#eadfdc] bg-white">
        <div className="mx-auto max-w-[1180px] px-4 py-6">
          <Link href="/buscar" className="mb-4 flex items-center gap-2 text-sm text-[#756b6b] hover:text-[#211b1c]">
            ← Volver a resultados
          </Link>

          {/* Cover image placeholder */}
          <div className="mb-6 h-64 w-full rounded-2xl bg-[#f6ebe7] md:h-80" />

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Nombre del Centro</h1>
              <p className="mt-1 text-[#756b6b]">📍 Ciudad · Categoría</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-bold text-[#9d5c63]">★ 4.8</span>
                <span className="text-sm text-[#756b6b]">(47 reseñas)</span>
              </div>
            </div>

            <Link
              href={`/centro/${params.slug}/reservar`}
              className="rounded-xl bg-[#9d5c63] px-8 py-4 text-center font-bold text-white hover:bg-[#7a4650]"
            >
              Reservar cita
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[1fr_340px]">
          {/* Contenido principal */}
          <div>
            {/* Servicios */}
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-black tracking-tight">Servicios</h2>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ServiceRowSkeleton key={i} slug={params.slug} />
                ))}
              </div>
            </section>

            {/* Descripción */}
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-black tracking-tight">Sobre el centro</h2>
              <div className="rounded-2xl border border-[#eadfdc] bg-white p-6">
                <p className="text-[#756b6b]">
                  Descripción del centro pendiente de cargar.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-6 rounded-2xl border border-[#eadfdc] bg-white p-6">
              <h3 className="mb-4 font-black">Información</h3>
              <div className="space-y-3 text-sm text-[#756b6b]">
                <p>📍 Dirección del centro</p>
                <p>📞 Teléfono</p>
                <p>🕐 Lun–Vie: 9:00–20:00</p>
                <p>🕐 Sáb: 9:00–15:00</p>
              </div>
              <Link
                href={`/centro/${params.slug}/reservar`}
                className="mt-6 block rounded-xl bg-[#9d5c63] py-3 text-center font-bold text-white hover:bg-[#7a4650]"
              >
                Reservar cita
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function ServiceRowSkeleton({ slug }: { slug: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#eadfdc] bg-white p-4">
      <div>
        <div className="mb-1 h-4 w-40 animate-pulse rounded bg-[#eadfdc]" />
        <div className="h-3 w-24 animate-pulse rounded bg-[#eadfdc]" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-16 animate-pulse rounded bg-[#eadfdc]" />
        <Link
          href={`/centro/${slug}/reservar`}
          className="rounded-lg bg-[#9d5c63] px-4 py-2 text-xs font-bold text-white hover:bg-[#7a4650]"
        >
          Reservar
        </Link>
      </div>
    </div>
  )
}
