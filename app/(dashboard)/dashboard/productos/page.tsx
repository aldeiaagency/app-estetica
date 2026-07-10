import { createProductAction, toggleProductActiveAction } from '@/app/actions/dashboard'
import { UploadHiddenInput } from '@/components/dashboard/upload-hidden-input'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'
import { Package, ShoppingBag } from 'lucide-react'
import { redirect } from 'next/navigation'

const ROUTINE_STEP_OPTIONS = [
  ['CLEANSER', 'Limpieza'],
  ['TONER', 'Tónico'],
  ['SERUM', 'Sérum'],
  ['MOISTURIZER', 'Hidratación'],
  ['SPF', 'Protección solar'],
  ['MASK', 'Mascarilla'],
  ['HAIR_CARE', 'Cabello'],
  ['NAIL_CARE', 'Uñas'],
  ['BODY_CARE', 'Cuerpo'],
  ['MAKEUP', 'Maquillaje'],
  ['WELLNESS', 'Bienestar'],
  ['OTHER', 'Otro'],
] as const

type RoutineStepType = (typeof ROUTINE_STEP_OPTIONS)[number][0]

function parseRoutineStepType(value: FormDataEntryValue | null): RoutineStepType | undefined {
  const candidate = String(value ?? '')
  return ROUTINE_STEP_OPTIONS.some(([allowed]) => allowed === candidate)
    ? candidate as RoutineStepType
    : undefined
}

