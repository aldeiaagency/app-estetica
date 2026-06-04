import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { toggleStaffActiveAction, createStaffAction } from '@/app/actions/dashboard'

export default async function StaffPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
  if (!center) redirect('/dashboard/configuracion')

  const staffList = await prisma.staff.findMany({
    where: { centerId: center.id },
    orderBy: { order: 'asc' },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profesionales</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona el equipo de tu centro</p>
        </div>
      </div>

      {/* Lista de staff */}
      {staffList.length === 0 ? (
        <div className="mb-8 rounded-2xl border border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-500">Aún no tienes profesionales registrados. Añade el primero abajo.</p>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {staffList.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                  {member.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        member.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {member.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {member.role && (
                    <p className="text-sm text-slate-500">{member.role}</p>
                  )}
                  {member.bio && (
                    <p className="mt-0.5 truncate text-sm text-slate-400">{member.bio}</p>
                  )}
                </div>
                <form
                  action={async () => {
                    'use server'
                    await toggleStaffActiveAction(member.id, orgId)
                  }}
                >
                  <button
                    type="submit"
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                      member.active
                        ? 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {member.active ? 'Desactivar' : 'Activar'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario nuevo profesional */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Añadir profesional</h2>
        <NuevoStaffForm orgId={orgId} />
      </div>
    </div>
  )
}

function NuevoStaffForm({ orgId }: { orgId: string }) {
  async function handleCreate(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const role = (formData.get('role') as string) || undefined
    const bio = (formData.get('bio') as string) || undefined

    await createStaffAction({ name, role, bio }, orgId)
  }

  return (
    <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre <span className="text-rose-500">*</span>
        </label>
        <input
          name="name"
          required
          minLength={2}
          placeholder="Ej: María García"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Rol (opcional)</label>
        <input
          name="role"
          placeholder="Ej: Estilista, Esteticista"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Bio (opcional)</label>
        <textarea
          name="bio"
          rows={2}
          placeholder="Breve descripción del profesional"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
        >
          Añadir profesional
        </button>
      </div>
    </form>
  )
}
