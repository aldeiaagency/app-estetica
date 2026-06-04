import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Belleza Local — Reserva en centros de belleza cerca de ti',
  description:
    'Encuentra y reserva en los mejores centros de belleza, estética, peluquería y bienestar cerca de ti. Disponibilidad real. Sin llamar.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fffaf7]">
      {/* Header */}
      <header className="border-b border-[#eadfdc] bg-[#fffaf7]">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-4">
          <Link href="/" className="text-2xl font-black tracking-tight">
            Belleza<span className="text-[#9d5c63]">Local</span>
          </Link>
          <nav className="hidden gap-6 text-sm text-[#756b6b] md:flex">
            <Link href="/buscar" className="hover:text-[#211b1c]">Buscar centros</Link>
            <Link href="/auth/signup?tipo=negocio" className="hover:text-[#211b1c]">Para negocios</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="hidden text-sm text-[#756b6b] hover:text-[#211b1c] md:block"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup?tipo=negocio"
              className="rounded-full bg-[#9d5c63] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#7a4650]"
            >
              Registra tu negocio
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#eadfdc] bg-white px-4 py-2 text-sm font-bold text-[#3d7b73]">
              ✨ Reserva en segundos, sin llamar
            </div>
            <h1 className="mb-6 text-5xl font-black leading-[0.95] tracking-[-0.05em] md:text-7xl">
              Encuentra tu centro de belleza{' '}
              <span className="text-[#9d5c63]">cerca de ti</span>
            </h1>
            <p className="mb-10 text-xl text-[#756b6b]">
              Peluquerías, estética, uñas, depilación, masajes y más. Disponibilidad real.
              Reserva online en segundos.
            </p>

            {/* Search bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#eadfdc] bg-white p-4 shadow-sm sm:flex-row">
              <input
                type="text"
                placeholder="¿Qué buscas? Peluquería, depilación, uñas..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#756b6b]"
              />
              <div className="h-px w-full bg-[#eadfdc] sm:h-auto sm:w-px" />
              <input
                type="text"
                placeholder="¿Dónde? Madrid, Barcelona..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#756b6b]"
              />
              <Link
                href="/buscar"
                className="rounded-xl bg-[#211b1c] px-6 py-3 text-sm font-bold text-white hover:bg-[#3a3031]"
              >
                Buscar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="mb-8 text-center text-2xl font-black tracking-tight">
            ¿Qué buscas hoy?
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/buscar?categoria=${cat.slug}`}
                className="flex flex-col items-center gap-3 rounded-2xl border border-[#eadfdc] bg-white p-5 text-center hover:border-[#9d5c63] hover:shadow-sm"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-sm font-bold">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Para negocios */}
      <section className="border-t border-[#eadfdc] bg-[#211b1c] px-4 py-20 text-white">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-4xl font-black tracking-tight">
              ¿Tienes un negocio de belleza?
            </h2>
            <p className="mb-8 text-lg text-[#eadfdc]">
              Digitaliza tu centro en 10 minutos. Recibe reservas 24/7. Sin comisiones
              sobre tus reservas. Desde 24 €/mes.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/signup?tipo=negocio"
                className="rounded-full bg-[#9d5c63] px-8 py-4 font-bold hover:bg-[#7a4650]"
              >
                Empieza gratis 14 días
              </Link>
              <Link
                href="/para-negocios"
                className="rounded-full border border-[#756b6b] px-8 py-4 font-bold hover:border-white"
              >
                Ver planes y precios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#eadfdc] px-4 py-12 text-sm text-[#756b6b]">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-4 md:flex-row">
          <span className="font-black text-[#211b1c]">
            Belleza<span className="text-[#9d5c63]">Local</span>
          </span>
          <div className="flex gap-6">
            <Link href="/legal/privacidad" className="hover:text-[#211b1c]">Privacidad</Link>
            <Link href="/legal/cookies" className="hover:text-[#211b1c]">Cookies</Link>
            <Link href="/legal/aviso-legal" className="hover:text-[#211b1c]">Aviso legal</Link>
            <Link href="/legal/terminos" className="hover:text-[#211b1c]">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const CATEGORIES = [
  { name: 'Peluquería', slug: 'peluqueria', emoji: '✂️' },
  { name: 'Estética', slug: 'estetica', emoji: '💆' },
  { name: 'Uñas', slug: 'unas', emoji: '💅' },
  { name: 'Depilación', slug: 'depilacion', emoji: '✨' },
  { name: 'Masajes', slug: 'masajes', emoji: '🧘' },
  { name: 'Spa', slug: 'spa', emoji: '🛁' },
]
