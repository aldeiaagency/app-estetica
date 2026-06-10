import { resend, EMAIL_FROM } from './client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'

function baseLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${previewText}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding-bottom:24px;text-align:center;">
            <a href="${APP_URL}" style="text-decoration:none;">
              <span style="font-size:20px;font-weight:900;color:#7c3aed;letter-spacing:-0.5px;">BellezaLocal</span>
            </a>
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding-top:24px;text-align:center;font-size:12px;color:#a1a1aa;">
            <a href="${APP_URL}/privacidad" style="color:#a1a1aa;">Privacidad</a> ·
            <a href="${APP_URL}/terminos" style="color:#a1a1aa;"> Términos</a> ·
            <a href="${APP_URL}/cookies" style="color:#a1a1aa;"> Cookies</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

interface BookingEmailParams {
  to: string
  customerName: string
  serviceName: string
  centerName: string
  centerSlug: string
  date: string
  time: string
  staffName?: string | null
}

export async function sendBookingConfirmation(params: BookingEmailParams) {
  const { to, customerName, serviceName, centerName, centerSlug, date, time, staffName } = params
  const profileUrl = `${APP_URL}/centro/${centerSlug}`

  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#18181b;">¡Reserva confirmada! ✅</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717a;">Hola ${customerName}, tu cita está reservada.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:28px;">
      <tr><td style="padding:6px 0;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Servicio</span><br/>
        <strong style="font-size:15px;color:#18181b;">${serviceName}</strong>
      </td></tr>
      <tr><td style="padding:6px 0;border-top:1px solid #e4e4e7;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Centro</span><br/>
        <strong style="font-size:15px;color:#18181b;">${centerName}</strong>
      </td></tr>
      <tr><td style="padding:6px 0;border-top:1px solid #e4e4e7;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Fecha y hora</span><br/>
        <strong style="font-size:15px;color:#18181b;">${date} · ${time}</strong>
      </td></tr>
      ${staffName ? `<tr><td style="padding:6px 0;border-top:1px solid #e4e4e7;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Profesional</span><br/>
        <strong style="font-size:15px;color:#18181b;">${staffName}</strong>
      </td></tr>` : ''}
    </table>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${profileUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">
        Ver mi reserva
      </a>
    </div>

    <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">
      Si necesitas cancelar o modificar tu cita, contacta directamente con el centro.<br/>
      ¡Hasta pronto! 💜
    </p>
    `,
    `Reserva confirmada: ${serviceName} en ${centerName}`
  )

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `✅ Reserva confirmada — ${serviceName} en ${centerName}`,
    html,
  })
}

export async function sendBookingCancellation(params: Omit<BookingEmailParams, 'staffName'> & { reason?: string }) {
  const { to, customerName, serviceName, centerName, date, time, reason } = params

  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#18181b;">Reserva cancelada</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717a;">Hola ${customerName}, tu reserva ha sido cancelada.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f2;border-radius:12px;padding:20px;margin-bottom:28px;border:1px solid #fecdd3;">
      <tr><td style="padding:6px 0;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Servicio cancelado</span><br/>
        <strong style="font-size:15px;color:#18181b;">${serviceName}</strong>
      </td></tr>
      <tr><td style="padding:6px 0;border-top:1px solid #fecdd3;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Centro</span><br/>
        <strong style="font-size:15px;color:#18181b;">${centerName}</strong>
      </td></tr>
      <tr><td style="padding:6px 0;border-top:1px solid #fecdd3;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Fecha</span><br/>
        <strong style="font-size:15px;color:#18181b;">${date} · ${time}</strong>
      </td></tr>
      ${reason ? `<tr><td style="padding:6px 0;border-top:1px solid #fecdd3;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Motivo</span><br/>
        <span style="font-size:15px;color:#71717a;">${reason}</span>
      </td></tr>` : ''}
    </table>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${APP_URL}/buscar" style="display:inline-block;background:#7c3aed;color:#ffffff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">
        Buscar otro horario
      </a>
    </div>

    <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">
      Si crees que esto es un error, contacta con el centro directamente.
    </p>
    `,
    `Reserva cancelada: ${serviceName} en ${centerName}`
  )

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Reserva cancelada — ${serviceName} en ${centerName}`,
    html,
  })
}

export async function sendBookingReminder(params: BookingEmailParams) {
  const { to, customerName, serviceName, centerName, centerSlug, date, time, staffName } = params
  const profileUrl = `${APP_URL}/centro/${centerSlug}`

  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#18181b;">Recordatorio de cita 🔔</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717a;">Hola ${customerName}, te recordamos que tienes una cita mañana.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;padding:20px;margin-bottom:28px;border:1px solid #ddd6fe;">
      <tr><td style="padding:6px 0;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Servicio</span><br/>
        <strong style="font-size:15px;color:#18181b;">${serviceName}</strong>
      </td></tr>
      <tr><td style="padding:6px 0;border-top:1px solid #ddd6fe;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Centro</span><br/>
        <strong style="font-size:15px;color:#18181b;">${centerName}</strong>
      </td></tr>
      <tr><td style="padding:6px 0;border-top:1px solid #ddd6fe;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Mañana a las</span><br/>
        <strong style="font-size:20px;color:#7c3aed;">${time}</strong>
        <span style="font-size:13px;color:#71717a;"> · ${date}</span>
      </td></tr>
      ${staffName ? `<tr><td style="padding:6px 0;border-top:1px solid #ddd6fe;">
        <span style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Con</span><br/>
        <strong style="font-size:15px;color:#18181b;">${staffName}</strong>
      </td></tr>` : ''}
    </table>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${profileUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">
        Ver información del centro
      </a>
    </div>

    <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">
      Si no puedes acudir, por favor cancela con antelación. ¡Gracias! 💜
    </p>
    `,
    `Recordatorio: ${serviceName} en ${centerName} mañana`
  )

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `🔔 Recordatorio: ${serviceName} en ${centerName} mañana`,
    html,
  })
}
