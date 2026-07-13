'use client'

import { Suspense, useActionState, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import { resetPassword } from '@/app/actions/auth'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const [showPassword, setShowPassword] = useState(false)
  const [state, action, pending] = useActionState(resetPassword, null)

  const missingParams = !email || !token

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f4f8] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2f6df6] shadow-[0_12px_26px_rgba(47,109,246,0.28)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-black text-[#0c1324]">Belleza Local</span>
          </Link>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-[#0c1324]">Nueva contrasena</h1>
          <p className="mt-1 text-sm text-[#647089]">Usa al menos 10 caracteres, con mayuscula, minuscula y numero.</p>
        </div>

        <div className="rounded-lg border border-[#d8dee9] bg-white p-8 shadow-[0_24px_70px_rgba(12,19,36,0.08)]">
          {missingParams ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              El enlace no es valido. Solicita uno nuevo.
            </div>
          ) : (
            <>
              {state?.success && <div className="mb-5 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.message}</div>}
              {state?.error && <div className="mb-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</div>}

              <form action={action} className="space-y-5">
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="token" value={token} />

                <div>
                  <label htmlFor="reset-password" className="label">Nueva contrasena</label>
                  <div className="relative">
                    <input
                      id="reset-password" type={showPassword ? 'text' : 'password'}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b96aa] hover:text-[#0c1324]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={pending || state?.success} className="btn-primary w-full py-3">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cambiar contrasena
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[#647089]">
          <Link href="/auth/signin" className="font-black text-[#2355c8] hover:text-[#2f6df6]">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
