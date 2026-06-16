import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { formatPrice, formatDuration } from '@/lib/utils'
import { toggleServiceActiveAction, createServiceAction, updateServiceAction } from '@/app/actions/dashboard'
import { Clock, Euro, ShieldCheck, Sparkles } from 'lucide-react'

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

  const activeServices = servicios.filter(servicio => servicio.active).length
  const servicesWithDeposit = servicios.filter(servicio => servicio.depositRequired && servicio.depositCents).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow">Catalogo comercial</p>
          <h1 className="page-title mt-2">Servicios</h1>
          <p className="page-subtitle">
            Configura duracion, precio, buffers y senales para proteger la agenda del centro.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-[260px]">
          <Metric label="Activos" value={activeServices} />
          <Metric label="Con senal" value={servicesWithDeposit} />
        </div>
      </div>

      {servicios.length === 0 ? (
        <div className="card border-dashed px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#e5edff]">
            <Sparkles className="h-6 w-6 text-[#2f6df6]" />
          </div>
          <p className="mt-4 font-black text-[#0c1324]">Aun no tienes servicios</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[#647089]">
            Crea los tratamientos que se podran reservar online y asignales una senal si quieres reducir no-shows.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-[#e5eaf2]">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="px-5 py-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#0c1324]">{servicio.name}</p>
                      <span className={servicio.active ? 'badge-green' : 'badge-zinc'}>
                        {servicio.active ? 'Activo' : 'Inactivo'}
                      </span>
                      {servicio.depositRequired && servicio.depositCents && (
                        <span className="badge-beauty">
                          Senal {formatPrice(servicio.depositCents)}
                        </span>
                      )}
                    </div>

                    {servicio.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-[#647089]">{servicio.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#647089]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f4f8] px-2.5 py-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(servicio.durationMinutes)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f4f8] px-2.5 py-1">
                        <Euro className="h-3 w-3" />
                        {formatPrice(servicio.priceCents)}
                      </span>
                      {(servicio.bufferMinutesBefore > 0 || servicio.bufferMinutesAfter > 0) && (
                        <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1">
                          Buffer {servicio.bufferMinutesBefore} / {servicio.bufferMinutesAfter} min
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
                    <button type="submit" className={servicio.active ? 'btn-outline w-full lg:w-auto' : 'btn-primary w-full lg:w-auto'}>
                      {servicio.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </form>
                </div>

                <EditarServicioForm
                  orgId={orgId}
                  servicio={{
                    id: servicio.id,
                    name: servicio.name,
                    description: servicio.description,
                    durationMinutes: servicio.durationMinutes,
                    priceCents: servicio.priceCents,
                    depositRequired: servicio.depositRequired,
                    depositCents: servicio.depositCents,
                    bufferMinutesBefore: servicio.bufferMinutesBefore,
                    bufferMinutesAfter: servicio.bufferMinutesAfter,
                    active: servicio.active,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="card p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e5edff]">
            <ShieldCheck className="h-5 w-5 text-[#2f6df6]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#0c1324]">Anadir servicio</h2>
            <p className="mt-1 text-sm text-[#647089]">
              La senal online se usa para servicios de alto valor, citas largas o politicas anti no-show.
            </p>
          </div>
        </div>
        <NuevoServicioForm orgId={orgId} />
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#d8dee9] bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#647089]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#0c1324]">{value}</p>
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
    const depositRequired = formData.get('depositRequired') === 'on'
    const depositoEuros = parseFloat((formData.get('depositoEuros') as string) || '0')
    const depositCents = depositRequired ? Math.round(depositoEuros * 100) : undefined
    const bufferMinutesBefore = parseInt(formData.get('bufferMinutesBefore') as string, 10) || 0
    const bufferMinutesAfter = parseInt(formData.get('bufferMinutesAfter') as string, 10) || 0

    await createServiceAction(
      {
        name,
        description,
        durationMinutes,
        priceCents,
        depositRequired,
        depositCents,
        bufferMinutesBefore,
        bufferMinutesAfter,
      },
      orgId
    )
  }

  return (
    <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">
          Nombre del servicio <span className="text-[#2f6df6]">*</span>
        </label>
        <input
          name="name"
          required
          minLength={2}
          placeholder="Ej: Higiene facial avanzada"
          className="input-base"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="label">Descripcion</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Que incluye, para quien es y que resultado puede esperar el cliente"
          className="input-base resize-none"
        />
      </div>

      <div>
        <label className="label">
          Duracion en minutos <span className="text-[#2f6df6]">*</span>
        </label>
        <input
          name="durationMinutes"
          type="number"
          required
          min={1}
          placeholder="60"
          className="input-base"
        />
      </div>

      <div>
        <label className="label">
          Precio <span className="text-[#2f6df6]">*</span>
        </label>
        <input
          name="precioEuros"
          type="number"
          required
          min={0}
          step={0.01}
          placeholder="65.00"
          className="input-base"
        />
      </div>

      <div className="sm:col-span-2 rounded-lg border border-[#cfe0ff] bg-[#edf3ff] p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input name="depositRequired" type="checkbox" className="mt-1 h-4 w-4 accent-[#2f6df6]" />
          <span>
            <span className="block text-sm font-black text-[#0c1324]">Pedir senal online para este servicio</span>
            <span className="mt-1 block text-xs leading-5 text-[#647089]">
              La reserva quedara pendiente hasta que el cliente pague la senal con Stripe.
            </span>
          </span>
        </label>
        <div className="mt-4 max-w-xs">
          <label className="label">Importe de la senal</label>
          <input
            name="depositoEuros"
            type="number"
            min={0}
            step={0.01}
            placeholder="10.00"
            className="input-base bg-white"
          />
        </div>
      </div>

      <div>
        <label className="label">Buffer antes</label>
        <input
          name="bufferMinutesBefore"
          type="number"
          min={0}
          defaultValue={0}
          className="input-base"
        />
      </div>

      <div>
        <label className="label">Buffer despues</label>
        <input
          name="bufferMinutesAfter"
          type="number"
          min={0}
          defaultValue={0}
          className="input-base"
        />
      </div>

      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary">
          Anadir servicio
        </button>
      </div>
    </form>
  )
}

function EditarServicioForm({
  orgId,
  servicio,
}: {
  orgId: string
  servicio: {
    id: string
    name: string
    description: string | null
    durationMinutes: number
    priceCents: number
    depositRequired: boolean
    depositCents: number | null
    bufferMinutesBefore: number
    bufferMinutesAfter: number
    active: boolean
  }
}) {
  async function handleUpdate(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const description = (formData.get('description') as string) || undefined
    const durationMinutes = parseInt(formData.get('durationMinutes') as string, 10)
    const precioEuros = parseFloat(formData.get('precioEuros') as string)
    const priceCents = Math.round(precioEuros * 100)
    const depositRequired = formData.get('depositRequired') === 'on'
    const depositoEuros = parseFloat((formData.get('depositoEuros') as string) || '0')
    const depositCents = depositRequired ? Math.round(depositoEuros * 100) : undefined
    const bufferMinutesBefore = parseInt(formData.get('bufferMinutesBefore') as string, 10) || 0
    const bufferMinutesAfter = parseInt(formData.get('bufferMinutesAfter') as string, 10) || 0

    await updateServiceAction(
      servicio.id,
      {
        name,
        description,
        durationMinutes,
        priceCents,
        depositRequired,
        depositCents,
        bufferMinutesBefore,
        bufferMinutesAfter,
        active: servicio.active,
      },
      orgId
    )
  }

  return (
    <details className="mt-4 rounded-lg border border-[#e5eaf2] bg-[#f7f9fc]">
      <summary className="cursor-pointer px-4 py-3 text-sm font-black text-[#0c1324]">
        Editar servicio y senal
      </summary>
      <form action={handleUpdate} className="grid gap-4 border-t border-[#e5eaf2] p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Nombre</label>
          <input name="name" required minLength={2} defaultValue={servicio.name} className="input-base" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Descripcion</label>
          <textarea name="description" rows={2} defaultValue={servicio.description ?? ''} className="input-base resize-none" />
        </div>
        <div>
          <label className="label">Duracion</label>
          <input name="durationMinutes" type="number" required min={1} defaultValue={servicio.durationMinutes} className="input-base" />
        </div>
        <div>
          <label className="label">Precio</label>
          <input name="precioEuros" type="number" required min={0} step={0.01} defaultValue={(servicio.priceCents / 100).toFixed(2)} className="input-base" />
        </div>
        <div className="sm:col-span-2 rounded-lg border border-[#cfe0ff] bg-white p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input name="depositRequired" type="checkbox" defaultChecked={servicio.depositRequired} className="mt-1 h-4 w-4 accent-[#2f6df6]" />
            <span>
              <span className="block text-sm font-black text-[#0c1324]">Pedir senal online</span>
              <span className="mt-1 block text-xs leading-5 text-[#647089]">
                El cliente pagara esta senal antes de que la cita quede confirmada.
              </span>
            </span>
          </label>
          <div className="mt-4 max-w-xs">
            <label className="label">Importe de la senal</label>
            <input
              name="depositoEuros"
              type="number"
              min={0}
              step={0.01}
              defaultValue={servicio.depositCents ? (servicio.depositCents / 100).toFixed(2) : ''}
              className="input-base"
            />
          </div>
        </div>
        <div>
          <label className="label">Buffer antes</label>
          <input name="bufferMinutesBefore" type="number" min={0} defaultValue={servicio.bufferMinutesBefore} className="input-base" />
        </div>
        <div>
          <label className="label">Buffer despues</label>
          <input name="bufferMinutesAfter" type="number" min={0} defaultValue={servicio.bufferMinutesAfter} className="input-base" />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary">
            Guardar cambios
          </button>
        </div>
      </form>
    </details>
  )
}
