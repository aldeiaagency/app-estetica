import { createProductPromotionAction, toggleProductPromotionAction } from '@/app/actions/dashboard'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'
import { BadgePercent, CalendarClock, Tag } from 'lucide-react'
import { redirect } from 'next/navigation'

const SCOPE_LABELS = { PRODUCT: 'Productos', CATEGORY: 'Categoría', ORDER: 'Pedido completo' } as const
const DISCOUNT_LABELS = { PERCENTAGE: '%', FIXED_AMOUNT: '€' } as const

export default async function PromocionesPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId } })
  if (!center) redirect('/dashboard/configuracion')

  const [promotions, products, categories] = await Promise.all([
    prisma.promotion.findMany({
      where: { centerId: center.id, scope: { in: ['PRODUCT', 'CATEGORY', 'ORDER'] } },
      include: { products: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({ where: { centerId: center.id, active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.productCategory.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true } }),
  ])

  async function create(formData: FormData) {
    'use server'
    const number = (key: string) => {
      const value = String(formData.get(key) ?? '').trim()
      return value ? Number(value) : undefined
    }
    await createProductPromotionAction({
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? '') || undefined,
      scope: String(formData.get('scope') ?? 'ORDER') as 'PRODUCT' | 'CATEGORY' | 'ORDER',
      code: String(formData.get('code') ?? '').trim() || undefined,
      discountType: String(formData.get('discountType') ?? 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED_AMOUNT',
      discountValue: Number(formData.get('discountValue') ?? 0),
      minimumOrderCents: number('minimumOrderEuros') === undefined ? undefined : Math.round(number('minimumOrderEuros')! * 100),
      maxDiscountCents: number('maxDiscountEuros') === undefined ? undefined : Math.round(number('maxDiscountEuros')! * 100),
      maxUses: number('maxUses'),
      perCustomerLimit: number('perCustomerLimit') ?? 1,
      categoryId: String(formData.get('categoryId') ?? '') || undefined,
      productIds: formData.getAll('productIds').map(String),
      startsAt: new Date(String(formData.get('startsAt') ?? '')),
      endsAt: new Date(String(formData.get('endsAt') ?? '')),
    })
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Promociones</h1>
        <p className="mt-1 text-sm text-zinc-500">Crea ofertas automáticas y cupones para los productos de tu centro.</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm" aria-labelledby="new-promotion-title">
        <h2 id="new-promotion-title" className="mb-5 flex items-center gap-2 text-lg font-bold text-zinc-900">
          <BadgePercent className="h-5 w-5 text-primary-600" /> Nueva promoción
        </h2>
        <form action={create} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="promotion-title">Título</label>
            <input id="promotion-title" name="title" required minLength={2} className="input-base" placeholder="10% en cuidado facial" />
          </div>
          <div>
            <label className="label" htmlFor="promotion-scope">Se aplica a</label>
            <select id="promotion-scope" name="scope" className="input-base" defaultValue="ORDER">
              <option value="ORDER">Pedido completo</option>
              <option value="PRODUCT">Productos seleccionados</option>
              <option value="CATEGORY">Categoría</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="promotion-code">Cupón (opcional)</label>
            <input id="promotion-code" name="code" className="input-base uppercase" placeholder="BELLEZA10" maxLength={40} />
          </div>
          <div>
            <label className="label" htmlFor="promotion-discount-type">Tipo</label>
            <select id="promotion-discount-type" name="discountType" className="input-base" defaultValue="PERCENTAGE">
              <option value="PERCENTAGE">Porcentaje</option>
              <option value="FIXED_AMOUNT">Importe fijo</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="promotion-discount-value">Descuento</label>
            <input id="promotion-discount-value" name="discountValue" required type="number" min={1} step={1} className="input-base" placeholder="10" />
            <p className="mt-1 text-xs text-zinc-400">Porcentaje entero o céntimos para importe fijo.</p>
          </div>
          <div>
            <label className="label" htmlFor="promotion-category">Categoría</label>
            <select id="promotion-category" name="categoryId" className="input-base" defaultValue="">
              <option value="">Selecciona si corresponde</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <fieldset className="sm:col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <legend className="px-1 text-sm font-bold text-zinc-800">Productos incluidos</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {products.map(product => (
                <label key={product.id} className="flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" name="productIds" value={product.id} className="h-4 w-4 accent-primary-600" />
                  {product.name}
                </label>
              ))}
              {products.length === 0 && <p className="text-sm text-zinc-500">Publica productos antes de crear una promoción por producto.</p>}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="promotion-minimum">Compra mínima (€)</label>
            <input id="promotion-minimum" name="minimumOrderEuros" type="number" min={0} step={0.01} className="input-base" />
          </div>
          <div>
            <label className="label" htmlFor="promotion-max-discount">Descuento máximo (€)</label>
            <input id="promotion-max-discount" name="maxDiscountEuros" type="number" min={0.01} step={0.01} className="input-base" />
          </div>
          <div>
            <label className="label" htmlFor="promotion-max-uses">Usos máximos</label>
            <input id="promotion-max-uses" name="maxUses" type="number" min={1} className="input-base" placeholder="Sin límite" />
          </div>
          <div>
            <label className="label" htmlFor="promotion-per-customer">Usos por clienta</label>
            <input id="promotion-per-customer" name="perCustomerLimit" type="number" min={1} defaultValue={1} className="input-base" />
          </div>
          <div>
            <label className="label" htmlFor="promotion-starts">Empieza</label>
            <input id="promotion-starts" name="startsAt" type="datetime-local" required className="input-base" />
          </div>
          <div>
            <label className="label" htmlFor="promotion-ends">Termina</label>
            <input id="promotion-ends" name="endsAt" type="datetime-local" required className="input-base" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="promotion-description">Descripción (opcional)</label>
            <textarea id="promotion-description" name="description" rows={2} className="input-base resize-none" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Crear promoción</button>
          </div>
        </form>
      </section>

      <section className="space-y-3" aria-labelledby="promotion-list-title">
        <h2 id="promotion-list-title" className="text-lg font-bold text-zinc-900">Promociones creadas</h2>
        {promotions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500">Todavía no hay promociones.</div>
        ) : promotions.map(promotion => (
          <article key={promotion.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50"><Tag className="h-5 w-5 text-primary-600" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-zinc-900">{promotion.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${promotion.active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>{promotion.active ? 'Activa' : 'Pausada'}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">{promotion.discountType === 'PERCENTAGE' ? `${promotion.discountValue}%` : formatPrice(promotion.discountValue)} · {SCOPE_LABELS[promotion.scope as keyof typeof SCOPE_LABELS]}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400"><CalendarClock className="h-3.5 w-3.5" />{promotion.startsAt.toLocaleDateString('es-ES')} - {promotion.endsAt.toLocaleDateString('es-ES')}{promotion.code ? ` · Código ${promotion.code}` : ' · Automática'}</p>
            </div>
            <form action={async () => { 'use server'; await toggleProductPromotionAction(promotion.id) }}>
              <button type="submit" className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">{promotion.active ? 'Pausar' : 'Activar'}</button>
            </form>
          </article>
        ))}
      </section>
    </div>
  )
}
