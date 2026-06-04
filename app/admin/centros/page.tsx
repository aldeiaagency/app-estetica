import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { publishCenterAction, unpublishCenterAction } from '@/app/actions/admin'
import { CheckCircle2, Clock, Building2, MapPin, Layers } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  PELUQUERIA: 'Peluquería',
  ESTETICA: 'Estética',
  UNAS: 'Uñas',
  CEJAS_PESTANAS: 'Cejas y pestañas',
  DEPILACION: 'Depilación',
  MASAJES: 'Masajes',
  SPA: 'Spa',
  COSMETICA: 'Cosmética',
  BELLEZA_INTEGRAL: 'Belleza integral',
  OTRO: 'Otro',
}

const PLAN_COLORS: Record<string, string> = {
  BASIC: 'bg-slate-100 text-slate-600',
  PRO: 'bg-blue-100 text-blue-700',
  GROWTH: 'bg-green-100 text-green-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
}

export default async function AdminCentrosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== 'PLATFORM_ADMIN') redirect('/')

  const { estado } = await searchParams

  const publishedFilter =
    estado === 'publicado' ? true : estado === 'pendiente' ? false : undefined

  const centers = await prisma.center.findMany({
    where: publishedFilter !== undefined ? { published: publishedFilter } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      organization: { select: { name: true, plan: true } },
      _count: { select: { services: true, bookings: true } },
    },
  })

  async function publish(centerId: string) {
    'use server'
    await publishCenterAction(centerId, session?.user?.id ?? '')
  }

  async function unpublish(centerId: string) {
    'use server'
    await unpublishCenterAction(centerId, session?.user?.id ?? '')
  }

  const tabs = [
    { label: 'Todos', value: undefined, href: '/admin/centros' },
    { label: 'Publicados', value: 'publicado', href: '/admin/centros?estado=publicado' },
    { label: 'Pendientes', value: 'pendiente', href: '/admin/centros?estado=pendiente' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Centros</h1>
        <p className="mt-1 text-sm text-slate-500">
          {centers.length} {centers.length === 1 ? 'centro' : 'centros'} encontrados
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {tabs.map((tab) => {
          const isActive = estado === tab.value || (!estado && tab.value === undefined)
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {centers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Building2 className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-500">No hay centros</p>
            <p className="mt-1 text-sm text-slate-400">
              {estado === 'publicado'
                ? 'No hay centros publicados actualmente'
                : estado === 'pendiente'
                ? 'No hay centros pendientes de aprobación'
                : 'Aún no se han registrado centros en la plataforma'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Table header */}
            <div className="hidden grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
              <span>Centro / Organización</span>
              <span>Ubicación</span>
              <span>Plan</span>
              <span>Métricas</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>

            {centers.map((center) => (
              <div
                key={center.id}
                className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] sm:items-center"
              >
                {/* Centro + org */}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{center.name}</p>
                  <p className="truncate text-xs text-slate-400">{center.organization.name}</p>
                  <p className="truncate text-xs text-slate-300">
                    {CATEGORY_LABELS[center.category] ?? center.category}
                  </p>
                </div>

                {/* Ubicación */}
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {center.addressCity}, {center.addressProvince}
                  </span>
                </div>

                {/* Plan */}
                <div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      PLAN_COLORS[center.organization.plan] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {center.organization.plan}
                  </span>
                </div>

                {/* Métricas */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3 text-slate-400" />
                    {center._count.services} serv.
                  </span>
                  <span>{center._count.bookings} res.</span>
                </div>

                {/* Estado */}
                <div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      center.published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {center.published ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Publicado
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" /> Pendiente
                      </>
                    )}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-3">
                  {center.published ? (
                    <form
                      action={async () => {
                        'use server'
                        await unpublish(center.id)
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Despublicar
                      </button>
                    </form>
                  ) : (
                    <form
                      action={async () => {
                        'use server'
                        await publish(center.id)
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Publicar
                      </button>
                    </form>
                  )}
                  <Link
                    href={`/admin/centros/${center.id}`}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Detalle →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 px-6 py-3">
          <p className="text-xs text-slate-400">
            {centers.length} {centers.length === 1 ? 'registro' : 'registros'} en total
          </p>
        </div>
      </div>
    </div>
  )
}
