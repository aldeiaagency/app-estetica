import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { toggleCenterSeoNoindexAction } from '@/app/actions/admin'
import { Globe, EyeOff, AlertTriangle, CheckCircle2, MapPin, Layers } from 'lucide-react'

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

export default async function AdminSeoPage() {
  const session = await auth()
  if (session?.user?.role !== 'PLATFORM_ADMIN') redirect('/')

  const publishedCenters = await prisma.center.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          services: {
            where: { active: true },
          },
        },
      },
    },
  })

  async function toggleNoindex(centerId: string, currentNoindex: boolean) {
    'use server'
    await toggleCenterSeoNoindexAction(centerId, !currentNoindex, session?.user?.id ?? '')
  }

  const indexedCenters = publishedCenters.filter((c) => !c.seoNoindex)
  const noindexCenters = publishedCenters.filter((c) => c.seoNoindex)
  const lowContentCenters = publishedCenters.filter((c) => c._count.services < 2)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">SEO</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestión de indexación de centros publicados
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-500" />
            <span className="text-sm text-slate-500">Indexados</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{indexedCenters.length}</div>
          <p className="mt-1 text-xs text-slate-400">Visibles en buscadores</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-slate-500">Noindex</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{noindexCenters.length}</div>
          <p className="mt-1 text-xs text-slate-400">Ocultos a buscadores</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-slate-500">Poco contenido</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{lowContentCenters.length}</div>
          <p className="mt-1 text-xs text-slate-400">Menos de 2 servicios activos</p>
        </div>
      </div>

      {lowContentCenters.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {lowContentCenters.length} centros publicados con poco contenido
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Estos centros tienen menos de 2 servicios activos. Se recomienda marcarlos como
              noindex hasta que completen su contenido para evitar penalización SEO.
            </p>
          </div>
        </div>
      )}

      {/* Todos los centros publicados */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-900">Centros publicados</h2>
        </div>

        {publishedCenters.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Globe className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-500">No hay centros publicados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Header */}
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
              <span>Centro</span>
              <span>Ubicación</span>
              <span>Servicios activos</span>
              <span>Estado SEO</span>
              <span>Acción</span>
            </div>

            {publishedCenters.map((center) => {
              const isLowContent = center._count.services < 2

              return (
                <div
                  key={center.id}
                  className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-center"
                >
                  {/* Nombre */}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{center.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {CATEGORY_LABELS[center.category] ?? center.category}
                    </p>
                  </div>

                  {/* Ubicación */}
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{center.addressCity}</span>
                  </div>

                  {/* Servicios */}
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm text-slate-700">{center._count.services}</span>
                    {isLowContent && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Poco contenido
                      </span>
                    )}
                  </div>

                  {/* Estado SEO */}
                  <div>
                    {center.seoNoindex ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                        <EyeOff className="h-3 w-3" /> noindex
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> indexado
                      </span>
                    )}
                  </div>

                  {/* Acción */}
                  <form
                    action={async () => {
                      'use server'
                      await toggleNoindex(center.id, center.seoNoindex)
                    }}
                  >
                    <button
                      type="submit"
                      className={`text-xs font-semibold transition-colors ${
                        center.seoNoindex
                          ? 'text-green-600 hover:text-green-700'
                          : 'text-orange-600 hover:text-orange-700'
                      }`}
                    >
                      {center.seoNoindex ? 'Activar índice' : 'Marcar noindex'}
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        )}

        <div className="border-t border-slate-100 px-6 py-3">
          <p className="text-xs text-slate-400">
            {publishedCenters.length} centros publicados · {indexedCenters.length} indexados · {noindexCenters.length} noindex
          </p>
        </div>
      </div>
    </div>
  )
}
