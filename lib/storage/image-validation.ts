const MAX_BYTES = 5 * 1024 * 1024
const MAX_DIMENSION = 8000
const MIN_DIMENSION = 16

export type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'

export function detectImageMime(bytes: Uint8Array): SupportedImageMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, i) => bytes[i] === value)) return 'image/png'
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'image/webp'
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(bytes, 8, 12))) return 'image/avif'
  return null
}

export function validateAndSanitizeImage(bytes: Uint8Array) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
    throw new Error('La imagen debe pesar menos de 5 MB.')
  }
  const contentType = detectImageMime(bytes)
  if (!contentType) throw new Error('El contenido del archivo no es una imagen JPG, PNG, WebP o AVIF válida.')

  const dimensions = readDimensions(bytes, contentType)
  if (dimensions) {
    if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
      throw new Error('La imagen es demasiado pequeña.')
    }
    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
      throw new Error(`La imagen no puede superar ${MAX_DIMENSION} × ${MAX_DIMENSION} píxeles.`)
    }
  }

  return {
    contentType,
    dimensions,
    bytes: sanitizeMetadata(bytes, contentType),
  }
}

function readDimensions(bytes: Uint8Array, contentType: SupportedImageMime) {
  if (contentType === 'image/png' && bytes.length >= 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return { width: view.getUint32(16), height: view.getUint32(20) }
  }
  if (contentType === 'image/jpeg') return readJpegDimensions(bytes)
  if (contentType === 'image/webp') return readWebpDimensions(bytes)
  return null
}

function readJpegDimensions(bytes: Uint8Array) {
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue }
    const marker = bytes[offset + 1]
    if (marker === 0xda || marker === 0xd9) break
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (length < 2 || offset + 2 + length > bytes.length) break
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8],
      }
    }
    offset += 2 + length
  }
  return null
}

function readWebpDimensions(bytes: Uint8Array) {
  const chunk = ascii(bytes, 12, 16)
  if (chunk === 'VP8X' && bytes.length >= 30) {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    }
  }
  if (chunk === 'VP8L' && bytes.length >= 25) {
    const b1 = bytes[21]
    const b2 = bytes[22]
    const b3 = bytes[23]
    const b4 = bytes[24]
    return {
      width: 1 + (((b2 & 0x3f) << 8) | b1),
      height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
    }
  }
  return null
}

function sanitizeMetadata(bytes: Uint8Array, contentType: SupportedImageMime) {
  if (contentType === 'image/jpeg') return stripJpegMetadata(bytes)
  if (contentType === 'image/png') return stripPngMetadata(bytes)
  if (contentType === 'image/webp') return stripWebpMetadata(bytes)
  return bytes
}

function stripJpegMetadata(bytes: Uint8Array) {
  const output: number[] = [0xff, 0xd8]
  let offset = 2
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff || offset + 1 >= bytes.length) {
      output.push(...bytes.slice(offset))
      break
    }
    const marker = bytes[offset + 1]
    if (marker === 0xda) {
      output.push(...bytes.slice(offset))
      break
    }
    if (marker === 0xd9) { output.push(0xff, 0xd9); break }
    if (offset + 3 >= bytes.length) break
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (length < 2 || offset + 2 + length > bytes.length) break
    const strip = marker === 0xe1 || marker === 0xed || marker === 0xfe
    if (!strip) output.push(...bytes.slice(offset, offset + 2 + length))
    offset += 2 + length
  }
  return Uint8Array.from(output)
}

function stripPngMetadata(bytes: Uint8Array) {
  const output: number[] = [...bytes.slice(0, 8)]
  let offset = 8
  const allowed = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'cHRM', 'gAMA', 'sRGB'])
  while (offset + 12 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0)
    const end = offset + 12 + length
    if (end > bytes.length) break
    const type = ascii(bytes, offset + 4, offset + 8)
    if (allowed.has(type)) output.push(...bytes.slice(offset, end))
    offset = end
    if (type === 'IEND') break
  }
  return Uint8Array.from(output)
}

function stripWebpMetadata(bytes: Uint8Array) {
  const chunks: Uint8Array[] = []
  let offset = 12
  let size = 4
  while (offset + 8 <= bytes.length) {
    const type = ascii(bytes, offset, offset + 4)
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4).getUint32(0, true)
    const paddedLength = length + (length % 2)
    const end = offset + 8 + paddedLength
    if (end > bytes.length) break
    if (!['EXIF', 'XMP ', 'ICCP'].includes(type)) {
      const chunk = bytes.slice(offset, end)
      chunks.push(chunk)
      size += chunk.length
    }
    offset = end
  }
  const output = new Uint8Array(8 + size)
  output.set(new TextEncoder().encode('RIFF'), 0)
  new DataView(output.buffer).setUint32(4, size, true)
  output.set(new TextEncoder().encode('WEBP'), 8)
  let cursor = 12
  for (const chunk of chunks) { output.set(chunk, cursor); cursor += chunk.length }
  return output
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end))
}
