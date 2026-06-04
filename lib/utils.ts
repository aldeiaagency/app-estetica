import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', opts ?? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export const CATEGORY_LABELS: Record<string, string> = {
  PELUQUERIA: 'Peluquería',
  ESTETICA: 'Estética',
  UNAS: 'Uñas',
  CEJAS_PESTANAS: 'Cejas y Pestañas',
  DEPILACION: 'Depilación',
  MASAJES: 'Masajes',
  SPA: 'Spa',
  COSMETICA: 'Cosmética',
  BELLEZA_INTEGRAL: 'Belleza Integral',
  OTRO: 'Otro',
}
