# Auditoria GDPR - Fase 8

Fecha: 2026-06-20

Alcance: datos nuevos introducidos por Beauty Profile, Beauty Plan, wallet, packs, seguimiento, rutinas, reposicion y marketplace curado.

Referencia externa usada: AEPD, "Ejerce tus derechos" (`https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos`).

## Inventario de datos B2C

| Area | Datos | Base propuesta | Retencion | Control implementado |
|---|---|---|---|---|
| Cuenta | nombre, email, password hash, rol | contrato | cuenta activa | exportacion JSON en `/api/account/export` |
| Reservas | cliente, email, telefono, servicio, fecha, estado | contrato / obligacion legal | segun necesidad operativa y legal | exportacion; no se borra con limpieza de personalizacion |
| Pedidos y bonos | datos de compra, estado, centro, articulos | contrato / obligacion legal | segun necesidad operativa y legal | exportacion; no se borra con limpieza de personalizacion |
| Beauty Profile | objetivos, preferencias, presupuesto orientativo, estilo, preocupacion estetica | consentimiento | hasta retirada/borrado | checkbox explicito y borrado en `/cuenta` |
| Beauty Plan | recomendaciones, evitar, recordatorios, estado | consentimiento | hasta retirada/borrado | borrado en cascada desde Beauty Profile |
| Wallet | beneficios reclamados o guardados | consentimiento / contrato si hay beneficio | hasta retirada/borrado | borrado con personalizacion |
| Rutina y reposicion | productos guardados, avisos, fechas estimadas | consentimiento | hasta retirada/borrado | borrado con personalizacion |
| Marketing | consentimiento por email y centro | consentimiento separado | hasta retirada | retirada separada en `/cuenta` |

## Datos sensibles

- No se solicitan diagnosticos medicos, historial clinico ni datos de salud.
- Las opciones de piel/cabello se tratan como preferencias de belleza, no como diagnostico.
- Los textos visibles indican belleza no medica y evitan promesas de resultado.

## Derechos de la usuaria

- Acceso y portabilidad: descarga JSON desde `/cuenta`.
- Supresion parcial: borrado de Beauty Profile, Beauty Plan, wallet, rutina y reposicion desde `/cuenta`.
- Retirada de marketing: accion separada desde `/cuenta`.
- Supresion completa: se mantiene canal por email para revisar reservas, pedidos, bonos y obligaciones legales antes de eliminar cuenta.

## Riesgos pendientes

- Validar con asesor legal el plazo exacto de conservacion de transacciones y reservas.
- Definir flujo completo de cierre de cuenta si la usuaria quiere eliminar tambien credenciales.
- Confirmar politica para menores antes de piloto publico.
- Revisar DPA reales de proveedores antes de produccion.
- Revisar warnings conocidos de Auth.js/Jose en Edge Runtime antes de produccion.
