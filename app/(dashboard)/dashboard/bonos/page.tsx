import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { createBonoAction, toggleBonoActiveAction } from '@/app/actions/dashboard'
import { Gift, Clock, Tag } from 'lucide-react'

export default async function BonosPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
  if (!center) redirect('/dashboard/configuracion')

  const [bonos, servicios] = await Promise.all([
    prisma.bono.findMany({
      where: { centerId: center.id },
      include: { service: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.service.findMany({
      where: { centerId: center.id, active: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Bonos</h1>
          <p className="mt-1 text-sm text-zinc-500">Crea y gestiona bonos de sesiones para tus clientes</p>
        </div>
      </div>

      {/* Bonos list */}
      {bonos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <Gift className="h-7 w-7 text-primary-400" />
          </div>
          <p className="font-semibold text-zinc-700">Sin bonos todavía</p>
          <p className="mt-1 text-sm text-zinc-400">Crea tu primer bono y empieza a venderlo desde tu perfil.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bonos.map((bono) => (
            <div key={bono.id} className={`rounded-2xl border p-5 shadow-sm transition-all ${bono.active ? 'border-zinc-200 bg-white' : 'border-zinc-100 bg-zinc-50'}`}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  <Gift className="h-5 w-5 text-primary-600" />
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${bono.active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                  {bono.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <h3 className="font-bold text-zinc-900">{bono.name}</h3>
              {bono.description && <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{bono.description}</p>}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Tag className="h-3 w-3 text-zinc-400" />
                  <span className="font-semibold text-zinc-700">{formatPrice(bono.priceCents)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Gift className="h-3 w-3 text-zinc-400" />
                  {bono.sessions} sesion{bono.sessions !== 1 ? 'es' : ''}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  Validez: {bono.validityDays} días
                </div>
                {bono.service && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="h-3 w-3 text-zinc-400">✂</span>
                    Servicio: {bono.service.name}
                  </div>
                )}
              </div>
              <form action={async () => { 'use server'; await toggleBonoActiveAction(bono.id, orgId) }} className="mt-4">
                <button type="submit"
                  className={`w-full rounded-xl py-2 text-xs font-semibold transition-colors ${
                    bono.active
                      ? 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {bono.active ? 'Desactivar' : 'Activar'}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-zinc-900">Crear nuevo bono</h2>
        <NuevoBonoForm orgId={orgId} servicios={servicios} />
      </div>
    </div>
  )
}

function NuevoBonoForm({ orgId, servicios }: { orgId: string; servicios: { id: string; name: string }[] }) {
  async function handleCreate(formData: FormData) {
    'use server'
    const sessions     = parseInt(formData.get('sessions') as string, 10)
    const validityDays = parseInt(formData.get('validityDays') as string, 10)
    const precioEuros  = parseFloat(formData.get('precioEuros') as string)
    const serviceId    = (formData.get('serviceId') as string) || undefined

    await createBonoAction({
      name:         formData.get('name') as string,
      description:  (formData.get('description') as string) || undefined,
      sessions,
      validityDays,
      priceCents:   Math.round(precioEuros * 100),
      serviceId,
    }, orgId)
  }

  return (
    <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Nombre del bono <span className="text-beauty-500">*</span></label>
        <input name="name" required minLength={2} placeholder="Ej: Bono 10 sesiones masaje" className="input-base" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Descripción</label>
        <textarea name="description" rows={2} placeholder="Descripción breve (opcional)" className="input-base resize-none" />
      </div>
      <div>
        <label className="label">Número de sesiones <span className="text-beauty-500">*</span></label>
        <input name="sessions" type="number" required min={1} defaultValue={10} className="input-base" />
      </div>
      <div>
        <label className="label">Validez (días) <span className="text-beauty-500">*</span></label>
        <input name="validityDays" type="number" required min={1} defaultValue={365} className="input-base" />
      </div>
      <div>
        <label className="label">Precio (€) <span className="text-beauty-500">*</span></label>
        <input name="precioEuros" type="number" required min={0} step={0.01} placeholder="150.00" className="input-base" />
      </div>
      <div>
        <label className="label">Servicio asociado (opcional)</label>
        <select name="serviceId" className="input-base">
          <option value="">Cualquier servicio</option>
          {servicios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary">Crear bono</button>
      </div>
    </form>
  )
}
