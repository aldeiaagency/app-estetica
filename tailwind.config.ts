import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#9d5c63',
        'brand-dark': '#7a4650',
        accent: '#3d7b73',
        muted: '#756b6b',
        border: '#eadfdc',
        surface: '#ffffff',
        background: '#fffaf7',
        foreground: '#211b1c',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
