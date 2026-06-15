'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Calendar, Menu, ShoppingBag, Sparkles, Store, User, X } from 'lucide-react'

interface PublicHeaderProps {
  theme?: 'light' | 'dark'
}

const NAV_LINKS = [
  { href: '/buscar', label: 'Servicios', icon: Calendar },
  { href: '/productos', label: 'Marketplace', icon: Store },
  { href: '/precios', label: 'Precios', icon: null },
  { href: '/para-negocios', label: 'Para negocios', icon: Building2 },
]

export function PublicHeader({ theme = 'light' }: PublicHeaderProps) {
  const [open, setOpen] = useState(false)
  const isDark = theme === 'dark'

  const headerClass = isDark
    ? 'border-white/10 bg-[#171412]/86'
    : 'border-[#e5ded3]/90 bg-[#f7f4ef]/92'
  const linkClass = isDark
    ? 'text-white/64 hover:bg-white/10 hover:text-white'
    : 'text-[#5f554d] hover:bg-[#eee7dd] hover:text-[#171412]'

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${headerClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e36952] shadow-[0_12px_26px_rgba(227,105,82,0.28)] transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-[#171412]'}`}>
            Belleza Local
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${linkClass}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/carrito"
            aria-label="Carrito"
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${linkClass}`}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href="/cuenta"
            className={`hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:flex ${linkClass}`}
          >
            <User className="h-4 w-4" />
            Mi cuenta
          </Link>
          <button
            onClick={() => setOpen(prev => !prev)}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors md:hidden ${linkClass}`}
            aria-label={open ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className={`border-t md:hidden ${isDark ? 'border-white/10 bg-[#171412]' : 'border-[#e5ded3] bg-[#f7f4ef]'}`}>
          <nav className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition-colors ${linkClass}`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
                {label}
              </Link>
            ))}
            <div className={`my-2 border-t ${isDark ? 'border-white/10' : 'border-[#e5ded3]'}`} />
            <Link
              href="/cuenta"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition-colors ${linkClass}`}
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
