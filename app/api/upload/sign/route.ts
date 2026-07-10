import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Direct browser-to-storage uploads were retired because the object body could
 * not be inspected before becoming public. Use POST /api/upload/image, which
 * validates magic bytes, dimensions and metadata on the server.
 */
export function POST() {
  return NextResponse.json(
    {
      error: 'Esta ruta ha sido retirada. Usa el flujo de subida verificada.',
      replacement: '/api/upload/image',
    },
    {
      status: 410,
      headers: {
        'Cache-Control': 'no-store',
        'Deprecation': 'true',
      },
    },
  )
}
