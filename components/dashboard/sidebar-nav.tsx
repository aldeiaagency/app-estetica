'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, ClipboardList, Users,
  Scissors, UserCircle, Clock, Star, BarChart3,
  Settings, Gift, Tag, Package, ShoppingBag, LogOut, Sparkles
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Agenda',
    items: [
      { href: '/dashboard',          label: 'Resumen',       icon: LayoutDashboard },
      { href: '/dashboard/reservas', label: 'Reservas',      icon: Calendar        },
      { href: '/dashboard/clientes', label: 'Clientes',      icon: Users           },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { href: '/dashboard/servicios',   label: 'Servicios',   icon: Scissors    },
      { href: '/dashboard/staff',       label: 'Staff',       icon: UserCircle  },
      { href: '/dashboard/horarios',    label: 'Horarios',    icon: Clock       },
      { href: '/dashboard/bonos',       label: 'Bonos',       icon: Gift        },
      { href: '/dashboard/productos',   label: 'Productos',   icon: ShoppingBag },
      { href: '/dashboard/promociones', label: 'Promociones', icon: Tag         },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { href: '/dashboard/resenas',       label: 'Reseñas',      icon: Star      },
      { href: '/dashboard/analitica',     label: 'Analítica',    icon: BarChart3 },
      { href: '/dashboard/plan',          label: 'Mi plan',      icon: Package   },
      { href: '/dashboard/configuracion', label: 'Configuración',icon: Settings  },
    ],
  },
]

interface SidebarNavProps {
  userName?: string | null
  userEmail?: string | null
  centerName?: string | null
}

export function SidebarNav({ userName, userEmail, centerName }: SidebarNavProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-[#09090B] border-r border-white/6">
      {/* Logo */}
      <div className="border-b border-white/6 px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30 transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-black tracking-tight text-white">BellezaLocal</span>
        </Link>
        {centerName && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="truncate text-xs text-zinc-400">{centerName}</span>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-primary-600/15 text-primary-300 shadow-inner'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary-400' : ''}`} />
                    {label}
                    {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-400" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/6 p-3">
        <div className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600/20 text-xs font-bold text-primary-300">
            {userName?.[0] ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{userName}</p>
            <p className="truncate text-xs text-zinc-500">{userEmail}</p>
          </div>
        </div>
        <Link
          href="/auth/signout"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Link>
      </div>
    </aside>
  )
}
