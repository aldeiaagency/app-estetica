# Notificaciones — Belleza Local

## Principio económico

El coste de notificaciones debe escalar con el plan. Un negocio en Basic no puede costar más de lo que paga.

| Canal | Coste aprox | Disponible en |
|-------|------------|---------------|
| Email (Resend) | ~0,0001 €/email | Todos los planes |
| SMS (Twilio) | ~0,07-0,10 €/SMS | Add-on o Pro+ |
| WhatsApp API | ~0,005-0,01 €/msg | Add-on Growth+ |

Con 1.000 recordatorios/mes:
- Solo email: ~0,10 € total ✅
- SMS: ~70-100 € ❌ (no rentable en Basic 24€/mes)
- WhatsApp: ~5-10 € (rentable como add-on 29€/mes)

## Regla por plan

```
BASIC:
  - Email de confirmación de reserva → SIEMPRE
  - Email de cancelación (si cancela el negocio) → SIEMPRE
  - Email recordatorio 24h antes → desde cuenta/dominio de la plataforma
  - Sin WhatsApp, sin SMS
  - Sin personalización de asunto/remitente

PRO:
  - Todo Basic
  - Email recordatorio 1h antes
  - Email de solicitud de reseña post-visita
  - Email de lista de espera
  - Email de aviso de no-show al negocio
  - SMS opcional (add-on por consumo)

GROWTH:
  - Todo Pro
  - Campañas de email (reactivación de clientas)
  - WhatsApp como add-on (número propio del negocio)
  - Rebooking automático (add-on)

PREMIUM:
  - Todo Growth
  - WhatsApp personalizado
  - Automatizaciones avanzadas
  - Integración con herramientas externas
```

## Tipos de notificación y triggers

### Para el cliente final

| Trigger | Canal | Cuándo |
|---------|-------|--------|
| Reserva confirmada | Email | Inmediato |
| Reserva cancelada (por negocio) | Email | Inmediato |
| Recordatorio pre-cita | Email | 24h antes |
| Recordatorio pre-cita (Pro) | Email + SMS opcional | 1h antes |
| Enlace de modificación | Email | En confirmación |
| Enlace de cancelación | Email | En confirmación |
| Solicitud de reseña | Email | 2h post-servicio (Pro) |
| Notificación de lista de espera | Email | Al liberarse slot |

### Para el negocio

| Trigger | Canal | Cuándo |
|---------|-------|--------|
| Nueva reserva | Email | Inmediato |
| Cancelación de reserva | Email | Inmediato |
| Nuevo no-show | Email | Cuando se marca |
| Nueva reseña | Email | Inmediato (Pro) |

## Templates de email (React Email)

Usar React Email para crear templates React compilados a HTML compatible con todos los clientes de email.

### Estructura de templates

```
emails/
  confirmation.tsx      → Confirmación de reserva
  cancellation.tsx      → Cancelación
  reminder-24h.tsx      → Recordatorio 24h
  reminder-1h.tsx       → Recordatorio 1h
  review-request.tsx    → Solicitud de reseña
  business-new-booking.tsx  → Notificación al negocio
  business-cancellation.tsx → Cancelación al negocio
  waitlist-available.tsx    → Slot disponible
```

### Contenido mínimo de confirmation.tsx

```tsx
// emails/confirmation.tsx
export default function ConfirmationEmail({
  customerName,
  centerName,
  serviceName,
  staffName,
  startAt, // formateado en zona horaria Spain
  address,
  cancellationUrl,
}: ConfirmationEmailProps) {
  return (
    <Html>
      <Subject>Reserva confirmada — {centerName}</Subject>
      <Body>
        <Heading>Tu reserva está confirmada, {customerName}</Heading>
        <Text>{serviceName} con {staffName}</Text>
        <Text>{formatDate(startAt, 'Europe/Madrid')}</Text>
        <Text>{centerName} · {address}</Text>
        <Button href={cancellationUrl}>Cancelar reserva</Button>
        <Text>Cancelación gratuita hasta 24h antes</Text>
      </Body>
    </Html>
  )
}
```

## Dispatcher de notificaciones

```typescript
// lib/notifications/dispatcher.ts

export async function sendBookingConfirmation(booking: BookingWithRelations) {
  const org = booking.center.organization
  const plan = org.plan

  // Email siempre
  await sendEmail({
    to: booking.customer.email,
    template: 'confirmation',
    data: {
      customerName: booking.customer.name,
      centerName: booking.center.name,
      // ...
    },
  })

  // WhatsApp solo si el add-on está activo
  const hasWhatsApp = await hasActiveAddOn(org.id, 'WHATSAPP')
  if (hasWhatsApp && booking.customer.phone) {
    await sendWhatsApp({
      to: booking.customer.phone,
      template: 'confirmation',
      // ...
    })
  }
}
```

## Recordatorios automáticos (cron job)

Los recordatorios no se envían en tiempo real sino por un job programado:

```typescript
// Ejecutar cada hora (cron en Vercel o n8n)
// GET /api/cron/reminders (protegido con CRON_SECRET)

export async function GET(req: Request) {
  // Verificar CRON_SECRET
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const in24h = addHours(now, 24)
  const in25h = addHours(now, 25)

  // Buscar reservas confirmadas que empiecen en ~24h y sin recordatorio enviado
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      startAt: { gte: in24h, lt: in25h },
      reminderSentAt: null,
    },
    include: { customer: true, center: { include: { organization: true } }, service: true },
  })

  for (const booking of bookings) {
    await sendBookingReminder(booking)
    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSentAt: now },
    })
  }

  return Response.json({ sent: bookings.length })
}
```

## Configuración de Resend

```typescript
// lib/notifications/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  template,
  data,
}: SendEmailParams) {
  const { subject, html } = await renderTemplate(template, data)

  return resend.emails.send({
    from: process.env.EMAIL_FROM!,  // "Belleza Local <noreply@bellezalocal.es>"
    to,
    subject,
    html,
  })
}
```

## Opt-out y GDPR

- Todo email transaccional (confirmación, recordatorio) no requiere consentimiento explícito de marketing — es parte de la ejecución del contrato (reserva).
- Los emails de marketing (campañas, reactivación) sí requieren consentimiento explícito.
- El cliente puede hacer opt-out de emails de marketing en su perfil o con enlace en el email.
- El opt-out de recordatorios transaccionales no es obligatorio pero puede ofrecerse.
- Guardar `marketingEmailConsent: bool` y `marketingConsentDate: DateTime` en Customer.
