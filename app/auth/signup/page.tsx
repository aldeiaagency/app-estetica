'use client'

import { Suspense, useActionState, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2, Sparkles, User } from 'lucide-react'
import { registerUser } from '@/app/actions/auth'

function SignUpForm() {
  const searchParams = useSearchParams()
  const isBusiness = searchParams.get('tipo') === 'negocio'
  const [tipo, setTipo] = useState<'cliente' | 'negocio'>(isBusiness ? 'negocio' : 'cliente')
  const [showPassword, setShowPassword] = useState(false)
  const [state, action, pending] = useActionState(registerUser, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f4ef] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e36952] shadow-[0_12px_26px_rgba(227,105,82,0.28)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-black text-[#171412]">Belleza Local</span>
          </Link>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-[#171412]">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-[#6c625a]">Gratis. Sin tarjeta. En 30 segundos.</p>
        </div>

        <div className="mb-6 flex rounded-lg border border-[#e5ded3] bg-white p-1 shadow-[0_16px_42px_rgba(42,32,24,0.05)]">
          <button
            type="button"
            onClick={() => setTipo('cliente')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all ${
              tipo === 'cliente' ? 'bg-[#171412] text-white' : 'text-[#6c625a] hover:bg-[#f7f4ef] hover:text-[#171412]'
            }`}
          >
            <User className="h-4 w-4" />
            Soy cliente
          </button>
          <button
            type="button"
            onClick={() => setTipo('negocio')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all ${
              tipo === 'negocio' ? 'bg-[#171412] text-white' : 'text-[#6c625a] hover:bg-[#f7f4ef] hover:text-[#171412]'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Tengo un negocio
          </button>
        </div>

        <div className="rounded-lg border border-[#e5ded3] bg-white p-8 shadow-[0_24px_70px_rgba(42,32,24,0.08)]">
          {state?.error && <div className="mb-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</div>}

          <form action={action} className="space-y-4">
            <input type="hidden" name="role" value={tipo === 'negocio' ? 'BUSINESS_ADMIN' : 'CUSTOMER'} />

            {tipo === 'negocio' && (
              <div>
                <label className="label">Nombre del negocio</label>
                <input type="text" name="businessName" required className="input-base py-3" placeholder="Peluqueria Ana Garcia" />
              </div>
            )}

            <div>
              <label className="label">Tu nombre</label>
              <input type="text" name="name" required className="input-base py-3" placeholder="Nombre completo" />
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" name="email" required autoComplete="email" className="input-base py-3" placeholder="tu@email.com" />
            </div>

            <div>
              <label className="label">Contrasena</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input-base py-3 pr-11"
                  placeholder="Minimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8f84] hover:text-[#171412]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md bg-[#fbfaf7] p-4">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#e36952]" />
              <label className="text-xs leading-relaxed text-[#6c625a]">
                Acepto los{' '}
                <Link href="/terminos" className="font-bold text-[#9f3f2f] underline">terminos</Link>
                {' '}y la{' '}
                <Link href="/privacidad" className="font-bold text-[#9f3f2f] underline">politica de privacidad</Link>.
              </label>
            </div>

            <button type="submit" disabled={pending} className="btn-primary w-full py-3">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {tipo === 'negocio' ? 'Crear cuenta de negocio' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[#6c625a]">
          Ya tienes cuenta?{' '}
          <Link href="/auth/signin" className="font-black text-[#9f3f2f] hover:text-[#e36952]">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}
