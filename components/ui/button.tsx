import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6df6] focus-visible:ring-offset-2',
          {
            'bg-[#2f6df6] text-white shadow-[0_14px_30px_rgba(47,109,246,0.22)] hover:bg-[#2559d8] active:scale-[0.98]': variant === 'primary',
            'bg-[#e5edff] text-[#0c1324] hover:bg-[#d9e6ff] active:scale-[0.98]': variant === 'secondary',
            'bg-transparent text-[#647089] hover:bg-[#edf3ff] hover:text-[#0c1324]': variant === 'ghost',
            'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]': variant === 'destructive',
            'border border-[#d8dee9] bg-white text-[#0c1324] hover:border-[#b9c4d5] hover:bg-[#f7f9fc]': variant === 'outline',
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3.5 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

interface ButtonLinkProps {
  href: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
  target?: string
  rel?: string
}

function ButtonLink({ href, variant = 'primary', size = 'md', className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6df6] focus-visible:ring-offset-2',
        {
          'bg-[#2f6df6] text-white shadow-[0_14px_30px_rgba(47,109,246,0.22)] hover:bg-[#2559d8] active:scale-[0.98]': variant === 'primary',
          'bg-[#e5edff] text-[#0c1324] hover:bg-[#d9e6ff] active:scale-[0.98]': variant === 'secondary',
          'bg-transparent text-[#647089] hover:bg-[#edf3ff] hover:text-[#0c1324]': variant === 'ghost',
          'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]': variant === 'destructive',
          'border border-[#d8dee9] bg-white text-[#0c1324] hover:border-[#b9c4d5] hover:bg-[#f7f9fc]': variant === 'outline',
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2.5 text-sm': size === 'md',
          'px-6 py-3.5 text-base': size === 'lg',
        },
        className
      )}
      {...rest}
    >
      {children}
    </Link>
  )
}

export { Button, ButtonLink }
