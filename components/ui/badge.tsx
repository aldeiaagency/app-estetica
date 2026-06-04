import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
      {
        'bg-slate-100 text-slate-700': variant === 'default',
        'bg-green-100 text-green-700': variant === 'success',
        'bg-yellow-100 text-yellow-700': variant === 'warning',
        'bg-red-100 text-red-700': variant === 'danger',
        'bg-blue-100 text-blue-700': variant === 'info',
        'border border-slate-200 bg-white text-slate-600': variant === 'outline',
      },
      className
    )}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    CONFIRMED: { label: 'Confirmada', variant: 'success' },
    PENDING: { label: 'Pendiente', variant: 'warning' },
    CANCELLED: { label: 'Cancelada', variant: 'danger' },
    COMPLETED: { label: 'Completada', variant: 'info' },
    NO_SHOW: { label: 'No asistió', variant: 'danger' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={variant}>{label}</Badge>
}
