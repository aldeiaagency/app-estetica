import { describe, it, expect } from 'vitest'
import {
  computeTotalDuration,
  localDayOfWeekMondayZero,
  overlaps,
  hasConflict,
  buildCandidateSlots,
  bookingIntervalToBlock,
  generateConfirmationCode,
  type Block,
} from '@/lib/availability/slots'

const D = (iso: string) => new Date(iso)

describe('bookingIntervalToBlock', () => {
  it('usa el intervalo persistido sin volver a expandir buffers', () => {
    const startAt = D('2026-06-15T10:00:00Z')
    const endAt = D('2026-06-15T11:20:00Z')
    expect(bookingIntervalToBlock({ startAt, endAt })).toEqual({ start: startAt, end: endAt })
  })
})

describe('computeTotalDuration', () => {
  it('suma buffers antes y después de la duración del servicio', () => {
    expect(computeTotalDuration({ bufferMinutesBefore: 0, durationMinutes: 30, bufferMinutesAfter: 10 })).toBe(40)
    expect(computeTotalDuration({ bufferMinutesBefore: 5, durationMinutes: 60, bufferMinutesAfter: 15 })).toBe(80)
  })
  it('soporta servicios sin buffers', () => {
    expect(computeTotalDuration({ bufferMinutesBefore: 0, durationMinutes: 45, bufferMinutesAfter: 0 })).toBe(45)
  })
})

describe('localDayOfWeekMondayZero', () => {
  it('mapea domingo (getDay 0) a 6', () => {
    expect(localDayOfWeekMondayZero(D('2026-06-14T10:00:00'))).toBe(6) // domingo
  })
  it('mapea lunes a 0', () => {
    expect(localDayOfWeekMondayZero(D('2026-06-15T10:00:00'))).toBe(0) // lunes
  })
  it('mapea sábado a 5', () => {
    expect(localDayOfWeekMondayZero(D('2026-06-13T10:00:00'))).toBe(5) // sábado
  })
})

describe('overlaps', () => {
  it('detecta solapamiento parcial', () => {
    expect(overlaps(D('2026-06-15T10:00:00Z'), D('2026-06-15T11:00:00Z'),
                    D('2026-06-15T10:30:00Z'), D('2026-06-15T11:30:00Z'))).toBe(true)
  })
  it('NO solapa cuando se tocan en el borde (fin == inicio)', () => {
    expect(overlaps(D('2026-06-15T10:00:00Z'), D('2026-06-15T11:00:00Z'),
                    D('2026-06-15T11:00:00Z'), D('2026-06-15T12:00:00Z'))).toBe(false)
  })
  it('detecta contención total', () => {
    expect(overlaps(D('2026-06-15T10:00:00Z'), D('2026-06-15T12:00:00Z'),
                    D('2026-06-15T10:30:00Z'), D('2026-06-15T11:00:00Z'))).toBe(true)
  })
  it('NO solapa intervalos disjuntos', () => {
    expect(overlaps(D('2026-06-15T09:00:00Z'), D('2026-06-15T10:00:00Z'),
                    D('2026-06-15T11:00:00Z'), D('2026-06-15T12:00:00Z'))).toBe(false)
  })
})

describe('hasConflict', () => {
  const blocks: Block[] = [
    { start: D('2026-06-15T10:00:00Z'), end: D('2026-06-15T11:00:00Z') },
    { start: D('2026-06-15T14:00:00Z'), end: D('2026-06-15T15:00:00Z') },
  ]
  it('detecta conflicto con un bloque ocupado', () => {
    expect(hasConflict(D('2026-06-15T10:30:00Z'), D('2026-06-15T11:30:00Z'), blocks)).toBe(true)
  })
  it('no hay conflicto en hueco libre entre bloques', () => {
    expect(hasConflict(D('2026-06-15T11:00:00Z'), D('2026-06-15T12:00:00Z'), blocks)).toBe(false)
  })
  it('sin bloques nunca hay conflicto', () => {
    expect(hasConflict(D('2026-06-15T10:00:00Z'), D('2026-06-15T11:00:00Z'), [])).toBe(false)
  })
})

