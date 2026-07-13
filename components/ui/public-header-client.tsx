'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Calendar, ListChecks, Menu, ShoppingBag, Sparkles, Store, User, X } from 'lucide-react'

interface PublicHeaderProps {
  theme?: 'light' | 'dark'
  features: {
    marketplace: boolean
    products: boolean
    beautyConcierge: boolean
  }
}

const NAV_LINKS = [
  { href: '/mi-plan', label: 'Mi plan', icon: Sparkles },
  { href: '/rutina', label: 'Rutina', icon: ListChecks },
  { href: '/buscar', label: 'Servicios', icon: Calendar },
  { href: '/productos', label: 'Marketplace', icon: Store },
  { href: '/precios', label: 'Precios', icon: null },
  { href: '/para-negocios', label: 'Para negocios', icon: Building2 },
]

export function PublicHeaderClient({ theme = 'light', features }: PublicHeaderProps) {
  const [open, setOpen] = useState(false)
  const isDark = theme === 'dark'
  const navLinks = NAV_LINKS.filter(link => {
    if (link.href === '/mi-plan' || link.href === '/rutina') return features.beautyConcierge
    if (link.href === '/productos') return features.marketplace && features.products
    return true
  })

  const headerClass = isDark
    ? 'border-white/10 bg-[#0c1324]/92'
    : 'border-[#d8dee9]/90 bg-[#f1f4f8]/92'
  const navLinkClass = isDark
    ? 'text-white/78 hover:bg-white/10 hover:text-white'
    : 'text-[#647089] hover:bg-[#e5edff] hover:text-[#0c1324]'
  const actionLinkClass = isDark
    ? 'text-white/88 hover:bg-white/12 hover:text-white'
    : 'text-[#647089] hover:bg-[#e5edff] hover:text-[#0c1324]'
  const mobilePanelClass = isDark
    ? 'border-white/10 bg-[#0c1324] shadow-[0_22px_55px_rgba(0,0,0,0.28)]'
    : 'border-[#d8dee9] bg-[#f1f4f8] shadow-[0_22px_55px_rgba(12,19,36,0.08)]'
  const mobileLinkClass = isDark
    ? 'text-white/88 hover:bg-white/10 hover:text-white'
    : 'text-[#0c1324] hover:bg-[#e5edff] hover:text-[#0c1324]'

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${headerClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2f6df6] shadow-[0_12px_26px_rgba(47,109,246,0.26)] transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0c1324]'}`}>
            Belleza Local
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${navLinkClass}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/diagnostico"
            className={`hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-colors sm:flex ${
              isDark
                ? 'bg-white text-[#0c1324] hover:bg-white/90'
                : 'bg-[#0c1324] text-white hover:bg-[#1f2a44]'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Crear perfil
          </Link>
          {features.marketplace && features.products && (
            <Link
              href="/carrito"
              aria-label="Carrito"
              className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${actionLinkClass}`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
            </Link>
          )}
          <Link
            href="/cuenta"
            className={`hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:flex ${actionLinkClass}`}
          >
            <User className="h-4 w-4" />
            Mi cuenta
          </Link>
          <button
            onClick={() => setOpen(prev => !prev)}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors md:hidden ${actionLinkClass}`}
            aria-label={open ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className={`border-t md:hidden ${mobilePanelClass}`}>
          <nav className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition-colors ${mobileLinkClass}`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
                {label}
              </Link>
            ))}
            <div className={`my-2 border-t ${isDark ? 'border-white/10' : 'border-[#d8dee9]'}`} />
            <Link
              href="/diagnostico"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold transition-colors ${
                isDark
                  ? 'bg-white text-[#0c1324] hover:bg-white/90'
                  : 'bg-[#0c1324] text-white hover:bg-[#1f2a44]'
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              Crear Beauty Profile
            </Link>
            <Link
              href="/cuenta"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition-colors ${mobileLinkClass}`}
            >
              <User className="h-4 w-4 shrink-0 opacity-70" />
              Mi cuenta
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
