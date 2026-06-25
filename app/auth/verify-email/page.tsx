import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { verifyEmailToken } from '@/app/actions/auth'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>
}) {
  const { email, token } = await searchParams
  const result = email && token
    ? await verifyEmailToken(email, token)
    : { success: false, message: 'El enlace de verificacion no es valido.' }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f4f8] px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2f6df6] shadow-[0_12px_26px_rgba(47,109,246,0.28)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-black text-[#0c1324]">Belleza Local</span>
        </Link>

        <div className="mt-8 rounded-lg border border-[#d8dee9] bg-white p-8 shadow-[0_24px_70px_rgba(12,19,36,0.08)]">
          <h1 className="text-2xl font-black tracking-tight text-[#0c1324]">
            {result.success ? 'Email verificado' : 'No se pudo verificar'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#647089]">{result.message}</p>
          <Link href="/auth/signin" className="btn-primary mt-6 inline-flex px-5 py-3">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  )
}
