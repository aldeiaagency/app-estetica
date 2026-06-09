import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Users } from 'lucide-react'

export default async function ClientesPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
  if (!center) redirect('/dashboard/configuracion')

  const clientes = await prisma.customer.findMany({
    where: { centerId: center.id },
    include: {
      _count: { select: { bookings: true } },
      bonoInstances: {
        where: { sessionsRemaining: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL}/centro/${center.slug}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Clientes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {clientes.length > 0
              ? `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} registrados`
              : 'Historial de clientes de tu centro'}
          </p>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
            <Users className="h-7 w-7 text-zinc-400" />
          </div>
          <p className="mb-1 font-semibold text-zinc-700">Aún no tienes clientes</p>
          <p className="mb-6 text-sm text-zinc-400">
            Los clientes aparecerán aquí cuando realicen una reserva en tu centro.
          </p>
          <Link
            href={bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Ver página de reservas
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs text-zinc-500">
                  <th className="px-6 py-3 font-semibold">Cliente</th>
                  <th className="px-6 py-3 font-semibold">Teléfono</th>
                  <th className="px-6 py-3 text-center font-semibold">Reservas</th>
                  <th className="px-6 py-3 text-center font-semibold">No-shows</th>
                  <th className="px-6 py-3 text-center font-semibold">Bonos activos</th>
                  <th className="px-6 py-3 font-semibold">Primer contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                          {cliente.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900">{cliente.name}</p>
                          <p className="text-xs text-zinc-500">{cliente.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {cliente.phone ?? <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-zinc-900">
                      {cliente._count.bookings}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cliente.noShowCount > 0 ? (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                          {cliente.noShowCount}
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cliente.bonoInstances.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-700">
                          {cliente.bonoInstances.length}
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-xs">
                      {formatDate(cliente.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-zinc-100">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                  {cliente.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900">{cliente.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{cliente.email}</p>
                  {cliente.phone && <p className="text-xs text-zinc-400">{cliente.phone}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-zinc-900">{cliente._count.bookings} citas</p>
                  {cliente.bonoInstances.length > 0 && (
                    <p className="text-xs text-primary-600 font-semibold">{cliente.bonoInstances.length} bono{cliente.bonoInstances.length !== 1 ? 's' : ''}</p>
                  )}
                  {cliente.noShowCount > 0 && (
                    <p className="text-xs text-orange-600">{cliente.noShowCount} no-show</p>
                  )}
                  <p className="text-xs text-zinc-400">
                    {formatDate(cliente.createdAt, { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
