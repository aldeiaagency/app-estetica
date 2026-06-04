# Reglas — Frontend

- Mobile-first siempre. Diseña para 375px primero.
- Tailwind CSS v4 exclusivamente. Sin CSS-in-JS ni estilos inline complejos.
- Componentes en `components/`. No mezclar lógica de negocio con componentes UI.
- No usar `any` en TypeScript. Todos los props tipados.
- Imágenes: siempre `next/image` con `alt` descriptivo.
- Links internos: siempre `next/link`, no `<a>`.
- Formularios: siempre con label, validación Zod en server actions/API routes, consentimiento GDPR donde aplique.
- CTA principal siempre con contraste suficiente (WCAG AA).
- No añadir animaciones complejas sin justificación de UX.
- `cache: 'no-store'` en cualquier cosa relacionada con disponibilidad o reservas.
- `revalidate: 3600` en fichas de centros.
- `noindex` en páginas de flujo de reserva, dashboard, admin, cuenta.
