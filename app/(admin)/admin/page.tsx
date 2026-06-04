import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — Belleza Local',
  robots: { index: false },
}

export default function AdminPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-black tracking-tight">Plataforma Overview</h1>
      <p className="mb-8 text-sm text-[#756b6b]">Panel de administración de Belleza Local</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ADMIN_STATS.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[#eadfdc] bg-white p-6">
            <p className="mb-1 text-sm text-[#756b6b]">{stat.label}</p>
            <p className="text-3xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-[#eadfdc] bg-white p-6">
        <h2 className="mb-4 font-black tracking-tight">Centros pendientes de aprobación</h2>
        <p className="text-sm text-[#756b6b]">
          Los centros nuevos aparecerán aquí para revisión antes de publicarse.
        </p>
      </div>
    </div>
  )
}

const ADMIN_STATS = [
  { label: 'Centros totales', value: '0' },
  { label: 'Centros publicados', value: '0' },
  { label: 'Organizaciones activas', value: '0' },
  { label: 'Reservas este mes', value: '0' },
]
