import { addMinutes, isAfter } from 'date-fns'

// Lógica pura del motor de disponibilidad — sin dependencias de Prisma ni de zona
// horaria — para poder testearla de forma determinista. El engine.ts la usa para
// la generación de slots y la detección de conflictos (lo que evita dobles reservas).

export interface Block {
  start: Date
  end: Date
}

export interface CandidateSlot {
  startAt: Date
  endAt: Date
}

/** Duración total que bloquea la agenda = buffer antes + servicio + buffer después. */
export function computeTotalDuration(s: {
  bufferMinutesBefore: number
  durationMinutes: number
  bufferMinutesAfter: number
}): number {
  return s.bufferMinutesBefore + s.durationMinutes + s.bufferMinutesAfter
}

/** Día de la semana con lunes=0 … domingo=6 (Date.getDay() usa domingo=0). */
export function localDayOfWeekMondayZero(date: Date): number {
  return date.getDay() === 0 ? 6 : date.getDay() - 1
}

/** Dos intervalos [aStart,aEnd) y [bStart,bEnd) se solapan. */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart
}

/** El slot [slotStart,slotEnd) choca con alguno de los bloques ocupados. */
export function hasConflict(slotStart: Date, slotEnd: Date, blocks: Block[]): boolean {
  return blocks.some(b => overlaps(slotStart, slotEnd, b.start, b.end))
}

/**
 * Genera los slots candidatos LIBRES dentro de la jornada laboral.
 * Avanza `cursor` en pasos de `granularityMinutes` y descarta:
 *  - slots que terminan después del cierre,
 *  - slots en el pasado (respecto a `now`),
 *  - slots que solapan con un bloque ocupado (reservas/bloqueos manuales).
 */
export function buildCandidateSlots(params: {
  workStartUTC: Date
  workEndUTC: Date
  totalDuration: number
  granularityMinutes: number
  now: Date
  occupiedBlocks: Block[]
}): CandidateSlot[] {
  const { workStartUTC, workEndUTC, totalDuration, granularityMinutes, now, occupiedBlocks } = params
  const slots: CandidateSlot[] = []
  let cursor = workStartUTC

  while (addMinutes(cursor, totalDuration) <= workEndUTC) {
    const slotStart = cursor
    const slotEnd = addMinutes(cursor, totalDuration)

    if (isAfter(slotStart, now) && !hasConflict(slotStart, slotEnd, occupiedBlocks)) {
      slots.push({ startAt: slotStart, endAt: slotEnd })
    }

    cursor = addMinutes(cursor, granularityMinutes)
  }

  return slots
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Código de confirmación de 8 caracteres sin ambigüedades (sin 0/O/1/I). */
export function generateConfirmationCode(rng: () => number = Math.random): string {
  return Array.from({ length: 8 }, () => CODE_CHARS[Math.floor(rng() * CODE_CHARS.length)]).join('')
}
