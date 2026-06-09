# Informe Fase 11 — IA Premium para Negocios

**Fecha:** 2026-06-10
**Estado:** Completada

---

## 1. Objetivo de la fase

Integrar IA generativa (Anthropic Claude) en el flujo de trabajo del negocio: generacion automatica de descripcion larga del centro y meta descripcion SEO, gateada por plan (Pro+).

## 2. Acciones planificadas

1. Instalar ai + @ai-sdk/anthropic (Vercel AI SDK)
2. lib/ai/client.ts - cliente Anthropic con claude-haiku-4-5-20251001
3. Actualizar lib/billing/plans.ts - campo hasAI (false en BASIC, true en PRO+)
4. app/actions/ai.ts - generateDescriptionAction + generateSeoDescriptionAction
5. components/dashboard/ai-btn.tsx - boton reutilizable con estado de carga y lock para BASIC
6. components/dashboard/centro-form.tsx - formulario cliente con botones IA integrados
7. Actualizar app/actions/dashboard.ts - descriptionLong en centerSchema y upsertCenterAction
8. Reescribir app/(dashboard)/dashboard/configuracion/page.tsx

## 3. Acciones ejecutadas

Todas las planificadas.

## 4. Archivos creados

| Archivo | Descripcion |
|---|---|
| `lib/ai/client.ts` | Provider Anthropic con claude-haiku-4-5-20251001 |
| `app/actions/ai.ts` | generateDescriptionAction (150-200 palabras) y generateSeoDescriptionAction (max 155 chars SEO) con gating de plan |
| `components/dashboard/ai-btn.tsx` | Boton IA reutilizable: spinner en carga, lock + link a /dashboard/plan si BASIC |
| `components/dashboard/centro-form.tsx` | Formulario cliente completo: estado controlado description + descriptionLong, botones IA, feedback de guardado |

## 5. Archivos modificados

| Archivo | Cambio |
|---|---|
| `lib/billing/plans.ts` | Añadido hasAI a PlanFeatures (false en BASIC, true en PRO/GROWTH/PREMIUM) |
| `app/actions/dashboard.ts` | centerSchema + upsertCenterAction ahora incluyen descriptionLong |
| `app/(dashboard)/dashboard/configuracion/page.tsx` | Usa CentroForm client component, pasa canUseAI desde plan de la org |
| `.env.example` | Añadida variable ANTHROPIC_API_KEY |

## 6. Decisiones tomadas

| Decision | Razon |
|---|---|
| claude-haiku-4-5-20251001 | Respuesta rapida (~1-2s) y coste bajo para UX en tiempo real. haiku es suficiente para generacion de texto de marketing |
| Sin streaming (texto completo) | MVP: loading state simple (spinner) es suficiente. Streaming requiere Server-Sent Events o API route adicional |
| Gating en server action (no solo en UI) | El boton locked es UX, pero la action verifica el plan en servidor para seguridad real |
| centerId requerido para IA | La IA necesita contexto del centro (nombre, ciudad, servicios). Sin centro guardado, el boton muestra aviso en lugar de bloquearse |
| Separar descripcion corta (SEO, 155 chars) y descripcion larga (publica, 150-200 palabras) | Usos distintos: la corta va al meta tag, la larga a la ficha publica |

## 7. Riesgos detectados

- Latencia de Anthropic API: si Claude tarda >5s, el usuario ve el spinner. Acceptable para MVP.
- Coste de API: haiku es barato (~$0.00025/1K tokens), pero si la base de usuarios crece mucho, monitorizar
- Prompts en castellano: los prompts instruyen a Claude a escribir en castellano. Si Claude responde en ingles, hay fallback de truncado a 155 chars pero no de idioma.

## 8. Errores encontrados

Ninguno - compilacion limpia desde el primer intento.

## 9. Verificaciones ejecutadas

- npx tsc --noEmit
- npx next lint --quiet

## 10. Resultado de verificaciones

- TypeScript: 0 errores
- ESLint: 0 warnings ni errores

## 11. Que queda pendiente

- Generacion de respuestas a resenas con IA (cuando exista la pagina /dashboard/resenas)
- Sugerencias de horarios con baja ocupacion
- Streaming de respuestas para mejor UX

## 12. Recomendacion de siguiente fase

Fase 12 - SEO programatico: sitemap dinamico, JSON-LD en fichas, paginas de categoria/localidad, robots.txt actualizado.

## 13. Estado final

Completada - IA generativa operativa en configuracion de centro, gateada por plan Pro+
