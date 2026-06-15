import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Cookies — Belleza Local',
  description: 'Información sobre el uso de cookies en la plataforma Belleza Local.',
  robots: { index: false },
}

const LAST_UPDATED = '10 de junio de 2026'

const COOKIES = [
  {
    name: '__Secure-next-auth.session-token',
    purpose: 'Autenticación de sesión de usuario (Auth.js)',
    duration: 'Sesión / 30 días',
    type: 'Técnica esencial',
    provider: 'Belleza Local',
  },
  {
    name: '__Host-next-auth.csrf-token',
    purpose: 'Protección contra ataques CSRF en formularios',
    duration: 'Sesión',
    type: 'Técnica esencial',
    provider: 'Belleza Local',
  },
  {
    name: 'next-auth.callback-url',
    purpose: 'Redirección tras inicio de sesión',
    duration: 'Sesión',
    type: 'Técnica esencial',
    provider: 'Belleza Local',
  },
  {
    name: '__stripe_mid / __stripe_sid',
    purpose: 'Detección de fraude en pagos (Stripe)',
    duration: '1 año / Sesión',
    type: 'Técnica esencial',
    provider: 'Stripe Inc.',
  },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#e5eaf2] px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#2f6df6] to-[#2355c8]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-black tracking-tight text-[#0c1324]">BellezaLocal</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-black tracking-tight text-[#0c1324]">Política de Cookies</h1>
        <p className="mt-2 text-sm text-[#8b96aa]">Última actualización: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-[#273244] [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#0c1324] [&_h2]:mb-3 [&_p]:leading-relaxed">

          <section>
            <h2>¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que un sitio web almacena en tu dispositivo cuando lo visitas.
              Permiten que el sitio recuerde tus preferencias y acciones durante un período de tiempo.
            </p>
          </section>

          <section>
            <h2>¿Qué cookies usa Belleza Local?</h2>
            <p className="mb-4">
              Usamos <strong>únicamente cookies técnicas esenciales</strong>, necesarias para el correcto funcionamiento
              de la plataforma. No utilizamos cookies de análisis, publicidad, seguimiento ni de terceros con fines
              comerciales.
            </p>
            <div className="overflow-x-auto rounded-md border border-[#d8dee9]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5eaf2] bg-[#f1f4f8] text-left">
                    <th className="px-4 py-3 font-semibold text-[#46546b]">Cookie</th>
                    <th className="px-4 py-3 font-semibold text-[#46546b]">Finalidad</th>
                    <th className="px-4 py-3 font-semibold text-[#46546b]">Duración</th>
                    <th className="px-4 py-3 font-semibold text-[#46546b]">Proveedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2f7]">
                  {COOKIES.map((c) => (
                    <tr key={c.name} className="hover:bg-[#f1f4f8]/50">
                      <td className="px-4 py-3 font-mono text-xs text-[#273244] break-all">{c.name}</td>
                      <td className="px-4 py-3 text-[#46546b]">{c.purpose}</td>
                      <td className="px-4 py-3 text-[#647089] whitespace-nowrap">{c.duration}</td>
                      <td className="px-4 py-3 text-[#647089] whitespace-nowrap">{c.provider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>Consentimiento y base legal</h2>
            <p>
              Las cookies listadas son técnicas y esenciales para la prestación del servicio solicitado por el usuario.
              Conforme al art. 22.2 de la LSSI y al considerando 47 del RGPD, no requieren consentimiento expreso
              previo al no tener finalidad analítica ni publicitaria.
            </p>
          </section>

          <section>
            <h2>¿Cómo deshabilitar las cookies?</h2>
            <p>
              Puedes configurar tu navegador para rechazar o eliminar cookies. Ten en cuenta que deshabilitar
              las cookies esenciales impedirá el correcto funcionamiento de la plataforma (no podrás iniciar sesión).
            </p>
            <p className="mt-3">
              Instrucciones para los navegadores más comunes:
            </p>
            <ul className="mt-2 space-y-1 pl-5 list-disc">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#2f6df6] hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-[#2f6df6] hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#2f6df6] hover:underline">Apple Safari</a></li>
              <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-[#2f6df6] hover:underline">Microsoft Edge</a></li>
            </ul>
          </section>

          <section>
            <h2>Cambios en esta política</h2>
            <p>
              Si incorporamos nuevas cookies (por ejemplo, analytics opcionales), actualizaremos esta página y,
              si fuera necesario, solicitaremos tu consentimiento previo mediante un banner informativo.
            </p>
          </section>

          <section>
            <h2>Más información</h2>
            <p>
              Consulta también nuestra{' '}
              <Link href="/privacidad" className="text-[#2f6df6] hover:underline">Política de Privacidad</Link>{' '}
              y nuestros{' '}
              <Link href="/terminos" className="text-[#2f6df6] hover:underline">Términos y Condiciones</Link>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#e5eaf2] px-6 py-8 text-center">
        <div className="flex flex-wrap justify-center gap-4 text-sm text-[#8b96aa]">
          <Link href="/" className="hover:text-[#46546b]">Inicio</Link>
          <Link href="/privacidad" className="hover:text-[#46546b]">Privacidad</Link>
          <Link href="/terminos" className="hover:text-[#46546b]">Términos</Link>
        </div>
      </footer>
    </div>
  )
}
