# Roles y Permisos — Belleza Local

## Roles del sistema

```
CUSTOMER          → Usuario final que reserva
BUSINESS          → Usuario de negocio (gestiona su centro)
BUSINESS_ADMIN    → Dueño de organización (puede gestionar múltiples centros)
PLATFORM_ADMIN    → Admin de la plataforma (equipo AldeIA)
```

## Matriz de permisos

### Frontend público (sin auth)

| Acción | Sin auth |
|--------|----------|
| Ver ficha de centro | ✅ |
| Ver servicios del centro | ✅ |
| Iniciar flujo de reserva | ✅ |
| Confirmar reserva | ✅ (guest) |
| Cancelar reserva por enlace | ✅ (con token) |
| Buscar centros | ✅ |
| Ver disponibilidad | ✅ |

### Usuario autenticado (CUSTOMER)

| Acción | CUSTOMER |
|--------|----------|
| Todo lo de sin auth | ✅ |
| Ver historial de reservas propias | ✅ |
| Modificar reserva propia | ✅ |
| Guardar favoritos | ✅ |
| Perfil de usuario | ✅ |

### Dashboard negocio (BUSINESS / BUSINESS_ADMIN)

| Acción | BUSINESS | BUSINESS_ADMIN |
|--------|----------|----------------|
| Ver reservas de su centro | ✅ | ✅ |
| Crear reserva manual | ✅ | ✅ |
| Cancelar/modificar reservas | ✅ | ✅ |
| Ver agenda | ✅ | ✅ |
| Gestionar servicios | ✅ | ✅ |
| Gestionar staff | ✅ | ✅ |
| Gestionar horarios | ✅ | ✅ |
| Ver clientes del centro | ✅ | ✅ |
| Ver analítica básica | ✅ | ✅ |
| Publicar ficha | ❌ (requiere aprobación admin) | ❌ |
| Cambiar plan | ❌ | ✅ |
| Contratar add-ons | ❌ | ✅ |
| Crear centros adicionales | ❌ | ✅ (si plan lo permite) |
| Gestionar otros centros de la org | ❌ | ✅ |
| Ver facturación | ❌ | ✅ |
| Configuración de organización | ❌ | ✅ |

### Admin plataforma (PLATFORM_ADMIN)

| Acción | PLATFORM_ADMIN |
|--------|----------------|
| Ver todos los centros | ✅ |
| Aprobar / publicar centros | ✅ |
| Bloquear / despublicar centros | ✅ |
| Cambiar plan de organización | ✅ |
| Activar/desactivar add-ons | ✅ |
| Gestionar categorías | ✅ |
| Gestionar localidades | ✅ |
| Control de indexación SEO | ✅ |
| Gestionar featured listings | ✅ |
| Ver métricas de plataforma | ✅ |
| Gestionar usuarios | ✅ |
| Moderar reseñas | ✅ |
| Ver audit log | ✅ |

## Implementación con Auth.js

```typescript
// lib/auth/config.ts

export const authConfig: NextAuthConfig = {
  callbacks: {
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as UserRole
      session.user.organizationId = token.organizationId as string | undefined
      session.user.centerId = token.centerId as string | undefined
      return session
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.centerId = user.centerId
      }
      return token
    },
  },
}
```

## Middleware de protección de rutas

```typescript
// middleware.ts (Next.js middleware)

export default auth((req) => {
  const { nextUrl, auth } = req
  const isLoggedIn = !!auth

  // Rutas del dashboard: requieren BUSINESS o BUSINESS_ADMIN
  if (nextUrl.pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) return Response.redirect(new URL('/auth/signin', nextUrl))
    if (!['BUSINESS', 'BUSINESS_ADMIN'].includes(auth.user.role)) {
      return Response.redirect(new URL('/', nextUrl))
    }
  }

  // Rutas del admin: requieren PLATFORM_ADMIN
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) return Response.redirect(new URL('/auth/signin', nextUrl))
    if (auth.user.role !== 'PLATFORM_ADMIN') {
      return Response.redirect(new URL('/', nextUrl))
    }
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/cuenta/:path*'],
}
```

## Validación en API routes

```typescript
// Patrón estándar en cualquier API route de negocio
export async function GET(req: Request, { params }: { params: { centerId: string } }) {
  const session = await auth()

  // 1. Autenticado
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  // 2. Tiene permisos para este centro
  const center = await prisma.center.findFirst({
    where: {
      id: params.centerId,
      organizationId: session.user.organizationId, // NUNCA omitir
    },
  })

  if (!center) return new Response('Not Found', { status: 404 })

  // 3. Verificar plan para funciones avanzadas
  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  })

  if (org?.plan === 'BASIC' && isFunctionRequiringPro(/* ... */)) {
    return new Response('Upgrade required', { status: 403 })
  }

  // ... lógica de negocio
}
```

## Aislamiento entre centros

Un usuario `BUSINESS` solo puede ver datos de centros de su organización.
Un usuario `BUSINESS_ADMIN` puede gestionar todos los centros de su organización.
Ningún usuario de negocio puede ver datos de otra organización.

Esta regla se hace cumplir añadiendo siempre `organizationId: session.user.organizationId` en los filtros de Prisma. El código reviewer debe verificar que ninguna query de negocio omite este filtro.

## Tokens de cancelación (sin auth)

Para que un cliente pueda cancelar sin tener cuenta:

```
bookingCancellationToken = hash(bookingId + secret + expiresAt)
URL: /cancelar?token=xyz&bookingId=abc
```

El token tiene una validez de 7 días desde la creación de la reserva. Después de esa fecha, el cliente debe contactar al negocio directamente.

## Audit log

Acciones que generan un registro en `AdminAuditLog`:

- Aprobación/bloqueo de centros
- Cambio de plan de organización
- Activación/desactivación de add-ons
- Borrado de reseñas
- Cambio de rol de usuario
- Acceso a datos de usuario por admin

```typescript
async function auditLog(ctx: {
  actorId: string
  action: string
  targetType: string
  targetId: string
  metadata?: Record<string, unknown>
}) {
  await prisma.adminAuditLog.create({ data: ctx })
}
```
