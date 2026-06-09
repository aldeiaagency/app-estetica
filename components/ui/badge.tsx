import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'primary'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
      {
        'bg-zinc-100 text-zinc-700':              variant === 'default',
        'bg-emerald-50 text-emerald-700':         variant === 'success',
        'bg-amber-50 text-amber-700':             variant === 'warning',
        'bg-red-50 text-red-700':                 variant === 'danger',
        'bg-blue-50 text-blue-700':               variant === 'info',
        'border border-zinc-200 bg-white text-zinc-600': variant === 'outline',
        'bg-primary-50 text-primary-700':         variant === 'primary',
      },
      className
    )}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    CONFIRMED:  { label: 'Confirmada',  variant: 'success'  },
    PENDING:    { label: 'Pendiente',   variant: 'warning'  },
    CANCELLED:  { label: 'Cancelada',  variant: 'danger'   },
    COMPLETED:  { label: 'Completada', variant: 'info'     },
    NO_SHOW:    { label: 'No asistió', variant: 'danger'   },
    // Orders
    DELIVERED:  { label: 'Entregado',  variant: 'success'  },
    SHIPPED:    { label: 'Enviado',    variant: 'info'     },
    PROCESSING: { label: 'Procesando', variant: 'warning'  },
    REFUNDED:   { label: 'Reembolsado',variant: 'outline'  },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={variant}>{label}</Badge>
}

export function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    BASIC:   { label: 'Basic',   variant: 'default'  },
    PRO:     { label: 'Pro',     variant: 'primary'  },
    GROWTH:  { label: 'Growth',  variant: 'info'     },
    PREMIUM: { label: 'Premium', variant: 'warning'  },
  }
  const { label, variant } = map[plan] ?? { label: plan, variant: 'default' as const }
  return <Badge variant={variant}>{label}</Badge>
}
