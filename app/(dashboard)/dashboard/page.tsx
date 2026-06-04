import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false },
}

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Buenos días 👋</h1>
          <p className="mt-1 text-sm text-[#756b6b]">Hoy, miércoles 4 de junio</p>
        </div>
        <Link
          href="/dashboard/reservas/nueva"
          className="rounded-xl bg-[#9d5c63] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#7a4650]"
        >
          + Nueva reserva
        </Link>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_ITEMS.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-[#eadfdc] bg-white p-6">
            <p className="mb-1 text-sm text-[#756b6b]">{kpi.label}</p>
            <p className="text-3xl font-black">{kpi.value}</p>
            <p className="mt-1 text-xs text-[#3d7b73]">{kpi.change}</p>
          </div>
        ))}
      </div>

      {/* Reservas de hoy */}
      <div className="rounded-2xl border border-[#eadfdc] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-black tracking-tight">Reservas de hoy</h2>
          <Link href="/dashboard/agenda" className="text-sm font-bold text-[#9d5c63]">
            Ver agenda →
          </Link>
        </div>

        <div className="space-y-3">
          {MOCK_BOOKINGS.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between rounded-xl bg-[#fffaf7] px-4 py-3"
            >
              <div>
                <p className="font-bold">{booking.customerName}</p>
                <p className="text-sm text-[#756b6b]">
                  {booking.service} · {booking.staff}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{booking.time}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {booking.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-[#eadfdc] p-6 text-center text-sm text-[#756b6b]">
          Las reservas reales aparecerán aquí cuando el sistema esté conectado a la base de datos.
        </div>
      </div>

      {/* Enlace de reserva */}
      <div className="mt-6 rounded-2xl border border-[#eadfdc] bg-white p-6">
        <h2 className="mb-2 font-black tracking-tight">Tu enlace de reserva</h2>
        <p className="mb-4 text-sm text-[#756b6b]">
          Comparte este enlace con tus clientes para que reserven directamente en tu centro.
        </p>
        <div className="flex items-center gap-3 rounded-xl bg-[#fffaf7] px-4 py-3">
          <span className="flex-1 truncate text-sm font-mono text-[#756b6b]">
            bellezalocal.es/centro/tu-centro
          </span>
          <button className="text-sm font-bold text-[#9d5c63] hover:text-[#7a4650]">
            Copiar
          </button>
        </div>
      </div>
    </div>
  )
}

const KPI_ITEMS = [
  { label: 'Reservas hoy', value: '0', change: 'Sin datos aún' },
  { label: 'Reservas este mes', value: '0', change: 'Sin datos aún' },
  { label: 'Nuevos clientes', value: '0', change: 'Sin datos aún' },
  { label: 'No-shows', value: '0%', change: 'Sin datos aún' },
]

const MOCK_BOOKINGS = [
  { id: '1', customerName: 'María García', service: 'Corte + Tinte', staff: 'Ana', time: '10:00', status: 'confirmed' },
  { id: '2', customerName: 'Laura Martínez', service: 'Manicura', staff: 'Pedro', time: '11:30', status: 'pending' },
  { id: '3', customerName: 'Carmen López', service: 'Depilación', staff: 'Ana', time: '13:00', status: 'confirmed' },
]
