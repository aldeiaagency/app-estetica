# Informe Fase 13 — Design System y UX/UI

**Fecha:** 2026-06-10
**Estado:** Completada
**Commit:** b0dc420

---

## 1. Objetivo de la fase

Unificar el design system, corregir tokens de color inconsistentes (slate/rose heredados), añadir componentes UI reutilizables, menú móvil funcional y tabla de precios mobile-friendly.

## 2. Archivos creados

| Archivo | Descripcion |
|---|---|
| `components/ui/card.tsx` | Card, CardHeader, KpiCard — wrappers de contenedor |

## 3. Archivos modificados

| Archivo | Cambio |
|---|---|
| `components/ui/button.tsx` | rose-600 → primary-600, slate → zinc, añadido ButtonLink (next/link) |
| `components/ui/badge.tsx` | slate → zinc/emerald/amber, StatusBadge ampliado (órdenes), PlanBadge nuevo |
| `components/ui/empty-state.tsx` | slate → zinc, <a> → <Link> de next/link |
| `components/ui/page-header.tsx` | slate → zinc |
| `components/ui/input.tsx` | rose/slate → primary/zinc |
| `components/ui/select.tsx` | rose/slate → primary/zinc |
| `components/ui/public-header.tsx` | Convertido a 'use client', useState menú hamburguesa/X funcional en móvil |
| `app/precios/page.tsx` | Tabla comparativa: desktop (overflow-x-auto) + móvil (<details> accordion por plan) |
| `app/(dashboard)/dashboard/reservas/page.tsx` | StatusBadge del componente en lugar de strings de clase inline |
| `app/(dashboard)/dashboard/pedidos/page.tsx` | StatusBadge del componente en lugar de strings de clase inline |
| `app/(dashboard)/dashboard/clientes/page.tsx` | EmptyState del componente en lugar de div dashed manual |

## 4. Decisiones tomadas

| Decision | Razon |
|---|---|
| Tokens primary/zinc en lugar de rose/slate | Coherencia con tailwind.config.ts ya definido desde Fase 0 |
| PublicHeader como client component | usePathname/useState requieren cliente; el header no tiene auth check |
| <details> accordion para tabla móvil | Sin dependencias JS extra, semántico, accesible |
| Ediciones quirúrgicas en páginas existentes | Aplicar componentes sin reescribir páginas completas — scope mínimo |

## 5. Errores encontrados

Ninguno — compilacion limpia desde el primer intento.

## 6. Verificaciones ejecutadas

- npx tsc --noEmit → 0 errores
- npx next lint --quiet → 0 warnings ni errores

## 7. Estado final

Completada — design system coherente, menú móvil operativo, tabla precios accesible en móvil, StatusBadge y EmptyState aplicados en 3+ páginas.

## 8. Recomendacion siguiente fase

Fase 14 — Seguridad/GDPR: páginas legales (/privacidad, /terminos, /cookies), Resend para emails transaccionales, rate limiting en endpoints públicos.
