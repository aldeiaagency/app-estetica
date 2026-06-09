import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, as: Tag = 'div', padding = 'md' }: CardProps) {
  return (
    <Tag className={cn(
      'rounded-2xl border border-zinc-200 bg-white shadow-sm',
      {
        '':       padding === 'none',
        'p-4':    padding === 'sm',
        'p-6':    padding === 'md',
        'p-8':    padding === 'lg',
      },
      className
    )}>
      {children}
    </Tag>
  )
}

interface CardHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-zinc-100 pb-4 mb-4', className)}>
      <div>
        <h3 className="font-semibold text-zinc-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ElementType
  iconColor?: string
  href?: string
}

export function KpiCard({ label, value, sub, icon: Icon, iconColor = 'bg-primary-50 text-primary-600' }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      {Icon && (
        <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="text-3xl font-black tracking-tight text-zinc-900">{value}</div>
      <div className="mt-1 text-sm font-medium text-zinc-700">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>}
    </div>
  )
}
