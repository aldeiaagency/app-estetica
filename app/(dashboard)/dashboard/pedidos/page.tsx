import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { updateOrderStatusAction } from '@/app/actions/dashboard'
import { StatusBadge } from '@/components/ui/badge'
import { ShoppingBag, Package, ChevronRight } from 'lucide-react'
import type { OrderStatus } from '@prisma/client'

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:   'Pendiente',
  CONFIRMED: 'Confirmado',
  SHIPPED:   'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

// Allowed transitions for each status
const NEXT_ACTIONS: Record<OrderStatus, { label: string; status: OrderStatus; style: string }[]> = {
  PENDING:   [
    { label: 'Confirmar',  status: 'CONFIRMED', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { label: 'Cancelar',   status: 'CANCELLED', style: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' },
  ],
  CONFIRMED: [
    { label: 'Marcar enviado', status: 'SHIPPED',    style: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { label: 'Cancelar',       status: 'CANCELLED',  style: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' },
  ],
  SHIPPED:   [
    { label: 'Entregado', status: 'DELIVERED', style: 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200' },
  ],
  DELIVERED: [],
  CANCELLED: [],
}

const VALID_FILTER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
function isValidStatus(s: string): s is OrderStatus { return VALID_FILTER_STATUSES.includes(s as OrderStatus) }

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
  if (!center) redirect('/dashboard/configuracion')

  const { estado } = await searchParams
  const statusFilter = estado && isValidStatus(estado) ? estado : undefined

  const [orders, pendingCount] = await Promise.all([
    prisma.order.findMany({
      where: {
        centerId: center.id,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.order.count({ where: { centerId: center.id, status: 'PENDING' } }),
  ])

  const filters: { label: string; status: OrderStatus | null }[] = [
    { label: 'Todos', status: null },
    { label: 'Pendientes', status: 'PENDING' },
    { label: 'Confirmados', status: 'CONFIRMED' },
    { label: 'Enviados', status: 'SHIPPED' },
    { label: 'Entregados', status: 'DELIVERED' },
    { label: 'Cancelados', status: 'CANCELLED' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Pedidos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gestiona los pedidos de productos de tu tienda
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => {
          const active = f.status === null ? !statusFilter : statusFilter === f.status
          const href = f.status ? `/dashboard/pedidos?estado=${f.status}` : '/dashboard/pedidos'
          return (
            <Link
              key={f.label}
              href={href}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {f.label}
              {f.status === 'PENDING' && pendingCount > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
            <ShoppingBag className="h-7 w-7 text-zinc-400" />
          </div>
          <p className="font-semibold text-zinc-700">
            {statusFilter ? `No hay pedidos con estado "${STATUS_LABELS[statusFilter]}"` : 'Aún no hay pedidos'}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Los pedidos de tu tienda online aparecerán aquí.
          </p>
        </div>
      )}

      {/* Orders list */}
      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const actions = NEXT_ACTIONS[order.status]
            const date = order.createdAt.toLocaleDateString('es-ES', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            const time = order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

            return (
              <div key={order.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-start gap-4 p-5">
                  {/* Order meta */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                    <Package className="h-5 w-5 text-zinc-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-400">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 font-semibold text-zinc-900">{order.customerName}</p>
                    <p className="text-sm text-zinc-500">{order.customerEmail}</p>
                    {order.customerPhone && (
                      <p className="text-xs text-zinc-400">{order.customerPhone}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-zinc-900">{formatPrice(order.totalCents)}</p>
                    <p className="text-xs text-zinc-400">{date} · {time}</p>
                    <p className="text-xs text-zinc-400">
                      {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-zinc-50 bg-zinc-50/50 px-5 py-3">
                  <div className="space-y-1">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600">
                          {item.name}
                          <span className="ml-1 text-zinc-400">× {item.quantity}</span>
                        </span>
                        <span className="font-semibold text-zinc-700">{formatPrice(item.priceCents * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-zinc-100 px-5 py-3">
                    {actions.map(action => (
                      <form
                        key={action.status}
                        action={async () => {
                          'use server'
                          await updateOrderStatusAction(order.id, action.status, orgId)
                        }}
                      >
                        <button
                          type="submit"
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${action.style}`}
                        >
                          {action.label}
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </form>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
