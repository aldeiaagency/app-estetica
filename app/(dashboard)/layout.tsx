import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import {
  LayoutDashboard, Calendar, ClipboardList, Users,
  Scissors, UserCircle, Clock, Star, BarChart3,
  Settings, Sparkles, LogOut, Gift, Tag, Package
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/agenda', label: 'Agenda', icon: Calendar },
  { href: '/dashboard/reservas', label: 'Reservas', icon: ClipboardList },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/servicios', label: 'Servicios', icon: Scissors },
  { href: '/dashboard/staff', label: 'Staff', icon: UserCircle },
  { href: '/dashboard/horarios', label: 'Horarios', icon: Clock },
  { href: '/dashboard/bonos', label: 'Bonos', icon: Gift },
  { href: '/dashboard/promociones', label: 'Promociones', icon: Tag },
  { href: '/dashboard/resenas', label: 'Reseñas', icon: Star },
  { href: '/dashboard/analitica', label: 'Analítica', icon: BarChart3 },
  { href: '/dashboard/plan', label: 'Mi plan', icon: Package },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || !['BUSINESS', 'BUSINESS_ADMIN'].includes(session.user.role)) {
    redirect('/auth/signin?callbackUrl=/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 md:flex">
        <div className="border-b border-slate-800 px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-white">BellezaLocal</span>
          </Link>
          <p className="mt-1 text-xs text-slate-500">Panel de negocio</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
              {session.user.name?.[0] ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{session.user.name}</p>
              <p className="truncate text-xs text-slate-500">{session.user.email}</p>
            </div>
          </div>
          <Link
            href="/auth/signout"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed top-0 z-40 flex w-full items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900">BellezaLocal</span>
        </Link>
        <span className="text-xs text-slate-500">Panel</span>
      </div>

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
