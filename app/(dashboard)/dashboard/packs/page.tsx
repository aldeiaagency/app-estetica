import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { CheckCircle2, Gift, Package, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { createBeautyPackAction, getBeautyPacksForOrganization, toggleBeautyPackActiveAction } from '@/app/actions/beauty-packs'
import { PackBuilder } from '@/components/business/pack-builder'

function centsFromEuros(value: FormDataEntryValue | null) {
  const parsed = parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

function optionalCentsFromEuros(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  if (!text) return undefined
  return centsFromEuros(text)
}

function optionalInt(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  if (!text) return undefined
  const parsed = parseInt(text, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

export default async function PacksPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId }, select: { id: true, name: true } })
  if (!center) redirect('/dashboard/configuracion')

  const [packs, services, bonos] = await Promise.all([
    getBeautyPacksForOrganization(orgId),
    prisma.service.findMany({
      where: { centerId: center.id, active: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.bono.findMany({
      where: { centerId: center.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true },
    }),
  ])

  async function handleCreate(formData: FormData) {
    'use server'

    const items = Array.from({ length: 4 })
      .map((_, index) => {
        const label = String(formData.get(`itemLabel-${index}`) ?? '').trim()
        if (!label) return null

        return {
          label,
          itemType: String(formData.get(`itemType-${index}`) ?? 'SERVICE') as 'SERVICE',
          quantity: optionalInt(formData.get(`itemQuantity-${index}`)) ?? 1,
          serviceId: String(formData.get(`itemServiceId-${index}`) ?? '').trim() || undefined,
          note: String(formData.get(`itemNote-${index}`) ?? '').trim() || undefined,
        }
      })
      .filter(Boolean)

    await createBeautyPackAction({
      name: String(formData.get('name') ?? ''),
      objective: String(formData.get('objective') ?? ''),
      description: String(formData.get('description') ?? '').trim() || undefined,
      audience: String(formData.get('audience') ?? '').trim() || undefined,
      notFor: String(formData.get('notFor') ?? '').trim() || undefined,
      expectedResult: String(formData.get('expectedResult') ?? '').trim() || undefined,
      priceCents: centsFromEuros(formData.get('priceEuros')),
      compareAtPriceCents: optionalCentsFromEuros(formData.get('compareAtEuros')),
      durationDays: optionalInt(formData.get('durationDays')),
      preferredArea: String(formData.get('preferredArea') ?? '').trim() || undefined,
      minMaintenanceLevel: String(formData.get('minMaintenanceLevel') ?? '').trim() || undefined,
      bonoId: String(formData.get('bonoId') ?? '').trim() || undefined,
      featured: formData.get('featured') === '1',
      items,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Packs por objetivo</h1>
          <p className="mt-1 text-sm text-zinc-500">Agrupa servicios, revisiones y productos por resultado esperado.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
          <Sparkles className="h-4 w-4" />
          Los bonos simples siguen en su seccion legacy
        </div>
      </div>

      {packs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-zinc-200 bg-white py-14 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-50">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <p className="font-bold text-zinc-800">Aun no tienes packs</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-zinc-500">
            Crea el primero pensando en una meta concreta: cuidar la piel, mantener manicura, preparar un evento o acompanar una rutina.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {packs.map(pack => (
            <article key={pack.id} className={`rounded-lg border bg-white p-5 shadow-sm ${pack.active ? 'border-zinc-200' : 'border-zinc-100 opacity-70'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                      {pack.preferredArea ?? 'OBJETIVO'}
                    </span>
                    {pack.featured && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">Destacado</span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${pack.active ? 'bg-zinc-100 text-zinc-700' : 'bg-amber-50 text-amber-700'}`}>
                      {pack.active ? 'Activo' : 'Pausado'}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-black tracking-tight text-zinc-900">{pack.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-zinc-600">{pack.objective}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-zinc-900">{formatPrice(pack.priceCents)}</p>
                  {pack.compareAtPriceCents && (
                    <p className="text-xs font-semibold text-zinc-400 line-through">{formatPrice(pack.compareAtPriceCents)}</p>
                  )}
                </div>
              </div>

              {(pack.audience || pack.notFor || pack.expectedResult) && (
                <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                  {pack.audience && <InfoBlock title="Para" text={pack.audience} />}
                  {pack.notFor && <InfoBlock title="No para" text={pack.notFor} />}
                  {pack.expectedResult && <InfoBlock title="Resultado" text={pack.expectedResult} />}
                </div>
              )}

              <div className="mt-5 rounded-md bg-zinc-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Incluye</p>
                <div className="mt-3 space-y-2">
                  {pack.items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-sm text-zinc-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong className="text-zinc-900">{item.quantity}x</strong> {item.label}
                        {item.note && <span className="text-zinc-400"> · {item.note}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <Gift className="h-4 w-4" />
                  {pack.bonoName ? `Compra con bono: ${pack.bonoName}` : 'Compra pendiente: envia a reserva'}
                </div>
                <form action={async () => {
                  'use server'
                  await toggleBeautyPackActiveAction(pack.id)
                }}>
                  <button type="submit" className="btn-outline py-2 text-xs">
                    {pack.active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                    {pack.active ? 'Pausar' : 'Activar'}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-black text-zinc-900">Crear nuevo pack</h2>
          <p className="mt-1 text-sm text-zinc-500">Define el resultado antes que el numero de sesiones.</p>
        </div>
        <PackBuilder action={handleCreate} services={services} bonos={bonos} />
      </section>
    </div>
  )
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">{title}</p>
      <p className="mt-1 leading-5 text-zinc-700">{text}</p>
    </div>
  )
}
