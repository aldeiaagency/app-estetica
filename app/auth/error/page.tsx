import Link from 'next/link'
import { AlertCircle, Sparkles } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  const messages: Record<string, string> = {
    Configuration: 'Error de configuración del servidor.',
    AccessDenied: 'Acceso denegado.',
    Verification: 'El enlace de verificación expiró o ya fue usado.',
    Default: 'Ocurrió un error al iniciar sesión.',
  }

  const message = messages[error ?? 'Default'] ?? messages.Default

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="mb-8 inline-flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">BellezaLocal</span>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-slate-900">Error de autenticación</h1>
          <p className="mb-6 text-sm text-slate-500">{message}</p>
          <Link
            href="/auth/signin"
            className="inline-block rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
