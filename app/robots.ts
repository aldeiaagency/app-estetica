import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'

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
