import { describe, expect, it } from 'vitest'
import { detectImageMime, validateAndSanitizeImage } from '@/lib/storage/image-validation'

describe('image binary validation', () => {
  it('detects supported formats from magic bytes rather than the filename', () => {
    expect(detectImageMime(Uint8Array.from([0xff, 0xd8, 0xff, 0xdb]))).toBe('image/jpeg')
    expect(detectImageMime(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(detectImageMime(new TextEncoder().encode('RIFF0000WEBP'))).toBe('image/webp')
    expect(detectImageMime(new TextEncoder().encode('0000ftypavif'))).toBe('image/avif')
    expect(detectImageMime(new TextEncoder().encode('<script>alert(1)</script>'))).toBeNull()
  })

  it('rejects files whose content is not an image', () => {
    expect(() => validateAndSanitizeImage(new TextEncoder().encode('not-an-image')))
      .toThrow(/contenido del archivo/i)
  })

  it('strips JPEG EXIF application segments', () => {
    const jpegWithExif = Uint8Array.from([
      0xff, 0xd8,
      0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
      0xff, 0xda, 0x00, 0x02,
      0xff, 0xd9,
    ])
    const result = validateAndSanitizeImage(jpegWithExif)
    expect(Array.from(result.bytes)).not.toContain(0xe1)
    expect(result.contentType).toBe('image/jpeg')
  })
})
