import { describe, it, expect } from 'vitest'
import {
  cityToSlug,
  slugToCity,
  categoryToSlug,
  slugToCategory,
} from '@/lib/seo/metadata'

describe('cityToSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(cityToSlug('Madrid')).toBe('madrid')
    expect(cityToSlug('San Sebastián')).toBe('san-sebastian')
  })
  it('removes diacritics', () => {
    expect(cityToSlug('Málaga')).toBe('malaga')
    expect(cityToSlug('Córdoba')).toBe('cordoba')
    expect(cityToSlug('Cádiz')).toBe('cadiz')
    expect(cityToSlug('Gijón')).toBe('gijon')
    expect(cityToSlug('Coruña')).toBe('coruna')
  })
  it('handles multiple spaces', () => {
    expect(cityToSlug('Las  Palmas')).toBe('las-palmas')
  })
  it('removes special characters', () => {
    expect(cityToSlug("L'Hospitalet")).toBe('lhospitalet')
  })
})

describe('slugToCity', () => {
  it('capitalizes each word', () => {
    expect(slugToCity('madrid')).toBe('Madrid')
    expect(slugToCity('san-sebastian')).toBe('San Sebastian')
    expect(slugToCity('las-palmas')).toBe('Las Palmas')
  })
  it('round-trips simple cities', () => {
    const cities = ['Barcelona', 'Valencia', 'Bilbao']
    for (const city of cities) {
      const slug = cityToSlug(city)
      expect(slugToCity(slug)).toBe(city)
    }
  })
})

describe('categoryToSlug', () => {
  it('lowercases and replaces underscores with hyphens', () => {
    expect(categoryToSlug('PELUQUERIA')).toBe('peluqueria')
    expect(categoryToSlug('CEJAS_PESTANAS')).toBe('cejas-pestanas')
    expect(categoryToSlug('BELLEZA_INTEGRAL')).toBe('belleza-integral')
  })
  it('handles all category values', () => {
    const categories = [
      'PELUQUERIA', 'ESTETICA', 'UNAS', 'CEJAS_PESTANAS',
      'DEPILACION', 'MASAJES', 'SPA', 'COSMETICA', 'BELLEZA_INTEGRAL', 'OTRO',
    ]
    for (const cat of categories) {
      const slug = categoryToSlug(cat)
      expect(slug).not.toContain('_')
      expect(slug).toBe(slug.toLowerCase())
    }
  })
})

describe('slugToCategory', () => {
  it('uppercases and replaces hyphens with underscores', () => {
    expect(slugToCategory('peluqueria')).toBe('PELUQUERIA')
    expect(slugToCategory('cejas-pestanas')).toBe('CEJAS_PESTANAS')
    expect(slugToCategory('belleza-integral')).toBe('BELLEZA_INTEGRAL')
  })
  it('round-trips all categories', () => {
    const categories = [
      'PELUQUERIA', 'ESTETICA', 'UNAS', 'CEJAS_PESTANAS',
      'DEPILACION', 'MASAJES', 'SPA', 'COSMETICA', 'BELLEZA_INTEGRAL', 'OTRO',
    ]
    for (const cat of categories) {
      expect(slugToCategory(categoryToSlug(cat))).toBe(cat)
    }
  })
})
