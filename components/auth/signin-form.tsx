'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'

export function SignInForm({ googleEnabled, callbackUrl }: { googleEnabled: boolean; callbackUrl: string }) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setHydrated(true)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const result = await signIn('credentials', { email, password, redirect: false })

    setLoading(false)

    if (result?.error) {
      setError('Email o contrasena incorrectos')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl })
  }

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
          <h1 className="mt-6 text-3xl font-black tracking-tight text-[#0c1324]">Bienvenido de nuevo</h1>
          <p className="mt-1 text-sm text-[#647089]">Entra en tu cuenta para continuar</p>
        </div>

        <div className="rounded-lg border border-[#d8dee9] bg-white p-8 shadow-[0_24px_70px_rgba(12,19,36,0.08)]">
          {error && <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <form method="post" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="signin-email" className="label">Email</label>
              <input id="signin-email" type="email" name="email" required autoComplete="email" className="input-base py-3" placeholder="tu@email.com" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="signin-password" className="text-sm font-semibold text-[#0c1324]">Contrasena</label>
                <Link href="/auth/forgot-password" className="text-xs font-bold text-[#2355c8] hover:text-[#2f6df6]">
                  La has olvidado?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signin-password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="input-base py-3 pr-11"
                  placeholder="********"
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
            <button type="submit" disabled={loading || !hydrated} className="btn-primary w-full py-3">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </button>
          </form>

          {googleEnabled && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#e5eaf2]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-[#8b96aa]">o continua con</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-[#d8dee9] py-3 text-sm font-bold text-[#0c1324] transition-colors hover:bg-[#f7f9fc]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar con Google
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[#647089]">
          No tienes cuenta?{' '}
          <Link href="/auth/signup" className="font-black text-[#2355c8] hover:text-[#2f6df6]">
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
