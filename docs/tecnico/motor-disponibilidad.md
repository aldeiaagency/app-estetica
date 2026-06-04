# Motor de Disponibilidad — Belleza Local

## Principio

El motor de disponibilidad es la pieza más crítica de la plataforma. Una doble reserva o un slot incorrecto destruye la confianza. Debe ser:

1. **Correcto**: nunca permitir doble reserva.
2. **Rápido**: respuesta < 200ms para mostrar slots.
3. **Propio**: sin dependencia de Google Calendar ni calendario externo.
4. **Transaccional**: la creación de reserva usa `SELECT FOR UPDATE` o equivalente.

## Inputs del motor

```typescript
interface AvailabilityQuery {
  centerId: string
  serviceId: string
  staffId?: string     // null = cualquier profesional disponible
  date: Date           // día a consultar
  timezone?: string    // default: "Europe/Madrid"
}
```

## Outputs

```typescript
interface TimeSlot {
  time: string         // "09:00"
  startAt: Date        // UTC
  endAt: Date          // UTC (startAt + duración + buffer)
  staffId: string      // profesional asignado
  available: boolean
}
```

## Algoritmo de cálculo de slots

```
función getAvailableSlots(query):

1. CARGAR servicio
   → durationMinutes, bufferMinutesBefore, bufferMinutesAfter
   → serviceDuration = durationMinutes + bufferMinutesBefore + bufferMinutesAfter

2. RESOLVER staff elegible
   si query.staffId:
     staffList = [query.staffId]
   si no:
     staffList = Staff donde centerId=query.centerId Y tiene el servicio asignado

3. PARA CADA staff en staffList:

   a. OBTENER ventana de trabajo del día
      → Leer ScheduleRule para staff (o centro si no hay regla de staff) para ese dayOfWeek
      → Verificar ScheduleException para esa fecha exacta
      → Si isClosed=true → staff no disponible ese día
      → Si hay override de horario → usar ese horario
      → workStart = openTime, workEnd = closeTime

   b. OBTENER bloques ocupados del día
      occupiedBlocks = [
        ...reservas CONFIRMED/PENDING ese día para ese staff
           (con buffer incluido: startAt - bufferBefore, endAt + bufferAfter),
        ...ManualBlocks ese día para ese staff o centro,
      ]

   c. GENERAR candidatos de slots
      currentTime = workStart
      MIENTRAS currentTime + serviceDuration <= workEnd:
        slotEnd = currentTime + serviceDuration
        Si NO hay colisión con occupiedBlocks:
          añadir { time, startAt, endAt, staffId, available: true }
        currentTime += granularidad (15 min por defecto)

4. SI query.staffId fue null: MERGEAR slots de todos los staff
   → Si hay múltiples staff disponibles en el mismo horario, mostrar el slot una vez
   → Asignar el primer staff disponible (o el de menor carga ese día)

5. FILTRAR slots pasados (no mostrar horas ya pasadas si date=hoy)

6. RETORNAR lista de slots
```

## Detección de colisiones

```typescript
function hasCollision(
  slotStart: Date,
  slotEnd: Date,
  occupiedBlocks: { start: Date; end: Date }[]
): boolean {
  return occupiedBlocks.some(
    (block) => slotStart < block.end && slotEnd > block.start
  )
}
```

La colisión incluye buffers: si el servicio requiere 10 min de limpieza post-servicio (bufferAfter), el slot se extiende visualmente para los cálculos de colisión.

## Creación de reserva con bloqueo transaccional

La doble reserva se previene con una transacción que re-verifica disponibilidad antes de confirmar:

```typescript
async function createBooking(input: CreateBookingInput) {
  return await prisma.$transaction(async (tx) => {

    // 1. Re-verificar disponibilidad DENTRO de la transacción
    const conflicts = await tx.booking.count({
      where: {
        centerId: input.centerId,
        staffId: input.staffId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        // colisión de tiempo con buffer incluido
        AND: [
          { startAt: { lt: input.endAt } },
          { endAt: { gt: input.startAt } },
        ],
      },
    })

    if (conflicts > 0) {
      throw new Error('SLOT_TAKEN') // 409 Conflict en API
    }

    // 2. Crear o actualizar Customer
    const customer = await tx.customer.upsert({
      where: { email_centerId: { email: input.email, centerId: input.centerId } },
      create: {
        centerId: input.centerId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        consentGivenAt: new Date(),
      },
      update: { name: input.name, phone: input.phone },
    })

    // 3. Crear la reserva
    const booking = await tx.booking.create({
      data: {
        confirmationCode: generateConfirmationCode(),
        centerId: input.centerId,
        serviceId: input.serviceId,
        staffId: input.staffId,
        customerId: customer.id,
        startAt: input.startAt,
        endAt: input.endAt,
        status: 'CONFIRMED',
        source: 'WEB',
      },
    })

    return booking
  })
}
```

La clave es que el `count` de conflictos y el `create` de la reserva están en la misma transacción. PostgreSQL garantiza que no hay race condition si el isolation level es al menos `READ COMMITTED` (el default de PostgreSQL).

Para mayor seguridad ante carga alta, se puede usar `SERIALIZABLE` o un `SELECT FOR UPDATE` explícito en queries críticas.

## Caché de disponibilidad

**No cachear disponibilidad real-time**. Las páginas de slots deben usar `cache: 'no-store'`.

Lo que sí se puede cachear (con revalidación corta, ~5 min):
- Horarios del centro y del staff (cambian raramente).
- Lista de servicios del centro.
- Excepciones de horario ya pasadas (festivos del año anterior).

## Casos edge contemplados

| Caso | Comportamiento |
|------|---------------|
| Staff sin horario configurado | Se usa el horario del centro como fallback |
| Centro cerrado ese día (ScheduleException isClosed) | Retorna lista vacía |
| Servicio sin staff asignado | Error: servicio no disponible para reserva |
| Slot a medianoche (servicios nocturnos) | Manejo correcto si closeTime > "00:00" usando día siguiente |
| Zona horaria DST (cambio de hora) | Convertir siempre desde/hacia UTC con date-fns-tz |
| Buffer supera el cierre del centro | No generar ese slot (bufferMinutesAfter incluido en slotEnd) |
| Reserva pasada marcada como NO_SHOW | No bloquea slots futuros |
| Lista de espera | WaitlistEntry separado, no bloquea slots |

## Restricciones de cabinas/recursos (Fase 2)

Cuando se añadan Resources (cabinas), la lógica de colisión se extiende para verificar también que el recurso requerido esté libre:

```typescript
// Además de verificar colisión de staff, verificar:
if (service.resourceId) {
  const resourceConflicts = await tx.booking.count({
    where: {
      resourceId: service.resourceId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      AND: [
        { startAt: { lt: input.endAt } },
        { endAt: { gt: input.startAt } },
      ],
    },
  })
  if (resourceConflicts > 0) throw new Error('RESOURCE_TAKEN')
}
```

## Tests del motor

El motor de disponibilidad debe tener tests unitarios completos antes de ir a producción:

- Slots correctos para horario estándar (lunes a viernes 9-20h)
- Sin slots cuando el día está cerrado
- Sin slots cuando el staff tiene ManualBlock
- Colisión detectada correctamente con buffer
- No colisión en slots adyacentes (fin de uno = inicio del otro con buffer)
- Race condition: dos requests concurrentes para el mismo slot → solo una triunfa
- DST: fecha de cambio de hora (última semana de marzo y octubre)
- Granularidad correcta (slots cada 15, 30 o 60 min según configuración)
