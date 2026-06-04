'use client'

import { useState, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Eye, EyeOff, Loader2, Building2, User } from 'lucide-react'
import { registerUser } from '@/app/actions/auth'
import { Suspense } from 'react'

function SignUpForm() {
  const searchParams = useSearchParams()
  const isBusiness = searchParams.get('tipo') === 'negocio'
  const [tipo, setTipo] = useState<'cliente' | 'negocio'>(isBusiness ? 'negocio' : 'cliente')
  const [showPassword, setShowPassword] = useState(false)
  const [state, action, pending] = useActionState(registerUser, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">BellezaLocal</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">Gratis. Sin tarjeta. En 30 segundos.</p>
        </div>

        {/* Tipo selector */}
        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setTipo('cliente')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tipo === 'cliente' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="h-4 w-4" /> Soy cliente
          </button>
          <button
            onClick={() => setTipo('negocio')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tipo === 'negocio' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="h-4 w-4" /> Tengo un negocio
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {state?.error && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <input type="hidden" name="role" value={tipo === 'negocio' ? 'BUSINESS_ADMIN' : 'CUSTOMER'} />

            {tipo === 'negocio' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nombre del negocio
                </label>
                <input
                  type="text"
                  name="businessName"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  placeholder="Peluquería Ana García"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tu nombre</label>
              <input
                type="text"
                name="name"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-rose-600" />
              <label className="text-xs leading-relaxed text-slate-500">
                Acepto los{' '}
                <Link href="/legal/terminos" className="text-rose-600 underline">términos</Link>
                {' '}y la{' '}
                <Link href="/legal/privacidad" className="text-rose-600 underline">política de privacidad</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {tipo === 'negocio' ? 'Crear cuenta de negocio' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/signin" className="font-semibold text-rose-600 hover:text-rose-700">
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