export default async function ProductosPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId } })
  if (!center) redirect('/dashboard/configuracion')

  const products = await prisma.product.findMany({
    where: { centerId: center.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Productos</h1>
        <p className="mt-1 text-sm text-zinc-500">Gestiona los productos que se muestran en tu perfil.</p>
      </header>

      {products.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <ShoppingBag className="h-7 w-7 text-primary-400" aria-hidden="true" />
          </div>
          <p className="font-semibold text-zinc-700">Sin productos todavía</p>
          <p className="mt-1 text-sm text-zinc-400">Añade el primer producto cuando actives este módulo.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">Productos del centro</caption>
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  {['Producto', 'Marca', 'Precio', 'Stock', 'Estado', 'Acciones'].map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {products.map(product => (
                  <tr key={product.id} className="transition-colors hover:bg-zinc-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ProductImage name={product.name} image={product.image} />
                        <div>
                          <p className="font-semibold text-zinc-900">{product.name}</p>
                          {product.description && <p className="line-clamp-1 text-xs text-zinc-500">{product.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{product.brand ?? '—'}</td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">{formatPrice(product.priceCents)}</td>
                    <td className="px-6 py-4 text-zinc-600">{product.stock ?? '∞'}</td>
                    <td className="px-6 py-4"><Status active={product.active} /></td>
                    <td className="px-6 py-4">
                      <ToggleProductForm productId={product.id} active={product.active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-zinc-100 md:hidden">
            {products.map(product => (
              <article key={product.id} className="p-4">
                <div className="mb-3 h-32 overflow-hidden rounded-xl bg-primary-50">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-primary-400" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-zinc-900">{product.name}</h2>
                    {product.brand && <p className="text-xs text-zinc-500">{product.brand}</p>}
                  </div>
                  <Status active={product.active} />
                </div>
                <div className="mb-3 flex items-center gap-4 text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">{formatPrice(product.priceCents)}</span>
                  {product.stock !== null && <span>Stock: {product.stock}</span>}
                </div>
                <ToggleProductForm productId={product.id} active={product.active} />
              </article>
            ))}
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm" aria-labelledby="new-product-title">
        <h2 id="new-product-title" className="mb-5 text-lg font-bold text-zinc-900">Añadir producto</h2>
        <NewProductForm />
      </section>
    </div>
  )
}

function ProductImage({ name, image }: { name: string; image: string | null }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-primary-50">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Package className="h-5 w-5 text-primary-500" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

function Status({ active }: { active: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function ToggleProductForm({ productId, active }: { productId: string; active: boolean }) {
  async function toggle() {
    'use server'
    await toggleProductActiveAction(productId)
  }

  return (
    <form action={toggle}>
      <button type="submit" className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${active ? 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
        {active ? 'Desactivar' : 'Activar'}
      </button>
    </form>
  )
}

function NewProductForm() {
  async function create(formData: FormData) {
    'use server'
    const price = Number.parseFloat(String(formData.get('precioEuros') ?? ''))
    const stock = String(formData.get('stock') ?? '')
    const expectedDuration = String(formData.get('expectedDurationDays') ?? '')
    const replenishmentInterval = String(formData.get('replenishmentIntervalDays') ?? '')
    const splitTags = (value: FormDataEntryValue | null) => String(value ?? '')
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)

    await createProductAction({
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? '') || undefined,
      brand: String(formData.get('brand') ?? '') || undefined,
      image: String(formData.get('image') ?? '') || undefined,
      priceCents: Math.round(price * 100),
      stock: stock ? Number.parseInt(stock, 10) : undefined,
      usageInstructions: String(formData.get('usageInstructions') ?? '') || undefined,
      recommendedFor: String(formData.get('recommendedFor') ?? '') || undefined,
      notRecommendedFor: String(formData.get('notRecommendedFor') ?? '') || undefined,
      expectedDurationDays: expectedDuration ? Number.parseInt(expectedDuration, 10) : undefined,
      replenishmentIntervalDays: replenishmentInterval ? Number.parseInt(replenishmentInterval, 10) : undefined,
      routineStepType: parseRoutineStepType(formData.get('routineStepType')),
      compatibilityTags: splitTags(formData.get('compatibilityTags')),
      recommendationTags: splitTags(formData.get('recommendationTags')),
    })
  }

  return (
    <form action={create} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="product-name">Nombre del producto</label>
        <input id="product-name" name="name" required minLength={2} placeholder="Ej.: Champú reparador 250 ml" className="input-base" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="product-description">Descripción</label>
        <textarea id="product-description" name="description" rows={2} className="input-base resize-none" />
      </div>
      <div>
        <label className="label" htmlFor="product-brand">Marca</label>
        <input id="product-brand" name="brand" className="input-base" />
      </div>
      <UploadHiddenInput name="image" label="Imagen" kind="product" helper="Se mostrará en la ficha del producto." />
      <div>
        <label className="label" htmlFor="product-price">Precio (€)</label>
        <input id="product-price" name="precioEuros" type="number" required min={0} step={0.01} className="input-base" />
      </div>
      <div>
        <label className="label" htmlFor="product-stock">Stock</label>
        <input id="product-stock" name="stock" type="number" min={0} placeholder="Vacío para ilimitado" className="input-base" />
      </div>

      <fieldset className="sm:col-span-2 rounded-lg border border-[#d8dee9] bg-[#f7f9fc] p-4">
        <legend className="px-1 text-sm font-black text-[#0c1324]">Guía de rutina</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="routine-step">Paso de rutina</label>
            <select id="routine-step" name="routineStepType" className="input-base">
              <option value="">Sin clasificar</option>
              {ROUTINE_STEP_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="recommendation-tags">Etiquetas de recomendación</label>
            <input id="recommendation-tags" name="recommendationTags" placeholder="piel seca, luminosidad" className="input-base" />
          </div>
          <div>
            <label className="label" htmlFor="expected-duration">Duración estimada (días)</label>
            <input id="expected-duration" name="expectedDurationDays" type="number" min={1} className="input-base" />
          </div>
          <div>
            <label className="label" htmlFor="replenishment">Reposición sugerida (días)</label>
            <input id="replenishment" name="replenishmentIntervalDays" type="number" min={1} className="input-base" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="recommended-for">Para quién es</label>
            <textarea id="recommended-for" name="recommendedFor" rows={2} className="input-base resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="not-recommended-for">Mejor evitar si</label>
            <textarea id="not-recommended-for" name="notRecommendedFor" rows={2} className="input-base resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="usage-instructions">Cómo usarlo</label>
            <textarea id="usage-instructions" name="usageInstructions" rows={3} className="input-base resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="compatibility-tags">Compatibilidad</label>
            <input id="compatibility-tags" name="compatibilityTags" placeholder="vitamina C, niacinamida" className="input-base" />
          </div>
        </div>
      </fieldset>

      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary">Añadir producto</button>
      </div>
    </form>
  )
}
