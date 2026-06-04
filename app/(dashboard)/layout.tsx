import Link from 'next/link'
import { redirect } from 'next/navigation'
// import { auth } from '@/lib/auth/config'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Resumen', icon: '📊' },
  { href: '/dashboard/agenda', label: 'Agenda', icon: '📅' },
  { href: '/dashboard/reservas', label: 'Reservas', icon: '📋' },
  { href: '/dashboard/clientes', label: 'Clientes', icon: '👥' },
  { href: '/dashboard/servicios', label: 'Servicios', icon: '✂️' },
  { href: '/dashboard/staff', label: 'Staff', icon: '👤' },
  { href: '/dashboard/horarios', label: 'Horarios', icon: '🕐' },
  { href: '/dashboard/plan', label: 'Mi plan', icon: '⭐' },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: '⚙️' },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: uncomment when Auth.js is configured
  // const session = await auth()
  // if (!session?.user || !['BUSINESS', 'BUSINESS_ADMIN'].includes(session.user.role)) {
  //   redirect('/auth/signin')
  // }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-[260px] flex-col bg-[#211b1c] text-white md:flex">
        <div className="border-b border-[#3a3031] p-6">
          <Link href="/" className="text-xl font-black">
            Belleza<span className="text-[#9d5c63]">Local</span>
          </Link>
          <p className="mt-1 text-xs text-[#756b6b]">Panel de negocio</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#eadfdc] hover:bg-[#3a3031] hover:text-white"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#3a3031] p-4">
          <Link
            href="/auth/signin"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#756b6b] hover:bg-[#3a3031] hover:text-white"
          >
            <span>🚪</span> Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-[#fffaf7]">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-[#eadfdc] bg-white px-4 py-4 md:hidden">
          <Link href="/" className="text-lg font-black">
            Belleza<span className="text-[#9d5c63]">Local</span>
          </Link>
          <span className="text-sm text-[#756b6b]">Panel de negocio</span>
        </div>

        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
