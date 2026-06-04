# Seguridad y GDPR — Belleza Local

## GDPR y LOPDGDD (España)

España aplica la LOPDGDD (Ley Orgánica 3/2018) que refuerza el GDPR en varios puntos. La AEPD (Agencia Española de Protección de Datos) es una de las DPAs más activas de Europa.

**Sanciones**: hasta 20 millones € o 4% de facturación global. La AEPD impuso más de 1.000 sanciones solo en 2025.

## Datos que SÍ recogemos (mínimos necesarios)

### Del cliente final
- Nombre completo (necesario para la reserva)
- Email (necesario para confirmación)
- Teléfono (necesario para confirmación y recordatorio)
- Historial de reservas propias (ejecución del contrato)
- Consentimiento de marketing (si el usuario lo da explícitamente)

### Del negocio (B2B)
- Nombre del negocio, dirección, contacto
- Servicios, horarios, precios (configurados por ellos)
- Datos de facturación para Stripe
- Datos básicos de los profesionales del centro

## Datos que NO recogemos

- Datos de salud, historial médico, diagnósticos
- Fotos médicas (antes/después con fines diagnósticos)
- Datos biométricos
- Datos de menores sin consentimiento parental (edad consentimiento digital: 14 años en España)
- Cookies de tracking sin consentimiento previo

## Bases legales para cada tratamiento

| Tratamiento | Base legal |
|-------------|-----------|
| Crear y gestionar reservas | Ejecución de contrato (art. 6.1.b GDPR) |
| Enviar confirmación y recordatorio | Ejecución de contrato |
| Facturación y contabilidad | Obligación legal (art. 6.1.c GDPR) |
| Enviar emails de marketing | Consentimiento explícito (art. 6.1.a GDPR) |
| Mejorar el servicio / analítica | Interés legítimo (art. 6.1.f GDPR) — documentar |
| Cumplir requerimientos legales | Obligación legal |

## Retención de datos

| Dato | Retención | Justificación |
|------|-----------|---------------|
| Datos de reservas | 3 años | Obligación fiscal española |
| Datos de facturación/pagos | 6 años | Ley General Tributaria España |
| Emails de marketing | Hasta retirada de consentimiento | GDPR art. 7 |
| Cuenta cancelada (datos básicos) | 30 días | Recuperación de cuenta |
| Logs de acceso | 6 meses | Obligación legal (LSSI) |
| Datos de sesión Auth.js | Hasta expiración (30 días) | Sesión activa |

## Derechos del usuario (ARCO + K+L)

Implementar mecanismo de ejercicio en `/cuenta/privacidad`:

| Derecho | Implementación |
|---------|---------------|
| Acceso | Descarga de todos los datos en JSON |
| Rectificación | Editar nombre, email, teléfono |
| Supresión ("derecho al olvido") | Borrar cuenta y datos asociados |
| Portabilidad | Exportar reservas en CSV/JSON |
| Oposición | Opt-out de emails de marketing |
| Limitación | Pausar uso de datos mientras se resuelve disputa |

## Implementación técnica de privacidad

### Separación estricta de datos entre tenants

```typescript
// SIEMPRE incluir organizationId/centerId en queries de datos de negocio
// NUNCA hacer:
const bookings = await prisma.booking.findMany() // ❌ expone TODOS los datos

// SIEMPRE hacer:
const bookings = await prisma.booking.findMany({
  where: { centerId: session.user.centerId } // ✅
})
```

### Hashing de contraseñas

Auth.js usa bcrypt por defecto. Nunca almacenar contraseñas en texto plano.

### Headers de seguridad HTTP

Configurar en `next.config.mjs`:

```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // ajustar según necesidades
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.resend.com",
    ].join('; ')
  },
]
```

### Cookies

- La cookie de sesión de Auth.js: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`.
- No almacenar datos sensibles en localStorage.
- Las cookies de analytics requieren consentimiento previo (banner de cookies).

### Cifrado de datos en tránsito

- HTTPS forzado: redirigir HTTP → HTTPS en Vercel automáticamente.
- HSTS en headers.

### Cifrado de datos en reposo

- Base de datos: cifrado a nivel de proveedor (Neon, Railway, etc. lo hacen por defecto).
- Imágenes: Cloudflare R2 cifra en reposo.

### Logs y auditoría

```typescript
// Registrar acciones sensibles
// NO registrar datos personales en logs (nombre, email, teléfono)
// SÍ registrar: qué acción, quién, cuándo, sobre qué entidad

logger.info({
  action: 'booking.created',
  actorId: session.user.id,
  bookingId: booking.id,
  centerId: booking.centerId,
  // NO incluir: customer.email, customer.name
})
```

## Textos legales obligatorios

Crear páginas con textos revisados por abogado antes de lanzar:

- `/legal/privacidad` — Política de Privacidad
- `/legal/cookies` — Política de Cookies
- `/legal/aviso-legal` — Aviso Legal (identificación de la empresa)
- `/legal/terminos` — Términos y Condiciones

**Importante**: Los textos de ejemplo/placeholder NO son válidos legalmente. Deben ser revisados por un abogado especializado en protección de datos antes de la publicación con usuarios reales.

## Banner de cookies (obligatorio en España)

- Bloquear cookies de terceros (analytics, tracking) hasta obtener consentimiento.
- Ofrecer aceptar/rechazar individualmente por categoría.
- Guardar preferencias de consentimiento con timestamp.
- No usar patrón de dark design (botón "Rechazar" igualmente visible).

Herramienta recomendada: implementación propia simple o CookieYes / Axeptio.

## DPAs (Data Processing Agreements)

Antes de usar servicios de terceros que procesen datos personales, firmar DPA:

- Resend: DPA disponible en su web
- Stripe: DPA incluido en sus términos
- Twilio: DPA disponible
- Vercel: DPA disponible
- Neon/Railway: verificar DPA antes de usar en producción

## Gestión de brechas de seguridad

Si hay una brecha que afecta datos personales:
1. Notificar a la AEPD en menos de 72 horas (art. 33 GDPR).
2. Si hay riesgo alto para las personas afectadas, notificarles directamente.
3. Documentar la brecha aunque no sea obligatorio notificar.

Implementar protocolo de incidentes antes de lanzar con usuarios reales.

## Riesgos y pendientes legales

- [ ] Revisar textos legales con abogado antes de lanzamiento
- [ ] Firmar DPAs con todos los proveedores
- [ ] Implementar banner de cookies conforme AEPD
- [ ] Definir política de retención y automatizar borrado
- [ ] Implementar exportación y borrado de datos desde `/cuenta`
- [ ] Revisar si aplica DPIA (Evaluación de Impacto) — probablemente no para negocios básicos de belleza
- [ ] Verificar tratamiento de datos de menores si aplica (edad mínima de uso)
