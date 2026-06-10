import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Belleza Local',
  description: 'Términos y condiciones de uso de la plataforma Belleza Local.',
  robots: { index: false },
}

const LAST_UPDATED = '10 de junio de 2026'
const EMAIL_LEGAL = 'legal@bellezalocal.es'

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-100 px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-black tracking-tight text-zinc-900">BellezaLocal</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Términos y Condiciones</h1>
        <p className="mt-2 text-sm text-zinc-400">Última actualización: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-zinc-700 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h2]:mb-3 [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:leading-relaxed">

          <section>
            <h2>1. Objeto</h2>
            <p>
              Los presentes Términos y Condiciones (en adelante, «Términos») regulan el acceso y uso de la
              plataforma <strong>Belleza Local</strong>, operada por Belleza Local S.L. (en adelante, «la Empresa»),
              que permite a consumidores buscar y reservar citas en centros de belleza, estética y bienestar,
              y a profesionales gestionar sus agendas, ventas y clientes.
            </p>
          </section>

          <section>
            <h2>2. Aceptación</h2>
            <p>
              El acceso y uso de la plataforma implica la aceptación plena y sin reservas de estos Términos.
              Si no estás de acuerdo, debes abstenerte de usar el servicio. La Empresa se reserva el derecho
              de modificar estos Términos notificándolo con al menos 15 días de antelación.
            </p>
          </section>

          <section>
            <h2>3. Tipos de usuario</h2>
            <ul>
              <li><strong>Cliente:</strong> persona que usa la plataforma para buscar y reservar servicios de belleza.</li>
              <li><strong>Negocio:</strong> profesional o empresa que publica su centro y gestiona reservas a través del dashboard.</li>
              <li><strong>Administrador de plataforma:</strong> empleado de Belleza Local con acceso al panel de administración.</li>
            </ul>
          </section>

          <section>
            <h2>4. Registro y cuenta</h2>
            <ul>
              <li>Debes tener al menos 18 años para registrarte.</li>
              <li>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
              <li>Debes proporcionar información veraz y mantenerla actualizada.</li>
              <li>Notifícanos de inmediato si sospechas de acceso no autorizado a tu cuenta.</li>
              <li>La Empresa puede suspender cuentas que incumplan estos Términos.</li>
            </ul>
          </section>

          <section>
            <h2>5. Reservas</h2>
            <ul>
              <li>Las reservas son vinculantes para ambas partes (cliente y negocio) una vez confirmadas.</li>
              <li>La política de cancelación y modificación la establece cada centro de manera independiente.</li>
              <li>Belleza Local actúa como intermediario tecnológico y no es parte del contrato de servicio entre cliente y negocio.</li>
              <li>Los recordatorios automáticos por email son informativos; la no recepción no exime de las obligaciones de cancelación.</li>
            </ul>
          </section>

          <section>
            <h2>6. Planes de suscripción (negocios)</h2>
            <ul>
              <li>Los planes se renuevan automáticamente de forma mensual salvo cancelación antes del período de renovación.</li>
              <li>Los precios pueden actualizarse con un preaviso de 30 días.</li>
              <li>Los reembolsos se rigen por la política de Stripe y las leyes de protección al consumidor aplicables.</li>
              <li>El plan Basic es gratuito y puede tener limitaciones de funcionalidades.</li>
            </ul>
          </section>

          <section>
            <h2>7. Pagos</h2>
            <p>
              Los pagos se procesan de forma segura a través de <strong>Stripe</strong>.
              Belleza Local no almacena datos de tarjeta de crédito o débito.
              Al realizar un pago, aceptas también los{' '}
              <a href="https://stripe.com/es/legal" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                Términos de Servicio de Stripe
              </a>.
            </p>
          </section>

          <section>
            <h2>8. Contenido y conducta</h2>
            <ul>
              <li>El contenido publicado (descripciones, imágenes, reseñas) debe ser veraz, lícito y respetuoso.</li>
              <li>Queda prohibido el uso de la plataforma para spam, fraude, suplantación de identidad o cualquier actividad ilícita.</li>
              <li>Las reseñas deben estar basadas en experiencias reales y verificadas.</li>
              <li>La Empresa puede retirar contenido que incumpla estas normas sin previo aviso.</li>
            </ul>
          </section>

          <section>
            <h2>9. Propiedad intelectual</h2>
            <p>
              La plataforma, su código, diseño, marca y contenidos son propiedad de Belleza Local S.L. o de
              sus licenciantes. No se concede ninguna licencia de uso más allá del acceso personal y no comercial
              al servicio.
            </p>
          </section>

          <section>
            <h2>10. Limitación de responsabilidad</h2>
            <p>
              Belleza Local es una plataforma de intermediación tecnológica. No garantiza la disponibilidad,
              calidad o idoneidad de los servicios ofrecidos por los centros. En ningún caso la responsabilidad
              total de la Empresa superará el importe abonado por el usuario en los 12 meses anteriores al hecho
              que origine la reclamación.
            </p>
          </section>

          <section>
            <h2>11. Disponibilidad del servicio</h2>
            <p>
              La Empresa realizará los esfuerzos razonables para mantener la plataforma disponible 24/7,
              pero no garantiza la ausencia de interrupciones por mantenimiento, fallos técnicos o causas
              de fuerza mayor.
            </p>
          </section>

          <section>
            <h2>12. Ley aplicable y jurisdicción</h2>
            <p>
              Estos Términos se rigen por la legislación española. Para cualquier controversia, las partes
              se someten a los Juzgados y Tribunales de Madrid, sin perjuicio de los fueros imperativos
              que pudieran corresponder al consumidor.
            </p>
          </section>

          <section>
            <h2>13. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos Términos, escríbenos a{' '}
              <a href={`mailto:${EMAIL_LEGAL}`} className="text-primary-600 hover:underline">{EMAIL_LEGAL}</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-100 px-6 py-8 text-center">
        <div className="flex flex-wrap justify-center gap-4 text-sm text-zinc-400">
          <Link href="/" className="hover:text-zinc-600">Inicio</Link>
          <Link href="/privacidad" className="hover:text-zinc-600">Privacidad</Link>
          <Link href="/cookies" className="hover:text-zinc-600">Cookies</Link>
        </div>
      </footer>
    </div>
  )
}
