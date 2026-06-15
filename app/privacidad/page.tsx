import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Belleza Local',
  description: 'Política de privacidad y protección de datos de Belleza Local conforme al RGPD y la LOPDGDD.',
  robots: { index: false },
}

const LAST_UPDATED = '10 de junio de 2026'
const EMAIL_DPO = 'privacidad@bellezalocal.es'
const APP_URL = 'https://bellezalocal.es'

export default function PrivacidadPage() {
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
        <h1 className="text-3xl font-black tracking-tight text-[#0c1324]">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-[#8b96aa]">Última actualización: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-[#273244] [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#0c1324] [&_h2]:mb-3 [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:leading-relaxed">

          <section>
            <h2>1. Responsable del tratamiento</h2>
            <p>
              <strong>Belleza Local S.L.</strong> (en adelante, «Belleza Local» o «nosotros»), con domicilio social en España,
              es la entidad responsable del tratamiento de los datos personales recabados a través de {APP_URL}.
            </p>
            <p className="mt-3">
              Puede contactar con nosotros en: <a href={`mailto:${EMAIL_DPO}`} className="text-[#2f6df6] hover:underline">{EMAIL_DPO}</a>
            </p>
          </section>

          <section>
            <h2>2. Datos que recogemos</h2>
            <p>Recogemos los siguientes datos en función de cómo uses nuestra plataforma:</p>
            <ul>
              <li><strong>Registro de cuenta:</strong> nombre, correo electrónico, contraseña (hash bcrypt).</li>
              <li><strong>Reservas:</strong> nombre, email, teléfono del cliente; fecha, hora y servicio reservado.</li>
              <li><strong>Centros de belleza:</strong> nombre del negocio, dirección, teléfono, imágenes.</li>
              <li><strong>Pagos:</strong> procesados íntegramente por Stripe. No almacenamos datos de tarjeta.</li>
              <li><strong>Datos de uso:</strong> dirección IP, páginas visitadas, tipo de dispositivo (solo si activas analytics).</li>
            </ul>
          </section>

          <section>
            <h2>3. Finalidades y base jurídica</h2>
            <ul>
              <li><strong>Prestación del servicio</strong> (art. 6.1.b RGPD): gestionar tu cuenta, reservas, bonos y pedidos.</li>
              <li><strong>Comunicaciones transaccionales</strong> (art. 6.1.b RGPD): confirmaciones de reserva, cancelaciones y recordatorios por email.</li>
              <li><strong>Cumplimiento legal</strong> (art. 6.1.c RGPD): facturación, obligaciones contables y fiscales.</li>
              <li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): prevención de fraude, seguridad de la plataforma.</li>
              <li><strong>Consentimiento</strong> (art. 6.1.a RGPD): newsletters y comunicaciones comerciales (si te suscribes).</li>
            </ul>
          </section>

          <section>
            <h2>4. Plazo de conservación</h2>
            <ul>
              <li>Datos de cuenta activa: mientras mantengas la cuenta.</li>
              <li>Reservas y transacciones: 5 años (obligación fiscal, art. 30 LIVA).</li>
              <li>Logs de seguridad: 12 meses.</li>
              <li>Datos con consentimiento retirado: supresión en 30 días hábiles.</li>
            </ul>
          </section>

          <section>
            <h2>5. Destinatarios de los datos</h2>
            <p>Compartimos datos únicamente con los siguientes encargados del tratamiento, bajo contrato DPA:</p>
            <ul>
              <li><strong>Supabase Inc.</strong> — base de datos (EU region, Frankfurt)</li>
              <li><strong>Vercel Inc.</strong> — infraestructura web</li>
              <li><strong>Stripe Inc.</strong> — procesamiento de pagos</li>
              <li><strong>Resend Inc.</strong> — envío de emails transaccionales</li>
              <li><strong>Cloudflare Inc.</strong> — CDN y almacenamiento de imágenes</li>
            </ul>
            <p className="mt-3">No vendemos ni cedemos datos a terceros con fines comerciales.</p>
          </section>

          <section>
            <h2>6. Transferencias internacionales</h2>
            <p>
              Algunos proveedores están ubicados fuera del EEE. En estos casos, nos aseguramos de que existan
              garantías adecuadas (Decisión de Adecuación de la Comisión Europea, Cláusulas Contractuales Tipo o
              marcos equivalentes reconocidos por la AEPD).
            </p>
          </section>

          <section>
            <h2>7. Tus derechos</h2>
            <p>Conforme al RGPD y la LOPDGDD, tienes derecho a:</p>
            <ul>
              <li><strong>Acceso</strong> a tus datos personales.</li>
              <li><strong>Rectificación</strong> de datos inexactos.</li>
              <li><strong>Supresión</strong> («derecho al olvido»).</li>
              <li><strong>Oposición</strong> al tratamiento basado en interés legítimo.</li>
              <li><strong>Limitación</strong> del tratamiento.</li>
              <li><strong>Portabilidad</strong> de tus datos en formato estructurado.</li>
              <li><strong>No ser objeto</strong> de decisiones automatizadas con efectos jurídicos.</li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos, escribe a{' '}
              <a href={`mailto:${EMAIL_DPO}`} className="text-[#2f6df6] hover:underline">{EMAIL_DPO}</a>{' '}
              indicando tu identidad y el derecho que deseas ejercer.
              Responderemos en el plazo máximo de un mes (prorrogable a dos en casos complejos).
            </p>
            <p className="mt-3">
              Si consideras que el tratamiento infringe la normativa, puedes presentar una reclamación ante la{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-[#2f6df6] hover:underline">
                Agencia Española de Protección de Datos (AEPD)
              </a>.
            </p>
          </section>

          <section>
            <h2>8. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas para proteger tus datos: cifrado TLS en tránsito,
              cifrado AES-256 en reposo, control de acceso por roles (RBAC), auditoría de acciones administrativas,
              y revisiones de seguridad periódicas.
            </p>
          </section>

          <section>
            <h2>9. Cookies</h2>
            <p>
              Usamos exclusivamente cookies técnicas necesarias para el funcionamiento de la plataforma.
              Consulta nuestra{' '}
              <Link href="/cookies" className="text-[#2f6df6] hover:underline">Política de Cookies</Link>{' '}
              para más detalle.
            </p>
          </section>

          <section>
            <h2>10. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política para reflejar cambios en el servicio o en la normativa.
              Te notificaremos por email con al menos 15 días de antelación si los cambios son materiales.
              La versión vigente siempre estará disponible en{' '}
              <Link href="/privacidad" className="text-[#2f6df6] hover:underline">{APP_URL}/privacidad</Link>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#e5eaf2] px-6 py-8 text-center">
        <div className="flex flex-wrap justify-center gap-4 text-sm text-[#8b96aa]">
          <Link href="/" className="hover:text-[#46546b]">Inicio</Link>
          <Link href="/terminos" className="hover:text-[#46546b]">Términos</Link>
          <Link href="/cookies" className="hover:text-[#46546b]">Cookies</Link>
        </div>
      </footer>
    </div>
  )
}
