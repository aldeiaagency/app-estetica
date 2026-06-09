import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

function relativeTime(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60)   return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ACTION_LABELS: Record<string, string> = {
  PUBLISH_CENTER:          'Publicar centro',
  UNPUBLISH_CENTER:        'Despublicar centro',
  UPDATE_ORG_PLAN:         'Cambiar plan',
  TOGGLE_SEO_NOINDEX:      'Toggle SEO noindex',
  TOGGLE_ADDON:            'Toggle add-on',
}

const TARGET_COLORS: Record<string, string> = {
  CENTER:       'bg-primary-50 text-primary-700',
  ORGANIZATION: 'bg-emerald-50 text-emerald-700',
  ADD_ON:       'bg-amber-50 text-amber-700',
}

export default async function AdminAuditPage() {
  const session = await auth()
  if (session?.user?.role !== 'PLATFORM_ADMIN') redirect('/')

  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Resolve actor names
  const uniqueActorIds = [...new Set(logs.map(l => l.actorId))]
  const actors = await prisma.user.findMany({
    where: { id: { in: uniqueActorIds } },
    select: { id: true, name: true, email: true },
  })
  const actorMap = Object.fromEntries(actors.map(a => [a.id, a]))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
          <ShieldCheck className="h-5 w-5 text-zinc-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Auditoría</h1>
          <p className="text-sm text-zinc-500">Últimas {logs.length} acciones de administración</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
          <p className="text-sm text-zinc-400">No hay entradas de auditoría aún</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs text-zinc-500">
                  <th className="px-6 py-3 font-semibold">Cuando</th>
                  <th className="px-6 py-3 font-semibold">Actor</th>
                  <th className="px-6 py-3 font-semibold">Acción</th>
                  <th className="px-6 py-3 font-semibold">Objetivo</th>
                  <th className="px-6 py-3 font-semibold">ID objetivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {logs.map(log => {
                  const actor = actorMap[log.actorId]
                  const color = TARGET_COLORS[log.targetType] ?? 'bg-zinc-100 text-zinc-600'
                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-xs text-zinc-400 whitespace-nowrap">
                        {relativeTime(log.createdAt)}
                      </td>
                      <td className="px-6 py-3.5">
                        {actor ? (
                          <div>
                            <p className="font-medium text-zinc-800">{actor.name ?? '—'}</p>
                            <p className="text-xs text-zinc-400">{actor.email}</p>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-zinc-400">{log.actorId.slice(-8)}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-zinc-700">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
                          {log.targetType}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-zinc-400">
                        {log.targetId.slice(-12).toUpperCase()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-zinc-100">
            {logs.map(log => {
              const actor = actorMap[log.actorId]
              const color = TARGET_COLORS[log.targetType] ?? 'bg-zinc-100 text-zinc-600'
              return (
                <div key={log.id} className="px-4 py-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-800 text-sm">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
                      {log.targetType}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">{actor?.name ?? log.actorId.slice(-8)} · {relativeTime(log.createdAt)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
