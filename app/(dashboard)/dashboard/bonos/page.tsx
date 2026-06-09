import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { createBonoAction, toggleBonoActiveAction } from '@/app/actions/dashboard'
import { redeemBonoSessionAction } from '@/app/actions/bonos'
import { Gift, Clock, Tag, Users, CalendarCheck } from 'lucide-react'

export default async function BonosPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
  if (!center) redirect('/dashboard/configuracion')

  const [bonos, servicios] = await Promise.all([
    prisma.bono.findMany({
      where: { centerId: center.id },
      include: {
        service:   { select: { name: true } },
        instances: {
          orderBy: { purchasedAt: 'desc' },
          take: 20,
          include: { customer: { select: { name: true, email: true } } },
        },
        _count: { select: { instances: true } },
      },
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
        <div className="space-y-6">
          {bonos.map((bono) => (
            <div key={bono.id} className={`overflow-hidden rounded-2xl border shadow-sm transition-all ${bono.active ? 'border-zinc-200 bg-white' : 'border-zinc-100 bg-zinc-50'}`}>
              {/* Bono header */}
              <div className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  <Gift className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-900">{bono.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${bono.active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                      {bono.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {bono.description && <p className="mt-0.5 text-sm text-zinc-500 line-clamp-1">{bono.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Tag className="h-3 w-3" /><strong className="text-zinc-700">{formatPrice(bono.priceCents)}</strong></span>
                    <span className="flex items-center gap-1"><Gift className="h-3 w-3" />{bono.sessions} sesiones</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{bono.validityDays}d validez</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{bono._count.instances} vendidos</span>
                    {bono.service && <span>✂ {bono.service.name}</span>}
                  </div>
                </div>
                <form action={async () => { 'use server'; await toggleBonoActiveAction(bono.id, orgId) }}>
                  <button type="submit"
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                      bono.active
                        ? 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {bono.active ? 'Desactivar' : 'Activar'}
                  </button>
                </form>
              </div>

              {/* Instances table */}
              {bono.instances.length > 0 && (
                <div className="border-t border-zinc-100">
                  <div className="flex items-center gap-2 bg-zinc-50 px-5 py-2.5">
                    <CalendarCheck className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-500">Bonos vendidos (últimos 20)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400">
                          <th className="px-5 py-2 font-semibold">Cliente</th>
                          <th className="px-5 py-2 font-semibold">Sesiones restantes</th>
                          <th className="px-5 py-2 font-semibold">Caduca</th>
                          <th className="px-5 py-2 font-semibold">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {bono.instances.map((inst) => {
                          const expired = inst.expiresAt ? inst.expiresAt < new Date() : false
                          const depleted = inst.sessionsRemaining <= 0
                          return (
                            <tr key={inst.id} className={expired || depleted ? 'opacity-50' : ''}>
                              <td className="px-5 py-3">
                                <p className="font-semibold text-zinc-900">{inst.customer.name}</p>
                                <p className="text-xs text-zinc-400">{inst.customer.email}</p>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  depleted ? 'bg-zinc-100 text-zinc-400' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {inst.sessionsRemaining} / {bono.sessions}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-xs text-zinc-500">
                                {inst.expiresAt
                                  ? inst.expiresAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : '—'}
                                {expired && <span className="ml-1 text-red-500">(caducado)</span>}
                              </td>
                              <td className="px-5 py-3">
                                {!depleted && !expired ? (
                                  <form action={async () => {
                                    'use server'
                                    await redeemBonoSessionAction(inst.id, orgId)
                                  }}>
                                    <button type="submit"
                                      className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
                                    >
                                      Usar sesión
                                    </button>
                                  </form>
                                ) : (
                                  <span className="text-xs text-zinc-300">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
