'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Calendar,
  Clock,
  Gem,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareText,
  Package,
  Repeat2,
  Scissors,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  UserCircle,
  Users,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Agenda',
    items: [
      { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
      { href: '/dashboard/reservas', label: 'Reservas', icon: Calendar },
      { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
    ],
  },
  {
    label: 'Catalogo',
    items: [
      { href: '/dashboard/servicios', label: 'Servicios', icon: Scissors },
      { href: '/dashboard/staff', label: 'Staff', icon: UserCircle },
      { href: '/dashboard/horarios', label: 'Horarios', icon: Clock },
      { href: '/dashboard/packs', label: 'Packs', icon: Gem },
      { href: '/dashboard/bonos', label: 'Bonos', icon: Gift },
      { href: '/dashboard/productos', label: 'Productos', icon: ShoppingBag },
      { href: '/dashboard/pedidos', label: 'Pedidos', icon: ShoppingCart },
      { href: '/dashboard/promociones', label: 'Promociones', icon: Tag },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { href: '/dashboard/resenas', label: 'Resenas', icon: Star },
      { href: '/dashboard/beneficios', label: 'Beneficios', icon: Sparkles },
      { href: '/dashboard/seguimientos', label: 'Seguimientos', icon: MessageSquareText },
      { href: '/dashboard/recurrencia', label: 'Recurrencia', icon: Repeat2 },
      { href: '/dashboard/campanas', label: 'Campanas', icon: Megaphone },
      { href: '/dashboard/analitica', label: 'Analitica', icon: BarChart3 },
      { href: '/dashboard/plan', label: 'Mi plan', icon: Package },
      { href: '/dashboard/configuracion', label: 'Configuracion', icon: Settings },
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
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0c1324]">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2f6df6] shadow-[0_12px_26px_rgba(47,109,246,0.28)] transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-black tracking-tight text-white">Belleza Local</span>
        </Link>
        {centerName && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#9fc4aa]" />
            <span className="truncate text-xs text-white/52">{centerName}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-white/34">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-[#2f6df6] text-white shadow-[0_12px_30px_rgba(47,109,246,0.22)]'
                        : 'text-white/54 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                    {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-1 flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
            {userName?.[0] ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{userName}</p>
            <p className="truncate text-xs text-white/40">{userEmail}</p>
          </div>
        </div>
        <Link
          href="/auth/signout"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/46 transition-colors hover:bg-white/8 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </Link>
      </div>
    </aside>
  )
}