describe('buildCandidateSlots', () => {
  const PAST_NOW = D('2020-01-01T00:00:00Z') // siempre en el pasado → no filtra por "ahora"

  it('genera slots cada granularidad dentro de la jornada', () => {
    const slots = buildCandidateSlots({
      workStartUTC: D('2026-06-15T08:00:00Z'),
      workEndUTC:   D('2026-06-15T10:00:00Z'),
      totalDuration: 60,
      granularityMinutes: 30,
      now: PAST_NOW,
      occupiedBlocks: [],
    })
    // 08:00, 08:30, 09:00 → 09:00+60=10:00 cabe; 09:30+60=10:30 no cabe
    expect(slots.map(s => s.startAt.toISOString())).toEqual([
      '2026-06-15T08:00:00.000Z',
      '2026-06-15T08:30:00.000Z',
      '2026-06-15T09:00:00.000Z',
    ])
  })

  it('excluye slots que se solapan con una reserva existente', () => {
    const slots = buildCandidateSlots({
      workStartUTC: D('2026-06-15T08:00:00Z'),
      workEndUTC:   D('2026-06-15T11:00:00Z'),
      totalDuration: 60,
      granularityMinutes: 60,
      now: PAST_NOW,
      occupiedBlocks: [{ start: D('2026-06-15T09:00:00Z'), end: D('2026-06-15T10:00:00Z') }],
    })
    // candidatos 08:00, 09:00, 10:00 → 09:00 choca con la reserva
    expect(slots.map(s => s.startAt.toISOString())).toEqual([
      '2026-06-15T08:00:00.000Z',
      '2026-06-15T10:00:00.000Z',
    ])
  })

  it('no genera slots en el pasado', () => {
    const slots = buildCandidateSlots({
      workStartUTC: D('2026-06-15T08:00:00Z'),
      workEndUTC:   D('2026-06-15T10:00:00Z'),
      totalDuration: 60,
      granularityMinutes: 60,
      now: D('2026-06-15T08:30:00Z'), // "ahora" = 08:30 → descarta 08:00
      occupiedBlocks: [],
    })
    expect(slots.map(s => s.startAt.toISOString())).toEqual([
      '2026-06-15T09:00:00.000Z',
    ])
  })

  it('devuelve vacío si el servicio no cabe en la jornada', () => {
    const slots = buildCandidateSlots({
      workStartUTC: D('2026-06-15T08:00:00Z'),
      workEndUTC:   D('2026-06-15T08:30:00Z'),
      totalDuration: 60,
      granularityMinutes: 15,
      now: PAST_NOW,
      occupiedBlocks: [],
    })
    expect(slots).toEqual([])
  })

  it('un bloque que cubre toda la jornada deja cero slots', () => {
    const slots = buildCandidateSlots({
      workStartUTC: D('2026-06-15T08:00:00Z'),
      workEndUTC:   D('2026-06-15T10:00:00Z'),
      totalDuration: 30,
      granularityMinutes: 30,
      now: PAST_NOW,
      occupiedBlocks: [{ start: D('2026-06-15T07:00:00Z'), end: D('2026-06-15T11:00:00Z') }],
    })
    expect(slots).toEqual([])
  })
})

describe('generateConfirmationCode', () => {
  it('genera un código de 8 caracteres', () => {
    expect(generateConfirmationCode().length).toBe(8)
  })
  it('solo usa caracteres del set sin ambigüedades (sin 0,O,1,I)', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateConfirmationCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/)
    }
  })
  it('es determinista con un rng fijo', () => {
    const rng = () => 0 // siempre el primer carácter → 'A'
    expect(generateConfirmationCode(rng)).toBe('AAAAAAAA')
  })
})
