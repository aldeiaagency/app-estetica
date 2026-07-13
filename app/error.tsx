'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled application error', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f1f4f8] px-4">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-[#b42318]" />
        <h1 className="mt-5 text-2xl font-black text-[#0c1324]">No hemos podido completar esta accion</h1>
        <p className="mt-2 text-sm leading-6 text-[#647089]">Puedes intentarlo de nuevo. Si el problema continua, vuelve al inicio.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary"><RotateCcw className="h-4 w-4" />Reintentar</button>
          <Link href="/" className="btn-secondary">Ir al inicio</Link>
        </div>
      </div>
    </main>
  )
}
