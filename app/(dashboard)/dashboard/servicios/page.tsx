import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { formatPrice, formatDuration } from '@/lib/utils'
import { toggleServiceActiveAction, createServiceAction } from '@/app/actions/dashboard'

export default async function ServiciosPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
  if (!center) redirect('/dashboard/configuracion')

  const servicios = await prisma.service.findMany({
    where: { centerId: center.id },
    orderBy: { order: 'asc' },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Servicios</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona los servicios que ofreces</p>
        </div>
      </div>

      {/* Lista de servicios */}
      {servicios.length === 0 ? (
        <div className="mb-8 rounded-2xl border border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-500">Aún no tienes servicios. Crea el primero abajo.</p>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">{servicio.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        servicio.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {servicio.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {servicio.description && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">{servicio.description}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-3">
                    <span className="text-sm text-slate-600">{formatDuration(servicio.durationMinutes)}</span>
                    <span className="text-sm font-semibold text-slate-900">{formatPrice(servicio.priceCents)}</span>
                    {(servicio.bufferMinutesBefore > 0 || servicio.bufferMinutesAfter > 0) && (
                      <span className="text-xs text-slate-400">
                        Buffer: {servicio.bufferMinutesBefore}min / {servicio.bufferMinutesAfter}min
                      </span>
                    )}
                  </div>
                </div>
                <form
                  action={async () => {
                    'use server'
                    await toggleServiceActiveAction(servicio.id, orgId)
                  }}
                >
                  <button
                    type="submit"
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                      servicio.active
                        ? 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {servicio.active ? 'Desactivar' : 'Activar'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario nuevo servicio */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Añadir servicio</h2>
        <NuevoServicioForm orgId={orgId} />
      </div>
    </div>
  )
}

function NuevoServicioForm({ orgId }: { orgId: string }) {
  async function handleCreate(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const description = (formData.get('description') as string) || undefined
    const durationMinutes = parseInt(formData.get('durationMinutes') as string, 10)
    const precioEuros = parseFloat(formData.get('precioEuros') as string)
    const priceCents = Math.round(precioEuros * 100)
    const bufferMinutesBefore = parseInt(formData.get('bufferMinutesBefore') as string, 10) || 0
    const bufferMinutesAfter = parseInt(formData.get('bufferMinutesAfter') as string, 10) || 0

    await createServiceAction(
      { name, description, durationMinutes, priceCents, bufferMinutesBefore, bufferMinutesAfter },
      orgId
    )
  }

  return (
    <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre del servicio <span className="text-rose-500">*</span>
        </label>
        <input
          name="name"
          required
          minLength={2}
          placeholder="Ej: Corte de pelo"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
        <textarea
          name="description"
          rows={2}
          placeholder="Descripción breve del servicio (opcional)"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Duración (minutos) <span className="text-rose-500">*</span>
        </label>
        <input
          name="durationMinutes"
          type="number"
          required
          min={1}
          placeholder="60"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Precio (€) <span className="text-rose-500">*</span>
        </label>
        <input
          name="precioEuros"
          type="number"
          required
          min={0}
          step={0.01}
          placeholder="25.00"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Buffer antes (min)</label>
        <input
          name="bufferMinutesBefore"
          type="number"
          min={0}
          defaultValue={0}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Buffer después (min)</label>
        <input
          name="bufferMinutesAfter"
          type="number"
          min={0}
          defaultValue={0}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
        >
          Añadir servicio
        </button>
      </div>
    </form>
  )
}
