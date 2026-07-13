import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f1f4f8]" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-semibold text-[#46546b]">
        <Loader2 className="h-5 w-5 animate-spin text-[#2f6df6]" />
        Cargando...
      </div>
    </main>
  )
}
