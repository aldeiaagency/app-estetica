import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Buscar centros de belleza',
  robots: { index: false },
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ciudad?: string; categoria?: string }>
}) {
  const { q, ciudad, categoria } = await searchParams

  return (
    <div className="min-h-screen bg-[#fffaf7]">
      <div className="mx-auto max-w-[1180px] px-4 py-12">
        <h1 className="mb-2 text-3xl font-black tracking-tight">
          Centros de belleza{ciudad ? ` en ${ciudad}` : ''}
        </h1>
        <p className="mb-8 text-[#756b6b]">
          Busca y reserva en los mejores centros cerca de ti
        </p>

        <div className="mb-8 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Servicio o tipo de negocio"
            defaultValue={q}
            className="rounded-xl border border-[#eadfdc] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9d5c63]"
          />
          <input
            type="text"
            placeholder="Ciudad"
            defaultValue={ciudad}
            className="rounded-xl border border-[#eadfdc] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9d5c63]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CenterCardSkeleton key={i} />
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-[#756b6b]">
          ¿Tienes un negocio?{' '}
          <Link href="/auth/signup?tipo=negocio" className="font-bold text-[#9d5c63]">
            Regístralo aquí
          </Link>
        </p>
      </div>
    </div>
  )
}

function CenterCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eadfdc] bg-white">
      <div className="h-48 animate-pulse bg-[#f6ebe7]" />
      <div className="p-5">
        <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-[#eadfdc]" />
        <div className="mb-4 h-4 w-1/2 animate-pulse rounded bg-[#eadfdc]" />
        <div className="h-10 animate-pulse rounded-xl bg-[#eadfdc]" />
      </div>
    </div>
  )
}
