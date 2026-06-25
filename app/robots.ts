import { MetadataRoute } from 'next'
import { getPublicAppUrl } from '@/lib/config/app-url'

const BASE_URL = getPublicAppUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/admin/',
        '/cuenta/',
        '/api/',
        '/auth/',
        '/centro/*/reservar',
        '/checkout',
        '/carrito',
        '/pedido/',
        '/bono/confirmado/',
        '/reserva/confirmada/',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
