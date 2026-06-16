import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { createStaffAction, toggleStaffActiveAction } from '@/app/actions/dashboard'
import { UserCircle } from 'lucide-react'

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Profesionales</h1>
          <p className="mt-1 text-sm text-zinc-500">Gestiona el equipo visible en tu perfil publico</p>
        </div>
      </div>

      {staffList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <UserCircle className="h-7 w-7 text-primary-400" />
          </div>
          <p className="font-semibold text-zinc-700">Sin profesionales todavia</p>
          <p className="mt-1 text-sm text-zinc-400">Anade el equipo para que el cliente pueda elegir con quien reservar.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid divide-y divide-zinc-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {staffList.map((member) => (
              <div key={member.id} className="flex gap-4 p-5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-primary-50">
                  {member.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-black text-primary-600">
                      {member.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-zinc-900">{member.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${member.active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                      {member.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {member.role && <p className="text-sm text-zinc-500">{member.role}</p>}
                  {member.bio && <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{member.bio}</p>}
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
                        ? 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
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

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-zinc-900">Anadir profesional</h2>
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
    const image = (formData.get('image') as string) || undefined

    await createStaffAction({ name, role, bio, image }, orgId)
  }

  return (
    <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label">
          Nombre <span className="text-[#2f6df6]">*</span>
        </label>
        <input name="name" required minLength={2} placeholder="Ej: Maria Garcia" className="input-base" />
      </div>

      <div>
        <label className="label">Rol</label>
        <input name="role" placeholder="Ej: Estilista, esteticista" className="input-base" />
      </div>

      <div className="sm:col-span-2">
        <label className="label">Foto</label>
        <input name="image" type="url" placeholder="https://..." className="input-base" />
        <p className="mt-1 text-xs text-zinc-400">Se mostrara en la ficha publica y en el flujo de reserva.</p>
      </div>

      <div className="sm:col-span-2">
        <label className="label">Bio</label>
        <textarea name="bio" rows={2} placeholder="Breve descripcion del profesional" className="input-base resize-none" />
      </div>

      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary">
          Anadir profesional
        </button>
      </div>
    </form>
  )
}
