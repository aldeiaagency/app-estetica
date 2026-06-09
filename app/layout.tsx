import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | Belleza Local',
    default: 'Belleza Local — Reserva en centros de belleza cerca de ti',
  },
  description:
    'Encuentra y reserva en los mejores centros de belleza, estética, peluquería y bienestar cerca de ti. Disponibilidad real. Sin llamar.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'),
  openGraph: {
    siteName: 'Belleza Local',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
