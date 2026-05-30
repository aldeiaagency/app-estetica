# AGENTS.md

Instrucciones operativas para agentes de IA y Codex trabajando en este repositorio.

## Rol del proyecto

Este repositorio debe construir una app/landing para negocios de estética con foco en conversión, reservas y seguimiento comercial.

El objetivo no es crear una web decorativa. El objetivo es crear un activo que ayude a vender, captar consultas y ordenar la atención comercial.

## Criterios generales

- Priorizar simplicidad, velocidad y claridad.
- No sobrediseñar arquitectura antes de validar el MVP.
- No añadir dependencias sin necesidad funcional clara.
- Mantener textos orientados a cliente final, no a discurso técnico.
- Evitar claims no demostrables: resultados garantizados, promesas médicas, antes/después engañosos o presión comercial agresiva.
- Todo formulario debe tener consentimiento y tratamiento de datos planteado desde el diseño.

## Flujo de trabajo recomendado

1. Leer `docs/producto/brief-mvp.md`.
2. Revisar `docs/producto/estructura-paginas.md`.
3. Implementar en tareas pequeñas.
4. Ejecutar pruebas/lint/build cuando exista stack configurado.
5. Documentar cambios relevantes en el PR o commit.

## Estándares de implementación

Cuando exista código:

- Mantener componentes pequeños y legibles.
- Separar contenido, componentes y configuración cuando aporte claridad.
- Usar nombres de archivos descriptivos.
- No guardar secretos, tokens, credenciales ni URLs privadas en el repo.
- Preparar `.env.example` si se requieren variables de entorno.

## Criterios de QA

Antes de dar una tarea como terminada, comprobar:

- La página o funcionalidad responde al objetivo comercial definido.
- Los CTAs son visibles y claros.
- El flujo de contacto/reserva no genera fricción innecesaria.
- El diseño es responsive.
- No hay textos genéricos, inflados o incoherentes con negocio local.
- No se han introducido dependencias innecesarias.
