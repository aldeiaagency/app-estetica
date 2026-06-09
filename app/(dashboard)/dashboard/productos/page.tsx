import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { createProductAction, toggleProductActiveAction } from '@/app/actions/dashboard'
import { ShoppingBag, Package, Tag } from 'lucide-react'

export default async function ProductosPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
  if (!center) redirect('/dashboard/configuracion')

  const productos = await prisma.product.findMany({
    where: { centerId: center.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Productos</h1>
          <p className="mt-1 text-sm text-zinc-500">Vende productos directamente desde tu perfil en el marketplace</p>
        </div>
      </div>

      {/* Products list */}
      {productos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <ShoppingBag className="h-7 w-7 text-primary-400" />
          </div>
          <p className="font-semibold text-zinc-700">Sin productos todavía</p>
          <p className="mt-1 text-sm text-zinc-400">Añade productos para venderlos desde tu página pública.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  {['Producto', 'Marca', 'Precio', 'Stock', 'Estado', ''].map((h) => (
                    <th key={h} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider text-zinc-400 ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {productos.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                          <Package className="h-5 w-5 text-primary-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900">{p.name}</p>
                          {p.description && <p className="text-xs text-zinc-400 line-clamp-1">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{p.brand ?? '—'}</td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">{formatPrice(p.priceCents)}</td>
                    <td className="px-6 py-4 text-zinc-500">{p.stock !== null ? p.stock : '∞'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {p.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={async () => { 'use server'; await toggleProductActiveAction(p.id, orgId) }}>
                        <button type="submit" className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${p.active ? 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                          {p.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-zinc-100">
            {productos.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-zinc-900">{p.name}</p>
                    {p.brand && <p className="text-xs text-zinc-400">{p.brand}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {p.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
                  <span className="font-semibold text-zinc-900">{formatPrice(p.priceCents)}</span>
                  {p.stock !== null && <span>Stock: {p.stock}</span>}
                </div>
                <form action={async () => { 'use server'; await toggleProductActiveAction(p.id, orgId) }}>
                  <button type="submit" className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${p.active ? 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    {p.active ? 'Desactivar' : 'Activar'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-zinc-900">Añadir producto</h2>
        <NuevoProductoForm orgId={orgId} />
      </div>
    </div>
  )
}

function NuevoProductoForm({ orgId }: { orgId: string }) {
  async function handleCreate(formData: FormData) {
    'use server'
    const precioEuros = parseFloat(formData.get('precioEuros') as string)
    const stockStr    = formData.get('stock') as string

    await createProductAction({
      name:        formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      brand:       (formData.get('brand') as string) || undefined,
      priceCents:  Math.round(precioEuros * 100),
      stock:       stockStr ? parseInt(stockStr, 10) : undefined,
    }, orgId)
  }

  return (
    <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Nombre del producto <span className="text-beauty-500">*</span></label>
        <input name="name" required minLength={2} placeholder="Ej: Champú reparador 250ml" className="input-base" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Descripción</label>
        <textarea name="description" rows={2} placeholder="Descripción breve (opcional)" className="input-base resize-none" />
      </div>
      <div>
        <label className="label">Marca</label>
        <input name="brand" placeholder="Ej: Kerastase" className="input-base" />
      </div>
      <div>
        <label className="label">Precio (€) <span className="text-beauty-500">*</span></label>
        <input name="precioEuros" type="number" required min={0} step={0.01} placeholder="29.90" className="input-base" />
      </div>
      <div>
        <label className="label">
          Stock <span className="text-zinc-400 font-normal">(deja vacío para ilimitado)</span>
        </label>
        <input name="stock" type="number" min={0} placeholder="50" className="input-base" />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary">Añadir producto</button>
      </div>
    </form>
  )
}
