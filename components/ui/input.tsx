import { cn } from '@/lib/utils'
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[#332b26]">
            {label}{props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-md border border-[#d7cbbb] bg-white px-4 py-2.5 text-sm text-[#171412] outline-none transition placeholder:text-[#9a8f84]',
            'focus:border-[#e36952] focus:ring-2 focus:ring-[#e36952]/15',
            'disabled:cursor-not-allowed disabled:bg-[#f7f4ef] disabled:text-[#9a8f84]',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#6c625a]">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[#332b26]">
            {label}{props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'min-h-[80px] w-full resize-y rounded-md border border-[#d7cbbb] bg-white px-4 py-2.5 text-sm text-[#171412] outline-none transition placeholder:text-[#9a8f84]',
            'focus:border-[#e36952] focus:ring-2 focus:ring-[#e36952]/15',
            error && 'border-red-400',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#6c625a]">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
