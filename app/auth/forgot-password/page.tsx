'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { requestPasswordReset } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, null)

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
          <h1 className="mt-6 text-3xl font-black tracking-tight text-[#0c1324]">Recuperar contrasena</h1>
          <p className="mt-1 text-sm text-[#647089]">Te enviaremos un enlace temporal si el email existe.</p>
        </div>

        <div className="rounded-lg border border-[#d8dee9] bg-white p-8 shadow-[0_24px_70px_rgba(12,19,36,0.08)]">
          {state?.success && <div className="mb-5 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.message}</div>}
          {state?.error && <div className="mb-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</div>}

          <form action={action} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input type="email" name="email" required autoComplete="email" className="input-base py-3" placeholder="tu@email.com" />
            </div>

            <button type="submit" disabled={pending} className="btn-primary w-full py-3">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar enlace
            </button>
          </form>
        </div>

        <Link href="/auth/signin" className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm font-bold text-[#2355c8] hover:text-[#2f6df6]">
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>
      </div>
    </div>
  )
}
