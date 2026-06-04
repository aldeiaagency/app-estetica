import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  robots: { index: false },
}

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { tipo?: string }
}) {
  const isBusiness = searchParams.tipo === 'negocio'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffaf7] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black">
            Belleza<span className="text-[#9d5c63]">Local</span>
          </Link>
          <h1 className="mt-6 text-2xl font-black tracking-tight">
            {isBusiness ? 'Registra tu negocio' : 'Crea tu cuenta'}
          </h1>
          <p className="mt-2 text-sm text-[#756b6b]">
            {isBusiness
              ? 'Digitaliza tu centro y empieza a recibir reservas'
              : 'Reserva en los mejores centros de belleza'}
          </p>
        </div>

        {/* Tipo de cuenta */}
        {!isBusiness && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <Link
              href="/auth/signup"
              className="rounded-xl border-2 border-[#9d5c63] bg-[#9d5c63] py-3 text-center text-sm font-bold text-white"
            >
              Soy cliente
            </Link>
            <Link
              href="/auth/signup?tipo=negocio"
              className="rounded-xl border-2 border-[#eadfdc] py-3 text-center text-sm font-bold text-[#756b6b] hover:border-[#9d5c63]"
            >
              Tengo un negocio
            </Link>
          </div>
        )}

        <div className="rounded-2xl border border-[#eadfdc] bg-white p-8">
          <form className="space-y-4">
            {isBusiness && (
              <div>
                <label className="mb-1.5 block text-sm font-bold">Nombre del negocio</label>
                <input
                  type="text"
                  name="businessName"
                  required
                  className="w-full rounded-xl border border-[#eadfdc] px-4 py-3 text-sm outline-none focus:border-[#9d5c63]"
                  placeholder="Peluquería Ana García"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-bold">Tu nombre</label>
              <input
                type="text"
                name="name"
                required
                className="w-full rounded-xl border border-[#eadfdc] px-4 py-3 text-sm outline-none focus:border-[#9d5c63]"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold">Email</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-[#eadfdc] px-4 py-3 text-sm outline-none focus:border-[#9d5c63]"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold">Contraseña</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-[#eadfdc] px-4 py-3 text-sm outline-none focus:border-[#9d5c63]"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#fffaf7] p-4">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#9d5c63]" />
              <label className="text-xs text-[#756b6b]">
                Acepto los{' '}
                <Link href="/legal/terminos" className="underline">
                  términos y condiciones
                </Link>{' '}
                y la{' '}
                <Link href="/legal/privacidad" className="underline">
                  política de privacidad
                </Link>
                .
              </label>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#9d5c63] py-3 font-bold text-white hover:bg-[#7a4650]"
            >
              {isBusiness ? 'Crear cuenta de negocio' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[#756b6b]">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/signin" className="font-bold text-[#9d5c63] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
