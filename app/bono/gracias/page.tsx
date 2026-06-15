import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bono confirmado',
  robots: { index: false },
}

export default function BonoGraciasPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f1f4f8]">
      <header className="border-b border-[#d8dee9] bg-white px-4 py-3.5">
        <div className="mx-auto flex max-w-[640px] items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5 font-black text-[#0c1324]">
            <Sparkles className="h-4 w-4 text-[#2f6df6]" />BellezaLocal
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[560px] flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-[#0c1324]">¡Pago confirmado!</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#647089]">
          Tu bono ha quedado activado y asociado a tu email. El centro ya tiene tus datos y
          podrás usarlo en tus próximas citas. Recibirás la confirmación por correo.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/buscar" className="btn-primary">Reservar una cita</Link>
          <Link href="/" className="btn-outline">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
