'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Menu, X } from 'lucide-react'

interface PublicHeaderProps {
  theme?: 'light' | 'dark'
}

export function PublicHeader({ theme = 'light' }: PublicHeaderProps) {
  const [open, setOpen] = useState(false)
  const isDark = theme === 'dark'

  const navLinks = [
    { href: '/buscar',        label: 'Buscar centros' },
    { href: '/para-negocios', label: 'Para negocios'  },
  ]

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${
        isDark
          ? 'border-white/8 bg-dark/80'
          : 'border-zinc-200/80 bg-white/90'
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
          {navLinks.map(({ href, label }) => (
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

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/auth/signin"
            className={`hidden rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:block ${
              isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary-500/20 transition-all hover:bg-primary-700 active:scale-[0.97]"
          >
            Registrarse
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
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isDark
                    ? 'text-zinc-300 hover:bg-white/8 hover:text-white'
                    : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className={`my-2 border-t ${isDark ? 'border-white/8' : 'border-zinc-100'}`} />
            <Link
              href="/auth/signin"
              onClick={() => setOpen(false)}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isDark
                  ? 'text-zinc-300 hover:bg-white/8 hover:text-white'
                  : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
