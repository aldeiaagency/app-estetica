import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { TrendingUp, ShoppingCart, Gift, CalendarDays, Building2, Sparkles } from 'lucide-react'

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

const CATEGORY_LABELS: Record<string, string> = {
  PELUQUERIA:       'Peluquería',
  ESTETICA:         'Estética',
  UNAS:             'Uñas',
  CEJAS_PESTANAS:   'Cejas y pestañas',
  DEPILACION:       'Depilación',
  MASAJES:          'Masajes',
  SPA:              'Spa',
  COSMETICA:        'Cosmética',
  BELLEZA_INTEGRAL: 'Belleza integral',
  OTRO:             'Otro',
}

export default async function AdminMetricasPage() {
  const session = await auth()
  if (session?.user?.role !== 'PLATFORM_ADMIN') redirect('/')

  // Global aggregates
  const [
    totalOrderRevenue,
    totalOrders,
    totalBonoInstances,
    totalBookings,
    topCities,
    categoryDist,
    monthlyBookings,
    monthlyOrders,
  ] = await Promise.all([
    // Total revenue from confirmed/delivered orders
    prisma.order.aggregate({
      where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
      _sum: { totalCents: true },
    }),
    // Total orders
    prisma.order.count(),
    // Total bono instances sold
    prisma.bonoInstance.count(),
    // Total bookings
    prisma.booking.count(),
    // Top 5 cities by center count
    prisma.center.groupBy({
      by: ['addressCity'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    // Centers by category
    prisma.center.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { published: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    // Bookings by month — last 6 months
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char(date_trunc('month', "startAt"), 'YYYY-MM') AS month,
             COUNT(*) AS count
      FROM   "Booking"
      WHERE  "startAt" >= now() - interval '6 months'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    // Orders by month — last 6 months
    prisma.$queryRaw<{ month: string; total: bigint }[]>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
             SUM("totalCents") AS total
      FROM   "Order"
      WHERE  status IN ('CONFIRMED','DELIVERED')
        AND  "createdAt" >= now() - interval '6 months'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ])

  const revenueTotal = totalOrderRevenue._sum.totalCents ?? 0

  // Max value for bar chart scaling
  const maxBookings = Math.max(...monthlyBookings.map(r => Number(r.count)), 1)
  const maxRevenue  = Math.max(...monthlyOrders.map(r => Number(r.total)), 1)

  function monthLabel(ym: string) {
    const [y, m] = ym.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Métricas de plataforma</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Global KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Ingresos totales',   value: formatPrice(revenueTotal), sub: 'Pedidos confirmados/entregados', icon: TrendingUp,    color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Pedidos totales',    value: totalOrders,               sub: 'Todos los estados',             icon: ShoppingCart,  color: 'bg-primary-50 text-primary-600' },
          { label: 'Bonos vendidos',     value: totalBonoInstances,        sub: 'Instancias creadas',            icon: Gift,          color: 'bg-beauty-50 text-beauty-600'   },
          { label: 'Reservas totales',   value: totalBookings,             sub: 'Desde el inicio',               icon: CalendarDays,  color: 'bg-amber-50 text-amber-600'     },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-black tracking-tight text-zinc-900">{kpi.value}</div>
            <div className="mt-1 text-sm font-medium text-zinc-700">{kpi.label}</div>
            <div className="mt-0.5 text-xs text-zinc-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reservas por mes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-bold text-zinc-900">Reservas — últimos 6 meses</h2>
          {monthlyBookings.length === 0 ? (
            <p className="text-sm text-zinc-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {monthlyBookings.map(row => {
                const count = Number(row.count)
                const pct   = Math.round((count / maxBookings) * 100)
                return (
                  <div key={row.month} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-right text-xs font-semibold text-zinc-500">
                      {monthLabel(row.month)}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-2 rounded-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-bold text-zinc-700">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ingresos por mes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-bold text-zinc-900">Ingresos pedidos — últimos 6 meses</h2>
          {monthlyOrders.length === 0 ? (
            <p className="text-sm text-zinc-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {monthlyOrders.map(row => {
                const total = Number(row.total)
                const pct   = Math.round((total / maxRevenue) * 100)
                return (
                  <div key={row.month} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-right text-xs font-semibold text-zinc-500">
                      {monthLabel(row.month)}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs font-bold text-zinc-700">
                      {formatPrice(total)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top ciudades */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-bold text-zinc-900">Top ciudades por centros</h2>
          {topCities.length === 0 ? (
            <p className="text-sm text-zinc-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {topCities.map((city, i) => (
                <div key={city.addressCity} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-500">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-zinc-900">{city.addressCity}</span>
                  <span className="flex items-center gap-1 text-sm text-zinc-500">
                    <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                    {city._count.id} centros
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribución por categoría */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-bold text-zinc-900">Centros publicados por categoría</h2>
          {categoryDist.length === 0 ? (
            <p className="text-sm text-zinc-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {categoryDist.map(cat => {
                const total = categoryDist.reduce((s, c) => s + c._count.id, 0)
                const pct   = Math.round((cat._count.id / total) * 100)
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-zinc-700">
                      <Sparkles className="mr-1 inline h-3 w-3 text-primary-400" />
                      {CATEGORY_LABELS[cat.category] ?? cat.category}
                    </span>
                    <div className="w-24 overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-14 shrink-0 text-right text-xs font-semibold text-zinc-500">
                      {cat._count.id} ({pct}%)
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
