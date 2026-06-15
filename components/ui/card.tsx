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
      'rounded-lg border border-[#d8dee9] bg-white shadow-[0_20px_55px_rgba(12,19,36,0.06)]',
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
    <div className={cn('mb-4 flex items-start justify-between gap-4 border-b border-[#e5eaf2] pb-4', className)}>
      <div>
        <h3 className="font-black text-[#0c1324]">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-[#647089]">{description}</p>}
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

export function KpiCard({ label, value, sub, icon: Icon, iconColor = 'bg-[#e5edff] text-[#2355c8]' }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-[#d8dee9] bg-white p-6 shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
      {Icon && (
        <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-md', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="text-3xl font-black tracking-tight text-[#0c1324]">{value}</div>
      <div className="mt-1 text-sm font-bold text-[#0c1324]">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-[#647089]">{sub}</div>}
    </div>
  )
}
