'use client'

import { Suspense, useActionState, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2, Sparkles, User } from 'lucide-react'
import { registerUser } from '@/app/actions/auth'

function SignUpForm() {
  const searchParams = useSearchParams()
  const requestedPlan = searchParams.get('plan')?.toLowerCase()
  const plan = ['presencia', 'growth', 'elite'].includes(requestedPlan ?? '') ? requestedPlan! : 'presencia'
  const isBusiness = searchParams.get('tipo') === 'negocio' || searchParams.has('plan')
  const [tipo, setTipo] = useState<'cliente' | 'negocio'>(isBusiness ? 'negocio' : 'cliente')
  const [showPassword, setShowPassword] = useState(false)
  const [state, action, pending] = useActionState(registerUser, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f4f8] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2f6df6] shadow-[0_12px_26px_rgba(47,109,246,0.28)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-black text-[#0c1324]">Belleza Local</span>
          </Link>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-[#0c1324]">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-[#647089]">Gratis. Sin tarjeta. En 30 segundos.</p>
        </div>

        <div className="mb-6 flex rounded-lg border border-[#d8dee9] bg-white p-1 shadow-[0_16px_42px_rgba(12,19,36,0.05)]">
          <button
            type="button"
            onClick={() => setTipo('cliente')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all ${
              tipo === 'cliente' ? 'bg-[#0c1324] text-white' : 'text-[#647089] hover:bg-[#f1f4f8] hover:text-[#0c1324]'
            }`}
          >
            <User className="h-4 w-4" />
            Soy cliente
          </button>
          <button
            type="button"
            onClick={() => setTipo('negocio')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all ${
              tipo === 'negocio' ? 'bg-[#0c1324] text-white' : 'text-[#647089] hover:bg-[#f1f4f8] hover:text-[#0c1324]'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Tengo un negocio
          </button>
        </div>

        <div className="rounded-lg border border-[#d8dee9] bg-white p-8 shadow-[0_24px_70px_rgba(12,19,36,0.08)]">
          {state?.error && <div className="mb-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</div>}

          <form action={action} className="space-y-4">
            <input type="hidden" name="role" value={tipo === 'negocio' ? 'BUSINESS_ADMIN' : 'CUSTOMER'} />
            {tipo === 'negocio' && <input type="hidden" name="plan" value={plan} />}

            {tipo === 'negocio' && (
              <div>
                <label htmlFor="signup-business" className="label">Nombre del negocio</label>
                <input id="signup-business" type="text" name="businessName" required className="input-base py-3" placeholder="Peluqueria Ana Garcia" />
              </div>
            )}

            <div>
              <label htmlFor="signup-name" className="label">Tu nombre</label>
              <input id="signup-name" type="text" name="name" required className="input-base py-3" placeholder="Nombre completo" />
            </div>

            <div>
              <label htmlFor="signup-email" className="label">Email</label>
              <input id="signup-email" type="email" name="email" required autoComplete="email" className="input-base py-3" placeholder="tu@email.com" />
            </div>

            <div>
              <label htmlFor="signup-password" className="label">Contrasena</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signup-password"
                  name="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  className="input-base py-3 pr-11"
                  placeholder="10+ caracteres, mayuscula y numero"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b96aa] hover:text-[#0c1324]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md bg-[#f7f9fc] p-4">
              <input name="termsAccepted" type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#2f6df6]" />
              <label className="text-xs leading-relaxed text-[#647089]">
                Acepto los{' '}
                <Link href="/terminos" className="font-bold text-[#2355c8] underline">terminos</Link>
                {' '}y la{' '}
                <Link href="/privacidad" className="font-bold text-[#2355c8] underline">politica de privacidad</Link>.
              </label>
            </div>

            <button type="submit" disabled={pending} className="btn-primary w-full py-3">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {tipo === 'negocio' ? 'Crear cuenta de negocio' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[#647089]">
          Ya tienes cuenta?{' '}
          <Link href="/auth/signin" className="font-black text-[#2355c8] hover:text-[#2f6df6]">
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
