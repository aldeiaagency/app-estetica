import { getPublicAppUrl } from '@/lib/config/app-url'
import { sendTransactionalEmail } from './client'

function authEmailLayout(title: string, body: string, buttonLabel: string, buttonUrl: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:36px auto;background:#ffffff;border:1px solid #d8dee9;border-radius:14px;overflow:hidden;">
    <div style="padding:28px 30px;border-bottom:1px solid #edf1f7;">
      <strong style="color:#2355c8;font-size:18px;">Belleza Local</strong>
    </div>
    <div style="padding:30px;">
      <h1 style="margin:0 0 12px;color:#0c1324;font-size:24px;line-height:1.2;">${title}</h1>
      <p style="margin:0 0 24px;color:#46546b;font-size:15px;line-height:1.7;">${body}</p>
      <a href="${buttonUrl}" style="display:inline-block;background:#2355c8;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:13px 20px;border-radius:8px;">${buttonLabel}</a>
      <p style="margin:24px 0 0;color:#8b96aa;font-size:12px;line-height:1.6;">Si el boton no funciona, copia esta URL en tu navegador:<br>${buttonUrl}</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendEmailVerification(params: { to: string; name?: string | null; token: string }) {
  const appUrl = getPublicAppUrl()
  const url = `${appUrl}/auth/verify-email?email=${encodeURIComponent(params.to)}&token=${encodeURIComponent(params.token)}`
  const name = params.name ? `, ${params.name}` : ''

  return sendTransactionalEmail({
    to: params.to,
    subject: 'Confirma tu email en Belleza Local',
    html: authEmailLayout(
      'Confirma tu email',
      `Hola${name}. Confirma tu email para completar la seguridad de tu cuenta en Belleza Local.`,
      'Confirmar email',
      url
    ),
    text: `Confirma tu email en Belleza Local: ${url}`,
  })
}

export async function sendPasswordResetEmail(params: { to: string; token: string }) {
  const appUrl = getPublicAppUrl()
  const url = `${appUrl}/auth/reset-password?email=${encodeURIComponent(params.to)}&token=${encodeURIComponent(params.token)}`

  return sendTransactionalEmail({
    to: params.to,
    subject: 'Recupera tu contrasena de Belleza Local',
    html: authEmailLayout(
      'Recupera tu contrasena',
      'Hemos recibido una solicitud para cambiar la contrasena de tu cuenta. Este enlace caduca en 30 minutos.',
      'Cambiar contrasena',
      url
    ),
    text: `Cambia tu contrasena en Belleza Local: ${url}`,
  })
}
