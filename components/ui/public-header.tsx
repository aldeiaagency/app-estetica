import Link from 'next/link'
import { Sparkles, Menu } from 'lucide-react'

interface PublicHeaderProps {
  theme?: 'light' | 'dark'
}

export function PublicHeader({ theme = 'light' }: PublicHeaderProps) {
  const isDark = theme === 'dark'

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
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25 transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            BellezaLocal
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/buscar"
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              isDark
                ? 'text-zinc-400 hover:bg-white/8 hover:text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            Buscar centros
          </Link>
          <Link
            href="/para-negocios"
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              isDark
                ? 'text-zinc-400 hover:bg-white/8 hover:text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            Para negocios
          </Link>
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
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors md:hidden ${
              isDark ? 'text-zinc-400 hover:bg-white/8' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
            aria-label="Menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
