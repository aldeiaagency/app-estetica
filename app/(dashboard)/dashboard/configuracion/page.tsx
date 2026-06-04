import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { CATEGORY_LABELS } from '@/lib/utils'
import { upsertCenterAction } from '@/app/actions/dashboard'

const CATEGORIES = [
  'PELUQUERIA',
  'ESTETICA',
  'UNAS',
  'CEJAS_PESTANAS',
  'DEPILACION',
  'MASAJES',
  'SPA',
  'COSMETICA',
  'BELLEZA_INTEGRAL',
  'OTRO',
] as const

export default async function ConfiguracionPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración del centro</h1>
          <p className="mt-1 text-sm text-slate-500">
            {center ? 'Actualiza los datos de tu centro' : 'Crea tu centro para empezar a recibir reservas'}
          </p>
        </div>
      </div>

      {/* Estado publicación */}
      {center && (
        <div
          className={`mb-6 rounded-2xl border px-5 py-4 ${
            center.published
              ? 'border-green-200 bg-green-50'
              : 'border-yellow-200 bg-yellow-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                center.published ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            <div>
              <p className={`text-sm font-semibold ${center.published ? 'text-green-800' : 'text-yellow-800'}`}>
                {center.published ? 'Centro publicado' : 'Centro no publicado'}
              </p>
              {!center.published && (
                <p className="mt-0.5 text-sm text-yellow-700">
                  Tu centro está pendiente de revisión. La plataforma lo revisará y lo publicará en breve.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <CentroForm center={center} orgId={orgId} />
      </div>
    </div>
  )
}

function CentroForm({
  center,
  orgId,
}: {
  center: {
    name: string
    description: string | null
    category: string
    phone: string | null
    whatsapp: string | null
    email: string | null
    website: string | null
    addressStreet: string
    addressCity: string
    addressProvince: string
    addressPostalCode: string
  } | null
  orgId: string
}) {
  async function handleSave(formData: FormData) {
    'use server'
    await upsertCenterAction(
      {
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || undefined,
        category: formData.get('category') as string,
        phone: (formData.get('phone') as string) || undefined,
        whatsapp: (formData.get('whatsapp') as string) || undefined,
        email: (formData.get('email') as string) || undefined,
        website: (formData.get('website') as string) || undefined,
        addressStreet: (formData.get('addressStreet') as string) || undefined,
        addressCity: formData.get('addressCity') as string,
        addressProvince: formData.get('addressProvince') as string,
        addressPostalCode: (formData.get('addressPostalCode') as string) || undefined,
      },
      orgId
    )
  }

  return (
    <form action={handleSave} className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre del centro <span className="text-rose-500">*</span>
        </label>
        <input
          name="name"
          required
          minLength={2}
          defaultValue={center?.name ?? ''}
          placeholder="Ej: Studio Beauty & Spa"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Categoría <span className="text-rose-500">*</span>
        </label>
        <select
          name="category"
          required
          defaultValue={center?.category ?? ''}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-white"
        >
          <option value="" disabled>Selecciona una categoría</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email del centro</label>
        <input
          name="email"
          type="email"
          defaultValue={center?.email ?? ''}
          placeholder="contacto@micentro.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={center?.description ?? ''}
          placeholder="Describe brevemente tu centro, especialidades, ambiente..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
        <input
          name="phone"
          type="tel"
          defaultValue={center?.phone ?? ''}
          placeholder="Ej: 91 234 56 78"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">WhatsApp</label>
        <input
          name="whatsapp"
          type="tel"
          defaultValue={center?.whatsapp ?? ''}
          placeholder="Ej: 612 345 678"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Sitio web</label>
        <input
          name="website"
          type="url"
          defaultValue={center?.website ?? ''}
          placeholder="https://micentro.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div className="sm:col-span-2 border-t border-slate-100 pt-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Dirección</p>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Calle y número</label>
        <input
          name="addressStreet"
          defaultValue={center?.addressStreet ?? ''}
          placeholder="Ej: Calle Mayor 10, 2ºA"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Ciudad <span className="text-rose-500">*</span>
        </label>
        <input
          name="addressCity"
          required
          defaultValue={center?.addressCity ?? ''}
          placeholder="Ej: Madrid"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Provincia <span className="text-rose-500">*</span>
        </label>
        <input
          name="addressProvince"
          required
          defaultValue={center?.addressProvince ?? ''}
          placeholder="Ej: Madrid"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Código postal</label>
        <input
          name="addressPostalCode"
          defaultValue={center?.addressPostalCode ?? ''}
          placeholder="28001"
          maxLength={5}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div className="sm:col-span-2 pt-2">
        <button
          type="submit"
          className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
        >
          Guardar cambios
        </button>
      </div>
    </form>
  )
}
