# Informe Fase 17 — Negocios demo completos y navegación web

**Fecha:** 2026-06-10
**Estado:** ✅ COMPLETADO (build limpio, seed aplicado en BD)

---

## Objetivo

1. La app no tenía ningún negocio para mostrar. Crear negocios demo completos:
   uno centrado en **servicios** y otro en **productos**, con perfiles 100% poblados.
2. Rediseñar el menú de navegación como una **web pública navegable** (servicios,
   marketplace, etc.), dejando el login/registro **solo para el momento de comprar o reservar**.

---

## 1. Negocios demo (seed reescrito)

`prisma/seed.mjs` reescrito para crear dos negocios completos e idempotentes:

### Negocio 1 — Peluquería Ana García (Madrid) · SERVICIOS
- Perfil completo: portada, galería (4 fotos), descripción larga, dirección + lat/lng, web, teléfonos.
- **9 servicios**, **4 profesionales** (con foto y bio), horarios Lun-Sáb.
- **ServiceStaff** vinculado (clave: sin esto el motor devolvía 0 slots — bug P0 histórico).
- **5 bonos**, **5 productos** de venta cruzada (categorizados), **2 promociones**.
- **18 reservas** repartidas en 3 meses (pasadas, semana, mes, 2 meses) + **6 reseñas**.
- Login negocio: `ana@bellezalocal.es` / `Demo2026!`

### Negocio 2 — Glow Lab Beauty Store (Valencia) · PRODUCTOS
- Perfil completo: portada, galería, descripción larga, dirección + lat/lng.
- **Catálogo de 18 productos** de marcas reales (The Ordinary, Clinique, MAC, ISDIN,
  Jo Malone, Moroccanoil…), todos **categorizados**, con imagen, multi-imagen y stock.
- 2 servicios (asesoría / maquillaje), 2 profesionales, horarios de tienda Lun-Sáb 10-21.
- **1 promoción**, **2 pedidos** demo (estados click & collect `COMPLETED` y `READY`) + 1 reseña.
- Login negocio: `tienda@glowlab.es` / `Demo2026!`

### Estado de la BD tras el seed
`2 centros · 11 servicios · 23 productos (todos con categoría) · 19 reservas · 7 reseñas · 2 pedidos · ciudades: Madrid, Valencia`

### Imágenes
Se usa `picsum.photos` (determinista por seed, siempre disponible) para no depender de
subidas reales en el demo. Añadidos `images.unsplash.com` y `picsum.photos` a
`next.config.mjs` → `images.remotePatterns` para que `next/image` los optimice.

---

## 2. Navegación web pública (`components/ui/public-header.tsx`)

Menú reorientado a experiencia tipo web, no a captación agresiva de registro:

| Antes | Ahora |
|---|---|
| Buscar centros · Para negocios | **Servicios** (/buscar) · **Marketplace** (/productos) · **Precios** · **Para negocios** |
| Botón "Registrarse" prominente | Quitado. Acceso discreto a **carrito** (icono) y **Mi cuenta** (icono → /cuenta) |

- El login/registro **solo se solicita al reservar, comprar o entrar en "Mi cuenta"**
  (el middleware redirige a `/auth/signin` únicamente en ese punto).
- Menú móvil con iconos y las mismas rutas.
- Solo enlaza a rutas existentes (verificado: no hay `/centros` ni `/promociones`).

---

## Efecto colateral positivo: SEO programático activo

Con datos reales, el sitemap y las páginas de localidad ya generan contenido:
`/s/madrid`, `/s/valencia`, `/s/madrid/peluqueria`, `/s/valencia/cosmetica` (SSG).

---

## Verificación

| Verificación | Resultado |
|---|---|
| `npm run build` | ✅ Limpio (incluye /s/madrid, /s/valencia) |
| Seed | ✅ Aplicado: 2 negocios completos |
| Productos categorizados | ✅ 23/23 |
| Menú | ✅ Web pública; login solo al comprar/reservar |

### Cómo re-sembrar
```bash
node --env-file=.env.local prisma/seed.mjs
```
