import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, name, ...props }, ref) => {
    const inputId = id ?? name
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm text-light-secondary dark:text-dark-secondary"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          name={name}
          className={cn(
            'rounded-xl border border-border-light bg-surface-light px-4 py-2.5 text-base text-light-primary outline-none transition-all duration-200 placeholder:text-light-secondary focus:border-brand-500',
            'dark:border-border-dark dark:bg-surface-dark-elevated dark:text-dark-primary dark:placeholder:text-dark-secondary',
            error && 'border-danger focus:border-danger',
            className,
          )}
          {...props}
        />
        {error ? <span className="text-sm text-danger">{error}</span> : null}
      </div>
    )
  },
)
Input.displayName = 'Input'
