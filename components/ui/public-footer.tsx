import Link from 'next/link'
import { CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react'

const FOOTER_GROUPS = [
  {
    title: 'Explorar',
    links: [
      { href: '/buscar', label: 'Servicios' },
      { href: '/productos', label: 'Marketplace' },
      { href: '/precios', label: 'Precios' },
    ],
  },
  {
    title: 'Negocios',
    links: [
      { href: '/para-negocios', label: 'Para negocios' },
      { href: '/auth/signup?tipo=negocio', label: 'Registrar centro' },
      { href: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacidad', label: 'Privacidad' },
      { href: '/terminos', label: 'Terminos' },
      { href: '/cookies', label: 'Cookies' },
    ],
  },
]

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0c1324] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.15fr_repeat(3,0.7fr)] lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2f6df6] shadow-[0_12px_26px_rgba(47,109,246,0.26)]">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="font-black tracking-tight">Belleza Local</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/58">
            Reserva, compra bonos y descubre centros de belleza con disponibilidad clara y confirmacion online.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-xs font-bold text-white/68">
              <ShieldCheck className="h-3.5 w-3.5 text-[#8bb7ff]" />
              Centros verificados
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-xs font-bold text-white/68">
              <CalendarCheck className="h-3.5 w-3.5 text-[#8bb7ff]" />
              Agenda real
            </span>
          </div>
        </div>

        {FOOTER_GROUPS.map(group => (
          <div key={group.title}>
            <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white/80">{group.title}</h2>
            <div className="mt-3 grid gap-2">
              {group.links.map(link => (
                <Link key={link.href} href={link.href} className="text-sm font-semibold text-white/54 transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs font-semibold text-white/42">
        © {new Date().getFullYear()} Belleza Local. Plataforma para reservas, productos y gestion de centros.
      </div>
    </footer>
  )
}
