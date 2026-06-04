import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, CreditCard, Globe, BarChart3, ShieldCheck, LogOut, Sparkles
} from 'lucide-react'

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/centros', label: 'Centros', icon: Building2 },
  { href: '/admin/organizaciones', label: 'Organizaciones', icon: Users },
  { href: '/admin/planes', label: 'Planes', icon: CreditCard },
  { href: '/admin/seo', label: 'SEO / Indexación', icon: Globe },
  { href: '/admin/metricas', label: 'Métricas', icon: BarChart3 },
  { href: '/admin/audit', label: 'Auditoría', icon: ShieldCheck },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-slate-900 text-white md:flex">
        <div className="border-b border-slate-800 px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-white">BellezaLocal</span>
          </Link>
          <p className="mt-1 text-xs text-slate-500">Panel de administración</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
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
          <Link
            href="/auth/signout"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50 p-8">{children}</main>
    </div>
  )
}
