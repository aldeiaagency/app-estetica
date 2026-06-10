import { describe, it, expect } from 'vitest'
import { formatPrice, formatDuration, slugify, CATEGORY_LABELS } from '@/lib/utils'

describe('formatPrice', () => {
  // toLocaleString('es-ES') may use narrow no-break space (U+202F) before €
  it('formats zero cents as 0,00 €', () => {
    const result = formatPrice(0)
    expect(result).toContain('0,00')
    expect(result).toContain('€')
  })
  it('formats 100 cents as 1,00 €', () => {
    const result = formatPrice(100)
    expect(result).toContain('1,00')
    expect(result).toContain('€')
  })
  it('formats 5900 cents as 59,00 €', () => {
    const result = formatPrice(5900)
    expect(result).toContain('59,00')
    expect(result).toContain('€')
  })
  it('formats 14999 cents as 149,99 €', () => {
    const result = formatPrice(14999)
    expect(result).toContain('149,99')
    expect(result).toContain('€')
  })
})

describe('formatDuration', () => {
  it('formats minutes under an hour', () => {
    expect(formatDuration(30)).toBe('30 min')
    expect(formatDuration(45)).toBe('45 min')
  })
  it('formats exactly 60 minutes as 1h', () => {
    expect(formatDuration(60)).toBe('1h')
  })
  it('formats 90 minutes', () => {
    expect(formatDuration(90)).toBe('1h 30min')
  })
  it('formats 120 minutes as 2h', () => {
    expect(formatDuration(120)).toBe('2h')
  })
})

describe('slugify', () => {
  it('lowercases text', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })
  it('replaces spaces with hyphens', () => {
    expect(slugify('peluquería madrid')).toBe('peluqueria-madrid')
  })
  it('removes accents', () => {
    expect(slugify('estética')).toBe('estetica')
    expect(slugify('Málaga')).toBe('malaga')
    expect(slugify('Córdoba')).toBe('cordoba')
  })
  it('trims leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })
  it('replaces multiple non-alphanumeric chars with single hyphen', () => {
    expect(slugify('hello & world!')).toBe('hello-world')
  })
  it('does not exceed 80 characters', () => {
    const long = 'a'.repeat(100)
    expect(slugify(long).length).toBeLessThanOrEqual(80)
  })
})

describe('CATEGORY_LABELS', () => {
  it('has all expected categories', () => {
    const expected = [
      'PELUQUERIA', 'ESTETICA', 'UNAS', 'CEJAS_PESTANAS',
      'DEPILACION', 'MASAJES', 'SPA', 'COSMETICA', 'BELLEZA_INTEGRAL', 'OTRO',
    ]
    for (const key of expected) {
      expect(CATEGORY_LABELS[key]).toBeDefined()
      expect(typeof CATEGORY_LABELS[key]).toBe('string')
    }
  })
  it('has non-empty labels', () => {
    for (const value of Object.values(CATEGORY_LABELS)) {
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
