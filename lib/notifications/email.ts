import { Resend } from 'resend'
import { getPublicAppUrl } from '@/lib/config/app-url'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.EMAIL_FROM ?? 'BellezaLocal <noreply@bellezalocal.es>'
const APP_URL = getPublicAppUrl()

interface BookingConfirmationData {
  to: string
  customerName: string
  centerName: string
  serviceName: string
  staffName?: string | null
  startAt: Date
  confirmationCode: string
  centerSlug: string
}

export async function sendBookingConfirmation(data: BookingConfirmationData): Promise<void> {
  if (!resend) {
    console.log('[email] RESEND_API_KEY no configurado — email de confirmación no enviado')
    console.log('[email] Reserva:', data.confirmationCode, data.customerName, data.to)
    return
  }

  const dateStr = data.startAt.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid',
  })
  const timeStr = data.startAt.toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
  })

  const manageUrl = `${APP_URL}/reserva/confirmada/${data.confirmationCode}`

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#e11d48;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">✅ Reserva confirmada</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#475569;font-size:15px;">Hola <strong style="color:#0f172a;">${data.customerName}</strong>,</p>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;">Tu cita ha sido confirmada. Aquí tienes el resumen:</p>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;width:40%">Centro</td>
            <td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${data.centerName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Servicio</td>
            <td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${data.serviceName}</td>
          </tr>
          ${data.staffName ? `
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Profesional</td>
            <td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${data.staffName}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Fecha</td>
            <td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Hora</td>
            <td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${timeStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Código</td>
            <td style="padding:8px 0;color:#e11d48;font-size:15px;font-weight:800;font-family:monospace;">${data.confirmationCode}</td>
          </tr>
        </table>
      </div>

      <a href="${manageUrl}" style="display:block;background:#e11d48;color:#fff;text-align:center;padding:14px 24px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;margin-bottom:16px;">
        Ver confirmación y gestionar reserva
      </a>

      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
        Cancelación gratuita hasta 24h antes de la cita.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;color:#cbd5e1;font-size:11px;">BellezaLocal · Este email ha sido enviado automáticamente</p>
    </div>
  </div>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Reserva confirmada — ${data.centerName} · ${timeStr}`,
    html,
  })
}
