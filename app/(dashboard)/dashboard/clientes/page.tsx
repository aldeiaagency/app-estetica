import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'

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
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL}/centro/${center.slug}`

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">
            {clientes.length > 0
              ? `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} registrados`
              : 'Historial de clientes de tu centro'}
          </p>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <p className="mb-2 text-sm font-semibold text-slate-600">Aún no tienes clientes</p>
          <p className="mb-6 text-sm text-slate-400">
            Los clientes aparecerán aquí cuando realicen una reserva en tu centro.
          </p>
          <a
            href={bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
          >
            Ver página de reservas
          </a>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Cliente</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Teléfono</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-600">Reservas</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-600">No-shows</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Primer contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                          {cliente.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{cliente.name}</p>
                          <p className="text-xs text-slate-500">{cliente.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {cliente.phone ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-slate-900">{cliente._count.bookings}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cliente.noShowCount > 0 ? (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                          {cliente.noShowCount}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(cliente.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-slate-100">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                  {cliente.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{cliente.name}</p>
                  <p className="text-xs text-slate-500 truncate">{cliente.email}</p>
                  {cliente.phone && (
                    <p className="text-xs text-slate-500">{cliente.phone}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-900">{cliente._count.bookings} citas</p>
                  {cliente.noShowCount > 0 && (
                    <span className="text-xs text-orange-600">{cliente.noShowCount} no-show</span>
                  )}
                  <p className="text-xs text-slate-400">
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
