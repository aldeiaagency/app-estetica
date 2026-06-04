import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { publishCenterAction, unpublishCenterAction, toggleCenterSeoNoindexAction } from '@/app/actions/admin'
import {
  CheckCircle2,
  Clock,
  Building2,
  Users,
  CalendarDays,
  Star,
  Layers,
  Globe,
  EyeOff,
  ArrowLeft,
  Phone,
  Mail,
} from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  PELUQUERIA: 'Peluquería',
  ESTETICA: 'Estética',
  UNAS: 'Uñas',
  CEJAS_PESTANAS: 'Cejas y pestañas',
  DEPILACION: 'Depilación',
  MASAJES: 'Masajes',
  SPA: 'Spa',
  COSMETICA: 'Cosmética',
  BELLEZA_INTEGRAL: 'Belleza integral',
  OTRO: 'Otro',
}

const PLAN_COLORS: Record<string, string> = {
  BASIC: 'bg-slate-100 text-slate-600',
  PRO: 'bg-blue-100 text-blue-700',
  GROWTH: 'bg-green-100 text-green-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
}

export default async function AdminCentroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== 'PLATFORM_ADMIN') redirect('/')

  const { id } = await params

  const center = await prisma.center.findUnique({
    where: { id },
    include: {
      organization: {
        include: {
          users: { select: { id: true } },
          addOns: { where: { active: true }, select: { addOnType: true } },
        },
      },
      services: { select: { id: true, active: true } },
      staff: { select: { id: true } },
      _count: { select: { bookings: true, reviews: true } },
    },
  })

  if (!center) notFound()

  async function publish() {
    'use server'
    await publishCenterAction(id, session?.user?.id ?? '')
  }

  async function unpublish() {
    'use server'
    await unpublishCenterAction(id, session?.user?.id ?? '')
  }

  async function setNoindex(fd: FormData) {
    'use server'
    const value = fd.get('seoNoindex') === 'true'
    await toggleCenterSeoNoindexAction(id, value, session?.user?.id ?? '')
  }

  const activeServices = center.services.filter((s) => s.active).length

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/centros"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a centros
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{center.name}</h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                center.published
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {center.published ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> Publicado
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" /> Pendiente
                </>
              )}
            </span>
            {center.seoNoindex && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                <EyeOff className="h-3 w-3" /> noindex
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            /{center.slug} · {CATEGORY_LABELS[center.category] ?? center.category}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-3">
          {center.published ? (
            <form action={unpublish}>
              <button
                type="submit"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
              >
                Despublicar
              </button>
            </form>
          ) : (
            <form action={publish}>
              <button
                type="submit"
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
              >
                Publicar centro
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — info + metrics */}
        <div className="space-y-6 lg:col-span-2">
          {/* Info */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-slate-900">Información</h2>
            {center.description && (
              <p className="mb-4 text-sm text-slate-600">{center.description}</p>
            )}
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Dirección
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {center.addressStreet && <span>{center.addressStreet}, </span>}
                  {center.addressCity}, {center.addressProvince}
                  {center.addressPostalCode && <span> {center.addressPostalCode}</span>}
                </dd>
              </div>
              {center.phone && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Teléfono
                  </dt>
                  <dd className="mt-1 flex items-center gap-1 text-sm text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {center.phone}
                  </dd>
                </div>
              )}
              {center.email && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Email
                  </dt>
                  <dd className="mt-1 flex items-center gap-1 text-sm text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {center.email}
                  </dd>
                </div>
              )}
              {center.approvedAt && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Aprobado
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">
                    {new Date(center.approvedAt).toLocaleDateString('es-ES')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Creado
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {new Date(center.createdAt).toLocaleDateString('es-ES')}
                </dd>
              </div>
            </dl>
          </section>

          {/* Métricas */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-900">Métricas</h2>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4">
              {[
                {
                  label: 'Servicios activos',
                  value: activeServices,
                  total: center.services.length,
                  icon: Layers,
                },
                { label: 'Staff', value: center.staff.length, icon: Users },
                { label: 'Reservas', value: center._count.bookings, icon: CalendarDays },
                { label: 'Reseñas', value: center._count.reviews, icon: Star },
              ].map((m) => (
                <div key={m.label} className="flex flex-col p-5">
                  <m.icon className="mb-2 h-4 w-4 text-slate-400" />
                  <span className="text-2xl font-black text-slate-900">{m.value}</span>
                  <span className="mt-0.5 text-xs text-slate-400">{m.label}</span>
                  {'total' in m && m.total !== m.value && (
                    <span className="text-xs text-slate-300">{m.total} en total</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column — org + actions */}
        <div className="space-y-6">
          {/* Organización */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <h2 className="font-bold text-slate-900">Organización</h2>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Nombre
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-700">
                  {center.organization.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Plan
                </dt>
                <dd className="mt-1">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      PLAN_COLORS[center.organization.plan] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {center.organization.plan}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Usuarios
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {center.organization.users.length} usuario
                  {center.organization.users.length !== 1 ? 's' : ''}
                </dd>
              </div>
              {center.organization.addOns.length > 0 && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Add-ons activos
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {center.organization.addOns.map((a) => (
                      <span
                        key={a.addOnType}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        {a.addOnType}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <Link
                href={`/admin/organizaciones`}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Ver organización →
              </Link>
            </div>
          </section>

          {/* SEO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-400" />
              <h2 className="font-bold text-slate-900">SEO</h2>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">Indexación en buscadores</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  center.seoNoindex
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {center.seoNoindex ? 'noindex' : 'indexado'}
              </span>
            </div>
            <form action={setNoindex} className="flex flex-col gap-2">
              <input
                type="hidden"
                name="seoNoindex"
                value={center.seoNoindex ? 'false' : 'true'}
              />
              <button
                type="submit"
                className={`w-full rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  center.seoNoindex
                    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                {center.seoNoindex ? 'Activar indexación' : 'Marcar como noindex'}
              </button>
            </form>
            {activeServices < 2 && center.published && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Advertencia: centro publicado con menos de 2 servicios activos. Se recomienda noindex.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
