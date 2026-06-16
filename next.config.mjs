/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options',        value: 'DENY' },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          // Referrer control
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          // Disable unwanted browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
          },
          // DNS prefetch
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // HSTS — enforce HTTPS (1 year)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Basic CSP — allows Stripe, Google Fonts, and self
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "connect-src 'self' https: https://api.stripe.com https://eu.posthog.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
