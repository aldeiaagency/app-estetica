import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { PLAN_FEATURES } from '@/lib/billing/plans'
import { CentroForm } from '@/components/dashboard/centro-form'

export default async function ConfiguracionPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const [org, center] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: orgId }, select: { plan: true } }),
    prisma.center.findFirst({
      where: { organizationId: orgId },
      select: {
        id: true, name: true, description: true, descriptionLong: true,
        category: true, phone: true, whatsapp: true, email: true, website: true,
        addressStreet: true, addressCity: true, addressProvince: true,
        addressPostalCode: true, published: true,
      },
    }),
  ])

  const canUseAI = PLAN_FEATURES[org.plan].hasAI

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Configuración del centro</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {center ? 'Actualiza los datos de tu centro' : 'Crea tu centro para empezar a recibir reservas'}
          </p>
        </div>
      </div>

      {center && (
        <div
          className={`mb-6 rounded-2xl border px-5 py-4 ${
            center.published
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${center.published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <div>
              <p className={`text-sm font-semibold ${center.published ? 'text-emerald-800' : 'text-amber-800'}`}>
                {center.published ? 'Centro publicado' : 'Centro no publicado'}
              </p>
              {!center.published && (
                <p className="mt-0.5 text-sm text-amber-700">
                  Tu centro está pendiente de revisión. La plataforma lo revisará y lo publicará en breve.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <CentroForm center={center} orgId={orgId} canUseAI={canUseAI} />
      </div>
    </div>
  )
}
