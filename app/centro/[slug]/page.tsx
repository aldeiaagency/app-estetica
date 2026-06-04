import { Metadata } from 'next'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `Centro de belleza — ${slug}`,
    description: 'Reserva tu cita online. Disponibilidad real.',
  }
}

export default async function CenterPage({ params }: Props) {
  const { slug } = await params

  return (
    <div className="min-h-screen bg-[#fffaf7]">
      <div className="border-b border-[#eadfdc] bg-white">
        <div className="mx-auto max-w-[1180px] px-4 py-6">
          <Link href="/buscar" className="mb-4 flex items-center gap-2 text-sm text-[#756b6b] hover:text-[#211b1c]">
            ← Volver a resultados
          </Link>

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
              href={`/centro/${slug}/reservar`}
              className="rounded-xl bg-[#9d5c63] px-8 py-4 text-center font-bold text-white hover:bg-[#7a4650]"
            >
              Reservar cita
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[1fr_340px]">
          <div>
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-black tracking-tight">Servicios</h2>
              <div className="space-y-3">
                {['Corte de pelo', 'Coloración', 'Manicura', 'Depilación'].map((s) => (
                  <div key={s} className="flex items-center justify-between rounded-xl border border-[#eadfdc] bg-white p-4">
                    <div>
                      <p className="font-bold">{s}</p>
                      <p className="text-sm text-[#756b6b]">60 min · desde 35 €</p>
                    </div>
                    <Link
                      href={`/centro/${slug}/reservar`}
                      className="rounded-lg bg-[#9d5c63] px-4 py-2 text-xs font-bold text-white hover:bg-[#7a4650]"
                    >
                      Reservar
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </div>

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
                href={`/centro/${slug}/reservar`}
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
