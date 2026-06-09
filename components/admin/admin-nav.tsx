'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Users, CreditCard, Globe, BarChart3, ShieldCheck } from 'lucide-react'

const ADMIN_NAV = [
  { href: '/admin',              label: 'Overview',       icon: LayoutDashboard, exact: true },
  { href: '/admin/centros',      label: 'Centros',        icon: Building2 },
  { href: '/admin/organizaciones', label: 'Organizaciones', icon: Users },
  { href: '/admin/planes',       label: 'Planes',         icon: CreditCard },
  { href: '/admin/seo',          label: 'SEO / Indexación', icon: Globe },
  { href: '/admin/metricas',     label: 'Métricas',       icon: BarChart3 },
  { href: '/admin/audit',        label: 'Auditoría',      icon: ShieldCheck },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              active
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
