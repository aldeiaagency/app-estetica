'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Menu, X, ShoppingBag, User, Calendar, Store, Building2 } from 'lucide-react'

interface PublicHeaderProps {
  theme?: 'light' | 'dark'
}

// Navegación tipo web pública: explorar libremente. El login/registro solo
// se solicita al reservar o comprar (o al entrar en "Mi cuenta").
const NAV_LINKS = [
  { href: '/buscar',        label: 'Servicios',     icon: Calendar },
  { href: '/productos',     label: 'Marketplace',   icon: Store },
  { href: '/precios',       label: 'Precios',       icon: null },
  { href: '/para-negocios', label: 'Para negocios', icon: Building2 },
]

export function PublicHeader({ theme = 'light' }: PublicHeaderProps) {
  const [open, setOpen] = useState(false)
  const isDark = theme === 'dark'

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${
        isDark ? 'border-white/8 bg-dark/80' : 'border-zinc-200/80 bg-white/90'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25 transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            BellezaLocal
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:bg-white/8 hover:text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Acciones: carrito + cuenta (login solo al comprar/reservar) */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/carrito"
            aria-label="Carrito"
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
              isDark ? 'text-zinc-300 hover:bg-white/8 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href="/cuenta"
            className={`hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:flex ${
              isDark ? 'text-zinc-300 hover:bg-white/8 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <User className="h-4 w-4" />Mi cuenta
          </Link>
          <button
            onClick={() => setOpen(prev => !prev)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors md:hidden ${
              isDark ? 'text-zinc-400 hover:bg-white/8' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <div className={`border-t md:hidden ${isDark ? 'border-white/8 bg-dark' : 'border-zinc-100 bg-white'}`}>
          <nav className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isDark
                    ? 'text-zinc-300 hover:bg-white/8 hover:text-white'
                    : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
                {label}
              </Link>
            ))}
            <div className={`my-2 border-t ${isDark ? 'border-white/8' : 'border-zinc-100'}`} />
            <Link
              href="/cuenta"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isDark ? 'text-zinc-300 hover:bg-white/8 hover:text-white' : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <User className="h-4 w-4 shrink-0 opacity-70" />Mi cuenta
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
