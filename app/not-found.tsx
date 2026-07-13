import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f1f4f8] px-4">
      <div className="max-w-md text-center">
        <SearchX className="mx-auto h-10 w-10 text-[#2f6df6]" />
        <h1 className="mt-5 text-2xl font-black text-[#0c1324]">Esta pagina no existe</h1>
        <p className="mt-2 text-sm leading-6 text-[#647089]">Puede que el enlace haya cambiado o que el contenido ya no este disponible.</p>
        <Link href="/" className="btn-primary mt-6">Volver al inicio</Link>
      </div>
    </main>
  )
}
