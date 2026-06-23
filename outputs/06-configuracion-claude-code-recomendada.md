# 06 · Configuración de Claude Code recomendada

Objetivo: que pueda ejecutar de forma **controlada y repetible** gran parte del trabajo de configuración y mantenimiento, sin fricción ni riesgo.

---

## 1. Permisos (`.claude/settings.json`) — reducir prompts en operaciones seguras
Allowlist sugerida (solo lectura/seguras). Se propone, no se aplica sin tu OK:

```jsonc
{
  "permissions": {
    "allow": [
      "Bash(npx prisma migrate status)",
      "Bash(npx prisma validate)",
      "Bash(npx prisma generate)",
      "Bash(npm run type-check)",
      "Bash(npm run lint)",
      "Bash(npm run test)",
      "Bash(npm run build)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ],
    "deny": [
      "Bash(npx prisma migrate reset:*)",
      "Bash(npx prisma db push:*)",
      "Bash(vercel --prod:*)",
      "Bash(git push:*)"
    ]
  }
}
```
> Mantiene la regla del proyecto: nada de `push`/`deploy`/`migrate reset` sin tu confirmación.

## 2. Hooks (automatismos del harness)
| Hook | Cuándo | Qué hace |
|---|---|---|
| PostToolUse (Edit/Write en `prisma/schema.prisma`) | tras editar schema | recordatorio/ejecución de `npx prisma generate` |
| PreToolUse (Bash `git push`) | antes de push | recordar reglas del proyecto (no push sin OK) |
| Stop | al terminar | `npm run type-check` rápido si hubo cambios en `.ts` |

> Útil porque la regla "tras cambiar schema, `prisma generate`" hoy depende de recordarlo. Un hook lo garantiza.

## 3. Skills (slash commands del proyecto)
Propuestos en `.claude/skills/` para encapsular operaciones recurrentes de este proyecto:

- `/seed-pilot` — corre `npm run seed:pilot` con confirmación y resumen de filas creadas.
- `/vercel-env` — lista/compara variables de Vercel vs `.env.example` (qué falta), sin exponer valores.
- `/prisma-baseline` — ejecuta el baseline de las 9 migraciones con confirmación.
- `/release-check` — type-check + lint + test + build + migrate status, en un solo paso, antes de PR.
- `/smoke-prod` — golpea rutas clave de producción y reporta códigos HTTP.

> Ya existe `seo-geo-specialist` como skill: reutilizable para el trabajo SEO/GEO del marketplace.

## 4. Subagentes (de la librería disponible)
No hace falta crear nuevos; usar los existentes en tareas concretas:
- **Backend Architect / Database Optimizer** — baseline Prisma, índices, RLS Supabase.
- **Security Engineer** — rate limiting, revisión de webhook/secretos, RLS.
- **DevOps Automator** — Vercel envs, dominio, crons, CI.
- **Tracking & Measurement Specialist** — Sentry/PostHog, eventos de funnel.
- **Automation Governance Architect** — diseño de los workflows n8n (gobierno antes de construir).
- **Test Results Analyzer / API Tester** — cobertura del módulo beauty + e2e.
> Lanzar subagentes solo si tú lo pides explícitamente (coste). Para esta auditoría no se han usado.

## 5. MCP (servidores de herramientas)
- **Playwright MCP** — ya conectado. Lo usaré para smoke tests reales de los journeys (público sin auth; con auth tras tener cuentas de prueba).
- **Stripe MCP** (opcional) — para crear/inspeccionar productos/precios/webhooks por API una vez tengas la cuenta.
- **Supabase MCP** (opcional) — inspección de datos/RLS sin exponer la connection string.
- **n8n MCP** — la instancia AldeIA expone `/mcp-server/http`; útil para crear/listar workflows desde aquí (requiere autorizar).

## 6. CLAUDE.md — añadidos propuestos
Añadir a `CLAUDE.md` un bloque "Operación/producción" con:
- URLs reales (prod, Vercel, Supabase) e IDs de proyecto.
- Recordatorio: el build NO corre migraciones; se aplican con `migrate deploy` controlado.
- Estado de variables (qué falta) enlazando a `outputs/02`.
- Procedimiento de release (de `05`).

## 7. Cómo me dejas operar más autónomo (sin perder control)
1. Aprobar la allowlist de permisos (operaciones de solo lectura/verificación).
2. Aprobar los hooks de schema/typecheck.
3. Mantener en `deny` lo irreversible (push, deploy, migrate reset) → siempre te pregunto.
4. Para servicios externos, darme las keys cuando las tengas y yo configuro+pruebo.

> Todas estas propuestas son **archivos a crear/editar bajo tu aprobación**. No he tocado `.claude/` en esta auditoría.
