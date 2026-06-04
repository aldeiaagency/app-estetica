# CLAUDE.md — app-estetica (Belleza Local)

## Proyecto

SaaS + marketplace hiperlocal para belleza, estética y bienestar no médico.
Stack: Next.js 15 · TypeScript · Supabase (PostgreSQL) · Prisma · Tailwind CSS · Auth.js · Stripe · Resend
Deploy: Vercel (app) · Supabase (DB) · Cloudflare R2 (imágenes)

## Reglas de trabajo

- Trabaja siempre desde la raíz `app-estetica/`.
- No mezcles este proyecto con `aldeia-core` ni con otros proyectos.
- No hagas `git push` sin confirmación explícita del usuario.
- No hagas `deploy` sin confirmación explícita.
- No uses `bypassPermissions`.
- No guardes credenciales ni secretos. Usa `.env.example` como plantilla.
- No inventes que algo funciona si no lo has probado.
- Prisma + Supabase: usa `DATABASE_URL` (pooled, puerto 6543) para queries y `DIRECT_URL` (puerto 5432) para migraciones. Ver `docs/tecnico/infraestructura.md`.
- Prisma: ejecuta `npx prisma generate` tras cambios de schema. No modifiques `schema.prisma` sin considerar migraciones.
- Multi-tenant: todo dato de negocio lleva `centerId` u `organizationId`. Sin excepciones.
- Nunca expongas datos de un tenant a otro.

## Estructura clave

```
app/                  → Next.js App Router (frontend público + dashboard + admin)
components/           → Componentes React (marketing/, marketplace/, booking/, dashboard/, admin/, ui/)
lib/                  → Lógica de negocio (db/, auth/, availability/, notifications/, billing/, seo/)
prisma/schema.prisma  → Fuente de verdad del modelo de datos
docs/                 → Documentación de producto y técnica
backlog.md            → Tareas priorizadas
```

## Paneles

- **Frontend público**: `/` `/buscar` `/centros` `/centro/[slug]` `/promociones`
- **Dashboard negocio**: `/dashboard/*` — solo con sesión de rol BUSINESS
- **Admin plataforma**: `/admin/*` — solo con sesión de rol PLATFORM_ADMIN

## Comandos habituales

```bash
npm run dev           # desarrollo local
npx prisma studio     # explorar datos
npx prisma migrate dev --name nombre  # nueva migración
npx prisma generate   # regenerar cliente tras cambio de schema
npm run build         # build de producción
npm run lint          # lint
```

## Documentación extendida

- Producto: `docs/producto/`
- Técnico: `docs/tecnico/`
- Backlog: `backlog.md`

## Reglas por zona

Ver `.claude/rules/` para reglas específicas de frontend, backend, Prisma y SEO.
